import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// FIND-10: Validate the request body with an explicit schema.
const statusPatchSchema = z.object({
  status: z.enum(['in_progress', 'completed']),
})

/** PATCH /api/bookings/[id]/status — contractor updates job status */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // FIND-10: Validate the id path parameter is a UUID.
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bodyRaw = await req.json().catch(() => null)
  const parsed = statusPatchSchema.safeParse(bodyRaw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status transition', issues: parsed.error.issues }, { status: 400 })
  }
  const { status } = parsed.data

  const adminSupabase = createAdminClient()

  // Ensure contractor owns this booking
  const { data: booking } = await adminSupabase
    .from('bookings')
    .select('contractor_id, booking_type, status')
    .eq('id', id)
    .single()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.contractor_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // FIND-07: For project-type bookings, contractors may only set the status to
  // 'in_progress'. The 'completed' status on project bookings is set
  // automatically by the payment settlement function once all milestones are
  // paid (or by an admin). This prevents a contractor from self-marking work
  // as complete to pressure the homeowner into releasing final payment.
  if (booking.booking_type === 'project' && status === 'completed') {
    return NextResponse.json(
      { error: 'Project bookings can only be marked completed after all milestones are settled' },
      { status: 403 },
    )
  }

  const updates: Record<string, unknown> = { status }
  if (status === 'completed') updates.completed_at = new Date().toISOString()

  const { data, error } = await adminSupabase.from('bookings').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ booking: data })
}
