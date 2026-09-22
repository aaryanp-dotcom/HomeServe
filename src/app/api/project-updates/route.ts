import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET /api/project-updates?booking_id=xxx — admin or homeowner
export async function GET(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get('booking_id')
  if (!bookingId) return NextResponse.json({ error: 'booking_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Check role
  const { data: profile } = await admin.from('user_profiles').select('role').eq('user_id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  let query = admin
    .from('project_updates')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    // Homeowner: verify booking ownership and only show public updates
    const { data: booking } = await admin
      .from('bookings').select('id').eq('id', bookingId).eq('homeowner_id', user.id).single()
    if (!booking) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    query = query.eq('is_public', true)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/project-updates — admin only
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { booking_id, category, title, description, photo_urls, is_public } = body
  if (!booking_id) return NextResponse.json({ error: 'booking_id required' }, { status: 400 })

  const { data, error } = await admin.from('project_updates').insert({
    booking_id,
    category: category ?? 'progress',
    title: title ?? null,
    description: description ?? null,
    photo_urls: photo_urls ?? [],
    is_public: is_public !== false,
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
