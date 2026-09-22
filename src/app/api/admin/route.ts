import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createRazorpayOrder, calculateMilestoneAmounts } from '@/lib/razorpay'
import { sendNotification } from '@/lib/notifications'
import { formatCurrency, formatDate } from '@/lib/utils'

/**
 * POST /api/admin/assign-contractor
 * Admin assigns a contractor to a confirmed booking
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify admin role
    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { booking_id, contractor_id } = await req.json()
    if (!booking_id || !contractor_id) {
      return NextResponse.json({ error: 'booking_id and contractor_id are required' }, { status: 400 })
    }

    // Update booking
    const { data: booking, error } = await adminSupabase
      .from('bookings')
      .update({ contractor_id, status: 'assigned' })
      .eq('id', booking_id)
      .select('*, service:services(name, category)')
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: 'Failed to assign contractor' }, { status: 500 })
    }

    // Fetch homeowner and contractor details
    const [homeownerRes, contractorRes] = await Promise.all([
      adminSupabase.from('user_profiles').select('full_name, phone').eq('user_id', booking.homeowner_id).single(),
      adminSupabase.from('user_profiles').select('full_name, phone').eq('user_id', contractor_id).single(),
    ])

    const [homeownerAuthRes, contractorAuthRes] = await Promise.all([
      adminSupabase.auth.admin.getUserById(booking.homeowner_id),
      adminSupabase.auth.admin.getUserById(contractor_id),
    ])

    const homeownerName = homeownerRes.data?.full_name ?? 'Customer'
    const contractorName = contractorRes.data?.full_name ?? 'Contractor'
    const homeownerEmail = homeownerAuthRes.data.user?.email ?? ''
    const contractorEmail = contractorAuthRes.data.user?.email ?? ''

    const commonData = {
      booking_number: booking.booking_number,
      booking_id: booking.id,
      service_name: booking.service?.name ?? booking.service_category,
      scheduled_date: formatDate(booking.scheduled_date),
      scheduled_time: booking.scheduled_time,
      address: booking.address,
      contractor_name: contractorName,
    }

    // Notify homeowner
    sendNotification({
      event: 'booking_assigned',
      userId: booking.homeowner_id,
      bookingId: booking.id,
      data: { ...commonData, name: homeownerName, email: homeownerEmail },
      channels: ['email', 'sms'],
      email: homeownerEmail,
      phone: homeownerRes.data?.phone ?? '',
    }).catch(console.error)

    // Notify contractor
    sendNotification({
      event: 'booking_assigned',
      userId: contractor_id,
      bookingId: booking.id,
      data: { ...commonData, name: contractorName, email: contractorEmail, role: 'contractor' },
      channels: ['email', 'sms'],
      email: contractorEmail,
      phone: contractorRes.data?.phone ?? '',
    }).catch(console.error)

    return NextResponse.json({ success: true, booking })

  } catch (err) {
    console.error('[admin/assign-contractor]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/milestone-next
 * Admin or contractor triggers next milestone payment request
 */
export async function PUT(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase.from('user_profiles').select('role').eq('user_id', user.id).single()

    if (!['admin', 'contractor'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { booking_id, milestone_number, notes } = await req.json()

    // Mark milestone as completed
    const { data: milestone } = await adminSupabase
      .from('milestones')
      .update({ status: 'completed', completed_at: new Date().toISOString(), notes: notes ?? null })
      .eq('booking_id', booking_id)
      .eq('milestone_number', milestone_number)
      .select()
      .single()

    if (!milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })

    // Fetch booking
    const { data: booking } = await adminSupabase
      .from('bookings')
      .select('*, service:services(name)')
      .eq('id', booking_id)
      .single()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Create Razorpay order for this milestone payment
    const amounts = calculateMilestoneAmounts(booking.total_amount)
    const amountMap: Record<number, number> = { 1: amounts.milestone1, 2: amounts.milestone2, 3: amounts.milestone3 }
    const milestoneAmount = amountMap[milestone_number]
    const paymentType = `milestone_${milestone_number}` as 'milestone_1' | 'milestone_2' | 'milestone_3'

    const rzpOrder = await createRazorpayOrder({
      amount: milestoneAmount,
      receipt: `${booking_id}:milestone_${milestone_number}`,
      notes: { booking_id, milestone_number: String(milestone_number), payment_type: paymentType },
    })

    await adminSupabase.from('payments').insert({
      booking_id,
      milestone_id: milestone.id,
      razorpay_order_id: rzpOrder.id,
      amount: milestoneAmount,
      currency: 'INR',
      status: 'created',
      payment_type: paymentType,
    })

    // Notify homeowner payment is due
    const [homeownerRes, homeownerAuthRes] = await Promise.all([
      adminSupabase.from('user_profiles').select('full_name, phone').eq('user_id', booking.homeowner_id).single(),
      adminSupabase.auth.admin.getUserById(booking.homeowner_id),
    ])

    sendNotification({
      event: 'milestone_payment_due',
      userId: booking.homeowner_id,
      bookingId: booking_id,
      data: {
        name: homeownerRes.data?.full_name ?? 'Customer',
        email: homeownerAuthRes.data.user?.email ?? '',
        booking_number: booking.booking_number,
        booking_id,
        milestone_number: String(milestone_number),
        milestone_title: milestone.title,
        amount: formatCurrency(milestoneAmount),
      },
      channels: ['email', 'sms'],
      email: homeownerAuthRes.data.user?.email,
      phone: homeownerRes.data?.phone ?? '',
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      razorpay: {
        order_id: rzpOrder.id,
        amount: milestoneAmount * 100,
        currency: 'INR',
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
    })

  } catch (err) {
    console.error('[admin/milestone-next]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
