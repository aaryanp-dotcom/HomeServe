import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/lib/maintenance/auth'
import { settleMaintenancePayment, notifyMaintenancePayment } from '@/lib/maintenance/payments'
import { logAdmin } from '@/lib/maintenance/audit'
import { snapshotOf, rupees } from '@/lib/maintenance/format'
import { notifyCustomer } from '@/lib/maintenance/notify'
import { fmtDate } from '@/lib/maintenance/format'

const schema = z.object({
  user_id: z.string().uuid(),
  property_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  mode: z.enum(['offline', 'complimentary']),
  amount: z.coerce.number().positive().max(10_000_000).optional(),
  reference: z.string().trim().max(120).optional(),
}).refine((v) => v.mode !== 'offline' || (v.amount && v.reference && v.reference.length >= 2), {
  message: 'Offline sales need the amount received and a payment reference', path: ['reference'],
})

/**
 * POST /api/admin/maintenance/memberships — HomeServe sells or grants a membership directly:
 *   offline        → money received outside Razorpay; recorded in the ledger and settled normally
 *   complimentary  → no payment; the membership is granted (and audited)
 * The plan is frozen into the membership like any online purchase.
 */
export async function POST(req: Request) {
  const a = await requireAdmin()
  if (!a.ok) return a.res
  const { admin, user } = a

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid membership', issues: parsed.error.issues }, { status: 400 })
  const v = parsed.data

  const [{ data: plan }, { data: prop }] = await Promise.all([
    admin.from('maintenance_plans').select('*').eq('id', v.plan_id).maybeSingle(),
    admin.from('customer_properties').select('id, label, address_line').eq('id', v.property_id).eq('user_id', v.user_id).maybeSingle(),
  ])
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (!prop) return NextResponse.json({ error: 'That home does not belong to this customer' }, { status: 404 })

  const { data: live } = await admin.from('maintenance_subscriptions').select('id').eq('property_id', v.property_id).in('status', ['active', 'upcoming']).limit(1)
  if (live?.length) return NextResponse.json({ error: 'This home already has a membership.' }, { status: 409 })
  await admin.from('maintenance_subscriptions').update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: 'Superseded by HomeServe' })
    .eq('property_id', v.property_id).eq('status', 'pending_payment')

  const price = v.mode === 'offline' ? v.amount! : 0
  const { data: sub, error } = await admin.from('maintenance_subscriptions').insert({
    user_id: v.user_id, plan_id: plan.id, property_id: v.property_id, status: 'pending_payment',
    plan_snapshot: snapshotOf(plan), price_paid: price, created_by: user.id,
  }).select('id').single()
  if (error || !sub) { console.error('[admin/memberships] insert', error); return NextResponse.json({ error: 'Could not create the membership' }, { status: 500 }) }

  if (v.mode === 'offline') {
    const orderId = `offline_${randomUUID()}`
    const { error: payErr } = await admin.from('maintenance_payments').insert({
      user_id: v.user_id, kind: 'membership', subscription_id: sub.id, razorpay_order_id: orderId, amount: price, status: 'created',
      method: 'offline', reference: v.reference, recorded_by: user.id, description: `${plan.name} membership (offline)`,
    })
    if (payErr) { await admin.from('maintenance_subscriptions').delete().eq('id', sub.id); return NextResponse.json({ error: 'Could not record the payment' }, { status: 500 }) }
    const r = await settleMaintenancePayment(admin, orderId, null)
    if (!r.ok) return NextResponse.json({ error: r.error ?? 'Could not activate the membership' }, { status: 500 })
    void notifyMaintenancePayment(admin, r, 'received')
  } else {
    const start = new Date()
    const end = new Date(start); end.setMonth(end.getMonth() + Number(plan.term_months))
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    await admin.from('maintenance_subscriptions').update({ status: 'active', start_date: iso(start), end_date: iso(end) }).eq('id', sub.id)
    void notifyCustomer(admin, v.user_id, 'membership_purchased', {
      plan_name: plan.name, property: `${prop.label} (${prop.address_line})`, start_date: fmtDate(iso(start)), end_date: fmtDate(iso(end)),
    }, { reference: { type: 'membership', id: sub.id } })
  }

  await logAdmin(admin, user.id, {
    action: v.mode === 'offline' ? 'membership.offline_sale' : 'membership.complimentary', entity_type: 'membership', entity_id: sub.id,
    summary: v.mode === 'offline' ? `Sold ${plan.name} membership offline for ${rupees(price)}` : `Granted ${plan.name} membership free of charge`,
    details: { plan: plan.code, reference: v.reference ?? null, amount: price },
  })
  return NextResponse.json({ ok: true, subscription_id: sub.id }, { status: 201 })
}
