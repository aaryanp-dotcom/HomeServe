import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { settlePayment, notifyHomeowner } from '@/lib/payments/settle'

/**
 * POST /api/payments  (client-side confirmation after the Razorpay modal succeeds)
 *
 * 1. Verifies the checkout signature.
 * 2. Confirms the payment belongs to the signed-in user (or an admin).
 * 3. Settles it atomically via the settle_payment() SQL function — idempotent, so a
 *    double click or a webhook arriving first never double-counts paid_amount.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    if (!verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature })) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('booking:bookings(homeowner_id)')
      .eq('razorpay_order_id', razorpay_order_id)
      .single()
    if (!payment) return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })

    const owner = (payment.booking as unknown as { homeowner_id: string } | null)?.homeowner_id
    if (owner !== user.id) {
      const { data: profile } = await admin.from('user_profiles').select('role').eq('user_id', user.id).single()
      if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await settlePayment(admin, razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if (!result.ok) return NextResponse.json({ error: result.error ?? 'Settlement failed' }, { status: 404 })

    if (!result.already_settled) void notifyHomeowner(admin, result, 'payment_received')

    return NextResponse.json({
      success: true,
      already_settled: result.already_settled ?? false,
      booking_status: result.booking_status,
      paid_amount: result.paid_amount,
    })
  } catch (err) {
    console.error('[payments]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
