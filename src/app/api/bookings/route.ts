import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createRazorpayOrder, calculateMilestoneAmounts } from '@/lib/razorpay'
import { bookingSchema } from '@/lib/validations'
import { sendNotification } from '@/lib/notifications'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { BookingType } from '@/types'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = bookingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const { service_id, booking_type, description, address, city, scheduled_date, scheduled_time, area_sqft } = parsed.data

    // Fetch service to get base price and category
    const adminSupabase = createAdminClient()
    const { data: service, error: svcError } = await adminSupabase
      .from('services')
      .select('*')
      .eq('id', service_id)
      .single()

    if (svcError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Per-sq-ft services are priced on the area supplied; the server does the multiplication.
    let total_amount = Number(service.base_price)
    if (service.price_unit === 'per_sqft') {
      if (!area_sqft) {
        return NextResponse.json({ error: `${service.name} is priced per sq ft — please enter the area` }, { status: 400 })
      }
      total_amount = Math.round(total_amount * area_sqft * 100) / 100
    }

    // Create booking
    const { data: booking, error: bookingError } = await adminSupabase
      .from('bookings')
      .insert({
        homeowner_id: user.id,
        service_id,
        service_category: service.category,
        booking_type: booking_type as BookingType,
        status: 'pending',
        description,
        address,
        city,
        scheduled_date,
        scheduled_time,
        total_amount,
        area_sqft: service.price_unit === 'per_sqft' ? area_sqft ?? null : null,
        paid_amount: 0,
        booking_number: '', // auto-set by trigger
      })
      .select('*')
      .single()

    if (bookingError || !booking) {
      console.error('[bookings/create]', bookingError?.code, bookingError?.hint)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Create Razorpay order for first payment
    // Instant: 100% upfront | Project: 20% first milestone
    const paymentAmount = booking_type === 'instant'
      ? total_amount
      : calculateMilestoneAmounts(total_amount).milestone1

    const rzpOrder = await createRazorpayOrder({
      amount: paymentAmount,
      receipt: booking_type === 'instant'
        ? booking.id
        : `${booking.id}:milestone_1`,
      notes: {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        booking_type,
        payment_type: booking_type === 'instant' ? 'booking_full' : 'milestone_1',
      },
    })

    // Record payment record in DB
    await adminSupabase.from('payments').insert({
      booking_id: booking.id,
      milestone_id: null, // linked after milestone created
      razorpay_order_id: rzpOrder.id,
      amount: paymentAmount,
      currency: 'INR',
      status: 'created',
      payment_type: booking_type === 'instant' ? 'booking_full' : 'milestone_1',
    })

    // Update booking with order id
    await adminSupabase.from('bookings').update({ razorpay_order_id: rzpOrder.id }).eq('id', booking.id)

    // Fetch homeowner profile for notifications
    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('full_name, phone, email:user_id')
      .eq('user_id', user.id)
      .single()

    const homeownerEmail = user.email ?? ''
    const homeownerPhone = profile?.phone ?? ''
    const homeownerName = profile?.full_name ?? 'Customer'

    // Send notifications (non-blocking)
    sendNotification({
      event: 'booking_created',
      userId: user.id,
      bookingId: booking.id,
      data: {
        name: homeownerName,
        email: homeownerEmail,
        booking_number: booking.booking_number,
        booking_id: booking.id,
        service_name: service.name,
        scheduled_date: formatDate(scheduled_date),
        total_amount: formatCurrency(total_amount),
      },
      channels: ['email', 'sms'],
      email: homeownerEmail,
      phone: homeownerPhone,
    }).catch(console.error)

    return NextResponse.json({
      booking,
      razorpay: {
        order_id: rzpOrder.id,
        amount: paymentAmount * 100, // paise for frontend
        currency: 'INR',
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
    }, { status: 201 })

  } catch (err) {
    console.error('[bookings/create]', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    let query = adminSupabase
      .from('bookings')
      .select(`
        *,
        service:services(id, name, category, image_url),
        homeowner:user_profiles!bookings_homeowner_profile_fkey(full_name, phone, avatar_url),
        contractor:user_profiles!bookings_contractor_profile_fkey(full_name, phone, avatar_url),
        milestones(*)
      `)
      .order('created_at', { ascending: false })

    // Scope by role
    if (profile?.role === 'homeowner') {
      query = query.eq('homeowner_id', user.id)
    } else if (profile?.role === 'contractor') {
      query = query.eq('contractor_id', user.id)
    }
    // admin gets all

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ bookings: data })
  } catch (err) {
    console.error('[bookings/list]', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
