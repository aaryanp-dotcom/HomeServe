import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRazorpayOrder } from '@/lib/razorpay'

// POST /api/payments/milestone
// Homeowner initiates payment for a specific milestone
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { booking_id, milestone_number } = body

  if (!booking_id || !milestone_number) {
    return NextResponse.json({ error: 'booking_id and milestone_number are required' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Fetch booking — must belong to this homeowner
  const { data: booking, error: bookingError } = await adminSupabase
    .from('bookings')
    .select('id, homeowner_id, total_amount, paid_amount, booking_type, status')
    .eq('id', booking_id)
    .eq('homeowner_id', user.id)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.booking_type !== 'project') {
    return NextResponse.json({ error: 'Milestone payments only apply to project bookings' }, { status: 400 })
  }

  // Fetch the specific milestone
  const { data: milestone, error: msError } = await adminSupabase
    .from('milestones')
    .select('*')
    .eq('booking_id', booking_id)
    .eq('milestone_number', milestone_number)
    .single()

  if (msError || !milestone) {
    return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
  }

  if (milestone.status !== 'completed') {
    return NextResponse.json({ error: 'Milestone must be marked completed by the contractor before payment' }, { status: 400 })
  }

  // Check not already paid
  const { data: existingPayment } = await adminSupabase
    .from('payments')
    .select('id, status')
    .eq('booking_id', booking_id)
    .eq('payment_type', `milestone_${milestone_number}`)
    .single()

  if (existingPayment?.status === 'captured') {
    return NextResponse.json({ error: 'This milestone has already been paid' }, { status: 400 })
  }

  // Create Razorpay order for the milestone amount (in paise)
  const amountPaise = Math.round(milestone.amount * 100)
  const order = await createRazorpayOrder({
    amount: milestone.amount,
    currency: 'INR',
    receipt: `milestone_${booking.id}_${milestone_number}`,
  })

  // Upsert payment record
  await adminSupabase
    .from('payments')
    .upsert({
      booking_id: booking_id,
      milestone_id: milestone.id,
      razorpay_order_id: order.id,
      amount: milestone.amount,
      currency: 'INR',
      status: 'created',
      payment_type: `milestone_${milestone_number}`,
    }, { onConflict: 'booking_id,payment_type' })

  return NextResponse.json({
    success: true,
    razorpay: {
      order_id: order.id,
      amount: amountPaise,
      currency: 'INR',
    },
  })
}
