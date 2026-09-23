import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const { issue_category, description, preferred_visit_time, booking_id } = body

    if (!issue_category || !description) {
      return NextResponse.json({ error: 'issue_category and description are required' }, { status: 400 })
    }

    // FIND-08: Defence-in-depth ownership check.
    // When a booking_id is provided, verify at the application layer (not just RLS)
    // that the booking belongs to the authenticated user before allowing the insert.
    // This prevents a scenario where a relaxed RLS policy would allow a user to
    // associate a warranty request with another user's booking.
    if (booking_id) {
      const admin = createAdminClient()
      const { data: booking } = await admin
        .from('bookings')
        .select('id, homeowner_id')
        .eq('id', booking_id)
        .single()

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      if (booking.homeowner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from('warranty_requests')
      .insert({
        user_id: user.id,
        booking_id: booking_id || null,
        issue_category,
        description,
        preferred_visit_time: preferred_visit_time || null,
        status: 'new',
      })
      .select('id, issue_category, status, created_at')
      .single()

    if (error) {
      console.error('warranty_requests insert error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('warranty-requests POST error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    let query = supabase
      .from('warranty_requests')
      .select('*')
      .order('created_at', { ascending: false })

    // Non-admin users only see their own requests
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('warranty-requests GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
