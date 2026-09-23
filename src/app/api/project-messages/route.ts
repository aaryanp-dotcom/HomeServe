import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET /api/project-messages?booking_id=xxx
export async function GET(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get('booking_id')
  if (!bookingId) return NextResponse.json({ error: 'booking_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Verify access
  const { data: profile } = await admin.from('user_profiles').select('role').eq('user_id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    const { data: booking } = await admin
      .from('bookings').select('id').eq('id', bookingId).eq('homeowner_id', user.id).single()
    if (!booking) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('project_messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[project-messages/list]', error.code, error.hint)
    return NextResponse.json({ error: 'Could not load messages' }, { status: 500 })
  }

  // Mark messages as read for the current reader
  if (!isAdmin) {
    // Mark HomeServe messages as read by homeowner
    await admin.from('project_messages')
      .update({ is_read: true })
      .eq('booking_id', bookingId)
      .eq('sender', 'homeserve')
      .eq('is_read', false)
  } else {
    // Mark homeowner messages as read by admin
    await admin.from('project_messages')
      .update({ is_read: true })
      .eq('booking_id', bookingId)
      .eq('sender', 'homeowner')
      .eq('is_read', false)
  }

  return NextResponse.json(data)
}

// POST /api/project-messages
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('role').eq('user_id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const body = await req.json()
  const { booking_id, body: msgBody, attachment_urls } = body
  if (!booking_id) return NextResponse.json({ error: 'booking_id required' }, { status: 400 })
  if (!msgBody && !(attachment_urls?.length)) {
    return NextResponse.json({ error: 'message body or attachment required' }, { status: 400 })
  }

  // Verify access
  if (!isAdmin) {
    const { data: booking } = await admin
      .from('bookings').select('id').eq('id', booking_id).eq('homeowner_id', user.id).single()
    if (!booking) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await admin.from('project_messages').insert({
    booking_id,
    sender: isAdmin ? 'homeserve' : 'homeowner',
    sender_id: user.id,
    body: msgBody ?? null,
    attachment_urls: attachment_urls ?? [],
    is_read: false,
  }).select().single()

  if (error) {
    console.error('[project-messages/create]', error.code, error.hint)
    return NextResponse.json({ error: 'Could not send the message' }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
