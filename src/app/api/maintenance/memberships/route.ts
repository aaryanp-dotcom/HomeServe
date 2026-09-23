import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/maintenance/auth'
import { purchaseSchema } from '@/lib/maintenance/schemas'
import { createMaintenanceOrder, PaymentsNotConfigured } from '@/lib/maintenance/payments'
import { planPurchasable, snapshotOf } from '@/lib/maintenance/format'

/**
 * POST /api/maintenance/memberships — start buying a membership for one of the customer's homes.
 * Creates (or reuses) a pending subscription with a frozen plan snapshot, then a Razorpay
 * order. The subscription only becomes active when the payment settles.
 */
export async function POST(req: Request) {
  const a = await requireUser()
  if (!a.ok) return a.res
  const { admin, user } = a

  const parsed = purchaseSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Choose a plan and a property' }, { status: 400 })
  const { plan_id, property_id } = parsed.data

  const [{ data: plan }, { data: prop }] = await Promise.all([
    admin.from('maintenance_plans').select('*').eq('id', plan_id).maybeSingle(),
    admin.from('customer_properties').select('id').eq('id', property_id).eq('user_id', user.id).maybeSingle(),
  ])
  if (!prop) return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  if (!plan || !planPurchasable(plan)) return NextResponse.json({ error: 'This plan is not available to buy yet.' }, { status: 409 })

  if (plan.requires_homeserve_project) {
    const { count } = await admin.from('bookings').select('id', { count: 'exact', head: true })
      .eq('homeowner_id', user.id).eq('booking_type', 'project').eq('status', 'completed')
    if (!count) return NextResponse.json({ error: 'This plan is for homes renovated by HomeServe.' }, { status: 403 })
  }

  const { data: live } = await admin.from('maintenance_subscriptions').select('id, status')
    .eq('property_id', property_id).in('status', ['active', 'upcoming']).limit(1)
  if (live && live.length) return NextResponse.json({ error: 'This home already has a membership. Renew it from your membership page.' }, { status: 409 })

  const snapshot = snapshotOf(plan)
  const { data: pending } = await admin.from('maintenance_subscriptions').select('id')
    .eq('property_id', property_id).eq('status', 'pending_payment').maybeSingle()

  let subId = pending?.id as string | undefined
  if (subId) {
    await admin.from('maintenance_subscriptions').update({ plan_id, plan_snapshot: snapshot, price_paid: plan.annual_price }).eq('id', subId)
  } else {
    const { data: created, error } = await admin.from('maintenance_subscriptions').insert({
      user_id: user.id, plan_id, property_id, status: 'pending_payment', plan_snapshot: snapshot,
      price_paid: plan.annual_price, created_by: user.id,
    }).select('id').single()
    if (error || !created) {
      console.error('[memberships] insert', error?.code, error?.hint)
      return NextResponse.json({ error: 'Could not start the membership' }, { status: 500 })
    }
    subId = created.id
  }

  try {
    const razorpay = await createMaintenanceOrder(admin, {
      userId: user.id, kind: 'membership', subscriptionId: subId, amount: Number(plan.annual_price),
      description: `${plan.name} membership`, receipt: `mship_${subId!.replace(/-/g, '')}`,
    })
    return NextResponse.json({ success: true, subscription_id: subId, razorpay })
  } catch (err) {
    if (err instanceof PaymentsNotConfigured) return NextResponse.json({ error: err.message }, { status: 503 })
    console.error('[memberships] order', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Could not start the payment' }, { status: 500 })
  }
}
