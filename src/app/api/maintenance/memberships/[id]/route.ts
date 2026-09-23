import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/maintenance/auth'
import { membershipActionSchema } from '@/lib/maintenance/schemas'
import { createMaintenanceOrder, PaymentsNotConfigured } from '@/lib/maintenance/payments'
import { daysUntil, planPurchasable, snapshotOf } from '@/lib/maintenance/format'
import { MEMBERSHIP_BILLING } from '@/lib/maintenance/config'

/**
 * POST /api/maintenance/memberships/:id — cancel, undo a cancellation, or renew.
 *
 * Cancel means "do not renew": benefits continue until the end date (cancel_at_period_end).
 * A membership still in checkout is simply abandoned. Refunds are a business decision and
 * are not automated here. Renewal is a fresh one-time payment for a new term (no auto-debit).
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const a = await requireUser()
  if (!a.ok) return a.res
  const { admin, user } = a

  const parsed = membershipActionSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  const act = parsed.data

  const { data: sub } = await admin.from('maintenance_subscriptions').select('*')
    .eq('id', params.id).eq('user_id', user.id).maybeSingle()
  if (!sub) return NextResponse.json({ error: 'Membership not found' }, { status: 404 })

  if (act.action === 'cancel') {
    if (sub.status === 'pending_payment') {
      await admin.from('maintenance_subscriptions').update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: act.reason ?? 'Abandoned before payment' })
        .eq('id', sub.id).eq('status', 'pending_payment')
      return NextResponse.json({ ok: true, status: 'cancelled' })
    }
    if (sub.status === 'active') {
      await admin.from('maintenance_subscriptions').update({ cancel_at_period_end: true, cancelled_at: new Date().toISOString(), cancellation_reason: act.reason ?? null })
        .eq('id', sub.id).eq('status', 'active')
      return NextResponse.json({ ok: true, status: 'active', cancel_at_period_end: true })
    }
    return NextResponse.json({ error: 'This membership cannot be cancelled here. Please contact HomeServe.' }, { status: 409 })
  }

  if (act.action === 'undo_cancel') {
    if (sub.status !== 'active' || !sub.cancel_at_period_end) return NextResponse.json({ error: 'Nothing to undo' }, { status: 409 })
    await admin.from('maintenance_subscriptions').update({ cancel_at_period_end: false, cancelled_at: null, cancellation_reason: null }).eq('id', sub.id)
    return NextResponse.json({ ok: true })
  }

  // renew
  if (!['active', 'expired'].includes(sub.status)) return NextResponse.json({ error: 'Only an active or expired membership can be renewed.' }, { status: 409 })
  if (sub.status === 'active') {
    const left = daysUntil(sub.end_date)
    if (left == null || left > MEMBERSHIP_BILLING.renewalWindowDays) {
      return NextResponse.json({ error: `Renewal opens ${MEMBERSHIP_BILLING.renewalWindowDays} days before the end date.` }, { status: 409 })
    }
  }
  const { data: clash } = await admin.from('maintenance_subscriptions').select('id')
    .eq('property_id', sub.property_id).in('status', ['upcoming', ...(sub.status === 'expired' ? ['active'] : [])]).limit(1)
  if (clash && clash.length) {
    return NextResponse.json({ error: 'A renewal for this home has already been paid, or the home has a current membership.' }, { status: 409 })
  }
  // An earlier renewal that was started but never paid is superseded by this one.
  await admin.from('maintenance_subscriptions').update({
    status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: 'Superseded by a new renewal attempt',
  }).eq('property_id', sub.property_id).eq('status', 'pending_payment')

  const { data: plan } = await admin.from('maintenance_plans').select('*').eq('id', sub.plan_id).maybeSingle()
  if (!plan || !planPurchasable(plan)) {
    return NextResponse.json({ error: 'This plan is no longer offered for renewal. Please contact HomeServe.' }, { status: 409 })
  }

  const { data: created, error } = await admin.from('maintenance_subscriptions').insert({
    user_id: user.id, plan_id: plan.id, property_id: sub.property_id, status: 'pending_payment',
    plan_snapshot: snapshotOf(plan), price_paid: plan.annual_price, renewed_from_id: sub.id, created_by: user.id,
  }).select('id').single()
  if (error || !created) {
    console.error('[memberships] renew insert', error?.code, error?.hint)
    return NextResponse.json({ error: 'Could not start the renewal' }, { status: 500 })
  }

  try {
    const razorpay = await createMaintenanceOrder(admin, {
      userId: user.id, kind: 'membership', subscriptionId: created.id, amount: Number(plan.annual_price),
      description: `${plan.name} membership renewal`, receipt: `mship_${created.id.replace(/-/g, '')}`,
    })
    return NextResponse.json({ success: true, subscription_id: created.id, razorpay })
  } catch (err) {
    // Do not leave an unpayable renewal blocking the next attempt.
    await admin.from('maintenance_subscriptions').update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: 'Payment could not be started' }).eq('id', created.id)
    if (err instanceof PaymentsNotConfigured) return NextResponse.json({ error: err.message }, { status: 503 })
    console.error('[memberships] renew order', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Could not start the payment' }, { status: 500 })
  }
}
