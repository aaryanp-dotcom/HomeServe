import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { reviewSchema } from '@/lib/maintenance/schemas'

/**
 * Reviews are about HomeServe's work: either a completed renovation project or a completed
 * maintenance service. One review per customer per project / request. Only genuine customers
 * of a completed job can review it — nothing is seeded or generated.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = reviewSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }
    const { booking_id, maintenance_request_id, rating, comment } = parsed.data
    const admin = createAdminClient()

    if (booking_id) {
      const { data: booking } = await admin
        .from('bookings').select('id, contractor_id, status').eq('id', booking_id).eq('homeowner_id', user.id).maybeSingle()
      if (!booking) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      if (booking.status !== 'completed') {
        return NextResponse.json({ error: 'You can review a project once it is completed' }, { status: 400 })
      }
      const { data: review, error } = await admin
        .from('reviews')
        .upsert(
          { subject_type: 'project', booking_id, homeowner_id: user.id, contractor_id: booking.contractor_id ?? null, rating, comment },
          { onConflict: 'booking_id,homeowner_id' },
        ).select().single()
      if (error) {
        console.error('[reviews/create]', error)
        return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
      }
      // Legacy: keep an assigned professional's aggregate current so the contractor portal still works.
      if (booking.contractor_id) {
        const { data: all } = await admin.from('reviews').select('rating').eq('contractor_id', booking.contractor_id)
        if (all?.length) {
          const avg = all.reduce((s, r) => s + r.rating, 0) / all.length
          await admin.from('contractor_profiles').update({ rating: Math.round(avg * 10) / 10, total_jobs: all.length }).eq('user_id', booking.contractor_id)
        }
      }
      return NextResponse.json({ success: true, review }, { status: 201 })
    }

    const { data: req } = await admin
      .from('maintenance_requests').select('id, status').eq('id', maintenance_request_id!).eq('user_id', user.id).maybeSingle()
    if (!req) return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    if (!['completed', 'customer_confirmed', 'closed'].includes(req.status)) {
      return NextResponse.json({ error: 'You can review a service once the work is completed' }, { status: 400 })
    }
    const { data: review, error } = await admin
      .from('reviews')
      .upsert(
        { subject_type: 'maintenance', maintenance_request_id, homeowner_id: user.id, rating, comment },
        { onConflict: 'maintenance_request_id,homeowner_id' },
      ).select().single()
    if (error) {
      console.error('[reviews/create]', error)
      return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
    }
    return NextResponse.json({ success: true, review }, { status: 201 })
  } catch (err) {
    console.error('[reviews/create]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Published reviews only. Reviewer identity is reduced to a first name. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const bookingId = searchParams.get('booking_id')
  const requestId = searchParams.get('maintenance_request_id')

  const admin = createAdminClient()
  let query = admin
    .from('reviews')
    .select('id, rating, comment, subject_type, created_at, homeowner_id')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(50)
  if (bookingId) query = query.eq('booking_id', bookingId)
  if (requestId) query = query.eq('maintenance_request_id', requestId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Could not load reviews' }, { status: 500 })

  const ids = Array.from(new Set((data ?? []).map((r) => r.homeowner_id)))
  const { data: profiles } = ids.length ? await admin.from('user_profiles').select('user_id, full_name').in('user_id', ids) : { data: [] }
  const first = new Map((profiles ?? []).map((p) => [p.user_id, (p.full_name ?? '').split(' ')[0]]))
  return NextResponse.json({
    reviews: (data ?? []).map(({ homeowner_id, ...r }) => ({ ...r, reviewer: first.get(homeowner_id) || 'Customer' })),
  })
}
