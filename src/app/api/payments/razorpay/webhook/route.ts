import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { settlePayment, failPayment, refundPayment, notifyHomeowner } from '@/lib/payments/settle'
import {
  isMaintenanceOrder, settleMaintenancePayment, failMaintenancePayment, refundMaintenancePayment, notifyMaintenancePayment,
} from '@/lib/maintenance/payments'

/**
 * POST /api/payments/razorpay/webhook
 * Authoritative payment confirmation. Signature-verified; every event is applied with
 * an atomic, idempotent SQL function, so Razorpay's retries are safe. Returns 200 for
 * events we deliberately ignore so Razorpay doesn't keep retrying them.
 */
export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') ?? ''

    if (!signature || !verifyWebhookSignature(body, signature)) {
      console.warn('[webhook] invalid Razorpay signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const type: string = event.event
    const payload = event.payload
    const admin = createAdminClient()

    if (type === 'payment.captured' || type === 'order.paid') {
      const pay = payload.payment?.entity
      const orderId = pay?.order_id ?? payload.order?.entity?.id
      if (!orderId) return NextResponse.json({ received: true, ignored: 'no order id' })
      // Maintenance orders live in their own ledger; everything else is the renovation flow, unchanged.
      if (await isMaintenanceOrder(admin, orderId)) {
        const m = await settleMaintenancePayment(admin, orderId, pay?.id ?? '', undefined, payload)
        if (m.ok && !m.already_settled) void notifyMaintenancePayment(admin, m, 'received')
        return NextResponse.json({ received: true, settled: m.ok, already_settled: m.already_settled ?? false, ledger: 'maintenance' })
      }
      const r = await settlePayment(admin, orderId, pay?.id ?? '', undefined, payload)
      if (r.ok && !r.already_settled) void notifyHomeowner(admin, r, 'payment_received')
      return NextResponse.json({ received: true, settled: r.ok, already_settled: r.already_settled ?? false })
    }

    if (type === 'payment.failed') {
      const orderId = payload.payment?.entity?.order_id
      if (!orderId) return NextResponse.json({ received: true, ignored: 'no order id' })
      if (await isMaintenanceOrder(admin, orderId)) {
        const m = await failMaintenancePayment(admin, orderId, payload)
        return NextResponse.json({ received: true, ignored: m.ignored ?? false, ledger: 'maintenance' })
      }
      const r = await failPayment(admin, orderId, payload)
      if (r.ok && !r.ignored) void notifyHomeowner(admin, r, 'payment_failed')
      return NextResponse.json({ received: true, ignored: r.ignored ?? false })
    }

    if (type === 'refund.created' || type === 'refund.processed') {
      const paymentId = payload.refund?.entity?.payment_id
      if (paymentId) {
        // Try the renovation ledger first; fall back to maintenance when the payment isn't there.
        const r = await refundPayment(admin, paymentId, payload)
        if (!r.ok && r.error === 'payment_not_found') await refundMaintenancePayment(admin, paymentId, payload)
      }
      return NextResponse.json({ received: true })
    }

    return NextResponse.json({ received: true, ignored: type })
  } catch (err) {
    console.error('[webhook]', err)
    // 500 makes Razorpay retry, which is safe because every operation is idempotent.
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
