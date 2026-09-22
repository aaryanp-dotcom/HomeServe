import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/maintenance/auth'
import { logAdmin } from '@/lib/maintenance/audit'

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('record_inspection'), note: z.string().trim().max(500).optional() }),
  z.object({ action: z.literal('cancel'), reason: z.string().trim().max(500).optional() }),
])

/** POST /api/admin/maintenance/subscriptions/:id — record an included inspection, or cancel a membership. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin()
  if (!a.ok) return a.res
  const { admin, user } = a

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  const act = parsed.data

  const { data: sub } = await admin.from('maintenance_subscriptions').select('id, status, plan_snapshot').eq('id', params.id).maybeSingle()
  if (!sub) return NextResponse.json({ error: 'Membership not found' }, { status: 404 })

  if (act.action === 'record_inspection') {
    if (sub.status !== 'active') return NextResponse.json({ error: 'Inspections can only be recorded on an active membership.' }, { status: 409 })
    const total = Number((sub.plan_snapshot as { inspection_frequency_per_year?: number }).inspection_frequency_per_year ?? 0)
    const { data: used } = await admin.from('subscription_usage').select('quantity').eq('subscription_id', sub.id).eq('usage_type', 'inspection')
    const usedCount = (used ?? []).reduce((s, u) => s + u.quantity, 0)
    if (usedCount >= total) return NextResponse.json({ error: 'All included inspections have already been recorded.' }, { status: 409 })
    await admin.from('subscription_usage').insert({ subscription_id: sub.id, usage_type: 'inspection', quantity: 1, amount: 0, note: act.note ?? null, created_by: user.id })
    return NextResponse.json({ ok: true })
  }

  if (!['active', 'upcoming', 'pending_payment'].includes(sub.status)) {
    return NextResponse.json({ error: 'This membership is already ended.' }, { status: 409 })
  }
  await admin.from('maintenance_subscriptions').update({
    status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: act.reason ?? 'Cancelled by HomeServe',
  }).eq('id', sub.id)
  await logAdmin(admin, user.id, { action: 'membership.cancel', entity_type: 'membership', entity_id: sub.id, summary: `Cancelled a membership (${sub.status})`, details: { reason: act.reason ?? null } })
  return NextResponse.json({ ok: true })
}
