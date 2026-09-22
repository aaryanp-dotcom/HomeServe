import { INDICATIVE_PRICE_NOTE, NO_PRICE_LABEL, PRICE_UNIT_LABEL } from './config'
import type { MaintenancePlan, MaintenanceService, PlanSnapshot, Subscription, UsageRow } from './types'
import { CATEGORY_META } from './config'

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
export const rupees = inr

/** "₹499–₹899 per visit" / "From ₹499 per visit" / "Quoted after inspection". Never invents a number. */
export function indicativePrice(s: Pick<MaintenanceService, 'indicative_price_from' | 'indicative_price_to' | 'price_unit'>): {
  text: string
  hasPrice: boolean
} {
  const { indicative_price_from: from, indicative_price_to: to, price_unit } = s
  if (price_unit === 'on_inspection' || (from == null && to == null)) return { text: NO_PRICE_LABEL, hasPrice: false }
  const unit = PRICE_UNIT_LABEL[price_unit] ?? ''
  if (from != null && to != null && to !== from) return { text: `${inr(from)}–${inr(to)} ${unit}`, hasPrice: true }
  const v = (from ?? to) as number
  return { text: `From ${inr(v)} ${unit}`, hasPrice: true }
}
export { INDICATIVE_PRICE_NOTE }

/** Plan price as shown to customers. NULL price ⇒ not purchasable. */
export function planPriceText(p: Pick<MaintenancePlan, 'annual_price'>): string {
  return p.annual_price == null ? 'Pricing to be announced' : `${inr(p.annual_price)} / year`
}
export const planPurchasable = (p: Pick<MaintenancePlan, 'annual_price' | 'is_active'>) =>
  p.is_active && p.annual_price != null && p.annual_price > 0

/**
 * Plain-language benefit lines generated from the plan's own configuration, so the
 * copy can never drift from what the benefit engine actually applies.
 */
export function describePlanBenefits(p: MaintenancePlan | PlanSnapshot): string[] {
  const out: string[] = []
  if (p.inspection_frequency_per_year > 0)
    out.push(`${p.inspection_frequency_per_year} home inspection${p.inspection_frequency_per_year > 1 ? 's' : ''} a year`)
  if (p.included_visits > 0) {
    out.push(
      `${p.included_visits} included service visit${p.included_visits > 1 ? 's' : ''} a year` +
        (p.labour_included ? ' (visit fee and labour covered)' : ' (visit fee covered; labour and materials charged separately)'),
    )
  }
  if (p.discount_percent > 0) out.push(`${p.discount_percent}% off eligible service charges${p.parts_included ? '' : ' (excluding materials and parts)'}`)
  if (p.service_credit_amount > 0) out.push(`${inr(p.service_credit_amount)} in service credits per term`)
  if (p.priority_booking) out.push('Priority booking')
  if (p.priority_support) out.push('Priority support')
  if (p.emergency_support === 'guidance_only') out.push('Emergency guidance')
  if (p.emergency_support === 'priority_response') out.push('Priority response for emergencies')
  if (p.emergency_notes) out.push(p.emergency_notes)
  for (const b of p.benefits ?? []) out.push(b)
  return out
}

/** Limits, stated plainly next to the benefits. */
export function describePlanLimits(p: MaintenancePlan | PlanSnapshot): string[] {
  const out: string[] = []
  if (p.max_benefit_per_service != null) out.push(`Benefits are capped at ${inr(p.max_benefit_per_service)} per service request`)
  if (p.max_annual_benefit != null) out.push(`Benefits are capped at ${inr(p.max_annual_benefit)} per membership year`)
  if (!p.parts_included) out.push('Materials and spare parts are not covered')
  if (!p.labour_included && p.included_visits > 0) out.push('Included visits cover the visit fee only, not labour')
  for (const e of p.exclusions ?? []) out.push(e)
  return out
}

export function coveredCategoriesText(p: MaintenancePlan | PlanSnapshot): string {
  if (!p.eligible_categories?.length) return 'No service categories are set for this plan yet'
  return p.eligible_categories.map((c) => CATEGORY_META[c]?.label ?? c).join(', ')
}

/** Remaining benefits, computed from the frozen snapshot and the usage ledger. */
export function remainingBenefits(sub: Pick<Subscription, 'plan_snapshot'>, usage: UsageRow[]) {
  const snap = sub.plan_snapshot
  const sum = (t: UsageRow['usage_type']) => usage.filter((u) => u.usage_type === t).reduce((a, u) => a + Number(u.amount), 0)
  const visitsUsed = usage.filter((u) => u.usage_type === 'visit').reduce((a, u) => a + u.quantity, 0)
  const inspectionsUsed = usage.filter((u) => u.usage_type === 'inspection').reduce((a, u) => a + u.quantity, 0)
  const creditsUsed = sum('credit')
  const benefitUsed = sum('visit_coverage') + sum('discount') + sum('credit')
  return {
    visitsTotal: snap.included_visits,
    visitsUsed,
    visitsLeft: Math.max(0, snap.included_visits - visitsUsed),
    inspectionsTotal: snap.inspection_frequency_per_year,
    inspectionsUsed,
    inspectionsLeft: Math.max(0, snap.inspection_frequency_per_year - inspectionsUsed),
    creditsTotal: Number(snap.service_credit_amount),
    creditsUsed,
    creditsLeft: Math.max(0, Number(snap.service_credit_amount) - creditsUsed),
    benefitUsed,
    annualCap: snap.max_annual_benefit,
    annualLeft: snap.max_annual_benefit == null ? null : Math.max(0, Number(snap.max_annual_benefit) - benefitUsed),
  }
}

export function daysUntil(date: string | null | undefined, from = new Date()): number | null {
  if (!date) return null
  const end = new Date(date + 'T00:00:00')
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  return Math.round((end.getTime() - start.getTime()) / 86400000)
}

export const fmtDate = (d?: string | null) =>
  d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

// ── Warranty facts (admin-entered on the project; nothing is assumed) ───────────

export interface WarrantyFacts {
  handover_date: string | null
  warranty_months: number | null
  warranty_terms: string | null
}

export function warrantyStatus(w: WarrantyFacts, now = new Date()):
  | { state: 'not_handed_over' }
  | { state: 'terms_in_agreement'; handover: string }
  | { state: 'active' | 'ended'; handover: string; ends: string; daysLeft: number } {
  if (!w.handover_date) return { state: 'not_handed_over' }
  if (!w.warranty_months) return { state: 'terms_in_agreement', handover: w.handover_date }
  const ends = new Date(w.handover_date + 'T00:00:00')
  ends.setMonth(ends.getMonth() + w.warranty_months)
  const pad = (n: number) => String(n).padStart(2, '0')
  const endsIso = `${ends.getFullYear()}-${pad(ends.getMonth() + 1)}-${pad(ends.getDate())}`
  const daysLeft = daysUntil(endsIso, now) ?? 0
  return { state: daysLeft > 0 ? 'active' : 'ended', handover: w.handover_date, ends: endsIso, daysLeft }
}

/** Fields copied into a subscription so later plan edits never change what a member bought. */
export function snapshotOf(plan: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { is_active, sort_order, created_at, updated_at, id, ...rest } = plan
  return { ...rest, plan_id: id }
}
