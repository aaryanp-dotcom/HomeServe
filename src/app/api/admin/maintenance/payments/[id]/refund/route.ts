import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/maintenance/auth'
import { refundMaintenancePaymentByOrder } from '@/lib/maintenance/payments'
import { refundRazorpayPayment } from '@/lib/razorpay'
import { logAdmin } from '@/lib/maintenance/audit'
import { rupees } from '@/lib/maintenance/format'

/**
 * POST /api/admin/maintenance/payments/:id/refund — refund a captured maintenance payment in full.
 *   razorpay → the refund is requested from Razorpay first; only then is the ledger updated
 *   offline  → the ledger is updated; returning the money is done by HomeServe outside the system
 * Refunding a membership cancels it; refunding a request charge re-opens the amount due.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin()
  if (!a.ok) return a.res
  const { admin, user } = a

  const { data: p } = await admin.from('maintenance_payments').select('*').eq('id', params.id).maybeSingle()
  if (!p) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  if (p.status !== 'captured') return NextResponse.json({ error: `Only a captured payment can be refunded (this one is ${p.status}).` }, { status: 409 })

  if (p.method === 'razorpay') {
    const keyId = process.env.RAZORPAY_KEY_ID ?? ''
    if (!/^rzp_(test|live)_[A-Za-z0-9]{8,}$/.test(keyId) || /placeholder/i.test(keyId) || !p.razorpay_payment_id) {
      return NextResponse.json({ error: 'Online refunds need live Razorpay keys.' }, { status: 503 })
    }
    try { await refundRazorpayPayment(p.razorpay_payment_id, Number(p.amount)) }
    catch (err) {
      console.error('[admin/refund] razorpay', err)
      return NextResponse.json({ error: 'Razorpay could not process the refund. Check the payment in the Razorpay dashboard.' }, { status: 502 })
    }
  }

  const r = await refundMaintenancePaymentByOrder(admin, p.razorpay_order_id)
  if (!r.ok) return NextResponse.json({ error: r.error ?? 'Could not record the refund' }, { status: 500 })
  await logAdmin(admin, user.id, { action: 'payment.refund', entity_type: 'maintenance_payment', entity_id: p.id, summary: `Refunded ${rupees(Number(p.amount))} (${p.method})`, details: { kind: p.kind, method: p.method } })
  return NextResponse.json({ ok: true, method: p.method })
}
