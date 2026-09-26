import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/maintenance/auth'
import { planEditSchema } from '@/lib/maintenance/schemas'
import { logAdmin } from '@/lib/maintenance/audit'

/**
 * PUT /api/admin/maintenance/plans/:id — edit a membership plan.
 * Existing members are unaffected: their terms are a frozen snapshot taken at purchase.
 * A plan cannot be switched on without an annual price, so nothing is ever sold unpriced.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await requireAdmin()
  if (!a.ok) return a.res

  const parsed = planEditSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid plan', issues: parsed.error.issues }, { status: 400 })
  const v = parsed.data

  if (v.is_active && !(v.annual_price && v.annual_price > 0)) {
    return NextResponse.json({ error: 'Enter an annual price before making the plan active.' }, { status: 400 })
  }
  if (v.is_active && v.eligible_categories.length === 0) {
    return NextResponse.json({ error: 'Choose at least one service category the plan applies to.' }, { status: 400 })
  }

  const { data: before } = await a.admin.from('maintenance_plans').select('name, annual_price, is_active, discount_percent, included_visits, service_credit_amount').eq('id', id).maybeSingle()
  const { data, error } = await a.admin.from('maintenance_plans').update({
    ...v,
    tagline: v.tagline ?? null,
    annual_price: v.annual_price ?? null,
    monthly_price: v.monthly_price ?? null,
    max_benefit_per_service: v.max_benefit_per_service ?? null,
    max_annual_benefit: v.max_annual_benefit ?? null,
    emergency_notes: v.emergency_notes ?? null,
    eligibility_notes: v.eligibility_notes ?? null,
  }).eq('id', id).select('id').maybeSingle()
  if (error) {
    console.error('[admin/maintenance/plans]', error.code, error.hint)
    return NextResponse.json({ error: 'Could not save the plan' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  await logAdmin(a.admin, a.user.id, {
    action: 'plan.update', entity_type: 'maintenance_plan', entity_id: id,
    summary: `Edited plan ${v.name}${before && before.annual_price !== (v.annual_price ?? null) ? ` (price ${before.annual_price ?? 'unset'} → ${v.annual_price ?? 'unset'})` : ''}${before && before.is_active !== v.is_active ? (v.is_active ? ' — activated' : ' — deactivated') : ''}`,
    details: { before, after: { annual_price: v.annual_price ?? null, is_active: v.is_active, discount_percent: v.discount_percent, included_visits: v.included_visits, service_credit_amount: v.service_credit_amount } },
  })
  return NextResponse.json({ ok: true })
}
