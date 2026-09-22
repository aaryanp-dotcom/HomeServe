import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/** PATCH /api/bookings/[id]/status — contractor updates job status */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await req.json()
  const allowed = ['in_progress', 'completed']
  if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 })

  const adminSupabase = createAdminClient()

  // Ensure contractor owns this booking
  const { data: booking } = await adminSupabase.from('bookings').select('contractor_id, status').eq('id', id).single()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.contractor_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updates: Record<string, unknown> = { status }
  if (status === 'completed') updates.completed_at = new Date().toISOString()

  const { data, error } = await adminSupabase.from('bookings').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ booking: data })
}
