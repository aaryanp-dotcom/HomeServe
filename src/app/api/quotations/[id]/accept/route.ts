import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/quotations/[id]/accept
 *
 * Called when a homeowner accepts a quotation.
 * 1. Marks the quotation as accepted
 * 2. Flips the renovation_request to 'won'
 * 3. Creates a booking record (the project)
 * 4. Creates milestone records from the payment schedule
 *
 * Returns { booking_id } so the client can redirect to the advance payment page.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: quotationId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch quotation — RLS: customer can only see their own
  const { data: q, error: qErr } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', quotationId)
    .single()

  if (qErr || !q) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
  if (!['sent', 'viewed'].includes(q.status)) {
    return NextResponse.json({ error: `Cannot accept a quotation with status "${q.status}"` }, { status: 400 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  // 1. Mark quotation accepted
  await admin.from('quotations').update({ status: 'accepted', accepted_at: now }).eq('id', quotationId)

  // 2. Flip lead to won
  if (q.request_id) {
    await admin.from('renovation_requests').update({ status: 'won', won_at: now }).eq('id', q.request_id)
  }

  // 3. Create booking record
  const bookingNumber = 'HSP-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000)

  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .insert({
      booking_number:  bookingNumber,
      homeowner_id:    user.id,
      service_id:      null,                       // renovation — no catalogue entry
      service_category: 'Civil Work' as const,    // required enum, use closest match
      booking_type:    'project',
      status:          'payment_pending',
      description:     q.project_scope ?? q.project_title,
      address:         q.project_address,
      city:            q.project_address?.split(',').pop()?.trim() ?? 'Delhi',
      scheduled_date:  new Date().toISOString().slice(0, 10),
      scheduled_time:  '09:00',
      total_amount:    q.total_amount,
      paid_amount:     0,
      request_id:      q.request_id ?? null,
      quotation_id:    quotationId,
      project_title:   q.project_title,
      area_sqft:       q.project_area_sqft ?? null,
    })
    .select('id')
    .single()

  if (bookingErr || !booking) {
    console.error('booking insert error', bookingErr)
    return NextResponse.json({ error: 'Failed to create project record' }, { status: 500 })
  }

  // 4. Create milestones from payment schedule
  const schedule = (q.payment_schedule ?? []) as {
    milestone: string
    percentage: number
    amount: number
    description: string
  }[]

  if (schedule.length > 0) {
    const milestoneRows = schedule.map((item, idx) => ({
      booking_id:       booking.id,
      milestone_number: idx + 1,
      title:            item.milestone,
      description:      item.description,
      amount:           item.amount,
      percentage:       item.percentage,
      status:           'pending' as const,
      notes:            item.description,
    }))

    await admin.from('milestones').insert(milestoneRows)
  } else {
    // Fallback: standard 30/40/30 split
    const t = Number(q.total_amount)
    const m1 = Math.round(t * 0.30 * 100) / 100
    const m2 = Math.round(t * 0.40 * 100) / 100
    const m3 = Math.round((t - m1 - m2) * 100) / 100

    await admin.from('milestones').insert([
      { booking_id: booking.id, milestone_number: 1, title: 'Advance Payment', description: 'Project commencement advance', amount: m1, percentage: 30, status: 'pending', notes: 'Due on project confirmation' },
      { booking_id: booking.id, milestone_number: 2, title: 'Mid-Project Payment', description: 'Due at defined mid-stage completion', amount: m2, percentage: 40, status: 'pending', notes: 'Due after civil and carpentry completion' },
      { booking_id: booking.id, milestone_number: 3, title: 'Completion Payment', description: 'Final payment after walkthrough and handover', amount: m3, percentage: 30, status: 'pending', notes: 'Due after final walkthrough' },
    ])
  }

  return NextResponse.json({ booking_id: booking.id })
}
