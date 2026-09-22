import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/maintenance/auth'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { settleMaintenancePayment, notifyMaintenancePayment } from '@/lib/maintenance/payments'

/**
 * POST /api/maintenance/payments/verify — client confirmation after the Razorpay modal.
 * Same contract as /api/payments: verify the checkout signature, confirm the payment
 * belongs to the caller (or an admin), then settle atomically and idempotently. The
 * webhook remains the authoritative confirmation and may arrive first — that is safe.
 */
export async function POST(req: Request) {
  const a = await requireUser()
  if (!a.ok) return a.res
  const { admin, user, role } = a

  const body = await req.json().catch(() => null)
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {}
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
  }
  if (!verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature })) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  const { data: pay } = await admin.from('maintenance_payments').select('id, user_id').eq('razorpay_order_id', razorpay_order_id).maybeSingle()
  if (!pay) return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
  if (pay.user_id !== user.id && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const r = await settleMaintenancePayment(admin, razorpay_order_id, razorpay_payment_id, razorpay_signature)
  if (!r.ok) return NextResponse.json({ error: r.error ?? 'Settlement failed' }, { status: 404 })
  if (!r.already_settled) void notifyMaintenancePayment(admin, r, 'received')

  return NextResponse.json({ success: true, already_settled: r.already_settled ?? false, kind: r.kind })
}
