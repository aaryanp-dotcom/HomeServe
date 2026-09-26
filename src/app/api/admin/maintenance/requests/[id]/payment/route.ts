import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/lib/maintenance/auth'
import { settleMaintenancePayment, notifyMaintenancePayment } from '@/lib/maintenance/payments'
import { logAdmin } from '@/lib/maintenance/audit'
import { rupees } from '@/lib/maintenance/format'

const schema = z.object({
  amount: z.coerce.number().positive().max(10_000_000).optional(),
  reference: z.string().trim().min(2, 'Enter a reference (UPI id, cheque number, receipt no.)').max(120),
})

/**
 * POST /api/admin/maintenance/requests/:id/payment — record money received outside Razorpay
 * (UPI to the office, cash, cheque). It goes through the same settlement function as an online
 * payment, so the request, the ledger and the customer's history all agree.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await requireAdmin()
  if (!a.ok) return a.res
  const { admin, user } = a

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payment' }, { status: 400 })

  const { data: r } = await admin.from('maintenance_requests')
    .select('id, user_id, request_number, status, amount_due, payment_status').eq('id', id).maybeSingle()
  if (!r) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  if (r.status === 'cancelled') return NextResponse.json({ error: 'A cancelled request has nothing to pay.' }, { status: 409 })
  if (r.payment_status !== 'pending' || Number(r.amount_due) <= 0) return NextResponse.json({ error: 'Nothing is due on this request.' }, { status: 409 })

  const amount = parsed.data.amount ?? Number(r.amount_due)
  const orderId = `offline_${randomUUID()}`
  const { error } = await admin.from('maintenance_payments').insert({
    user_id: r.user_id, kind: 'request_charge', request_id: r.id, razorpay_order_id: orderId, amount, status: 'created',
    method: 'offline', reference: parsed.data.reference, recorded_by: user.id, description: `Service request ${r.request_number} (offline)`,
  })
  if (error) { console.error('[admin/payment] insert', error.code, error.hint); return NextResponse.json({ error: 'Could not record the payment' }, { status: 500 }) }

  const result = await settleMaintenancePayment(admin, orderId, null)
  if (!result.ok) return NextResponse.json({ error: result.error ?? 'Could not settle the payment' }, { status: 500 })
  await logAdmin(admin, user.id, { action: 'payment.offline', entity_type: 'maintenance_request', entity_id: r.id, summary: `Recorded offline payment of ${rupees(amount)} on ${r.request_number}`, details: { reference: parsed.data.reference, amount } })
  void notifyMaintenancePayment(admin, result, 'received')
  return NextResponse.json({ ok: true, needs_review: (result as { needs_review?: boolean }).needs_review ?? false })
}
