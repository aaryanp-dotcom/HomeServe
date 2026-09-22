'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Textarea } from '@/components/ui/shared'
import { CATEGORY_META, CATEGORY_ORDER, MEMBERSHIP_BILLING, type MaintenanceCategory } from '@/lib/maintenance/config'
import type { MaintenancePlan } from '@/lib/maintenance/types'

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)
const s = (n: number | null) => (n == null ? '' : String(n))

export function PlanEditor({ plan }: { plan: MaintenancePlan }) {
  const router = useRouter()
  const [f, setF] = useState({
    name: plan.name, tagline: plan.tagline ?? '', description: plan.description,
    annual_price: s(plan.annual_price), monthly_price: s(plan.monthly_price), term_months: String(plan.term_months),
    included_visits: String(plan.included_visits), inspection_frequency_per_year: String(plan.inspection_frequency_per_year),
    discount_percent: String(plan.discount_percent), service_credit_amount: String(plan.service_credit_amount),
    max_benefit_per_service: s(plan.max_benefit_per_service), max_annual_benefit: s(plan.max_annual_benefit),
    categories: plan.eligible_categories as MaintenanceCategory[],
    labour_included: plan.labour_included, parts_included: plan.parts_included,
    priority_booking: plan.priority_booking, priority_support: plan.priority_support,
    emergency_support: plan.emergency_support, emergency_notes: plan.emergency_notes ?? '',
    benefits: plan.benefits.join('\n'), exclusions: plan.exclusions.join('\n'),
    eligibility_notes: plan.eligibility_notes ?? '', requires_project: plan.requires_homeserve_project, is_active: plan.is_active,
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))

  async function save() {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch(`/api/admin/maintenance/plans/${plan.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.name, tagline: f.tagline, description: f.description,
          annual_price: f.annual_price, monthly_price: f.monthly_price, term_months: f.term_months,
          included_visits: f.included_visits, inspection_frequency_per_year: f.inspection_frequency_per_year,
          discount_percent: f.discount_percent, service_credit_amount: f.service_credit_amount || 0,
          max_benefit_per_service: f.max_benefit_per_service, max_annual_benefit: f.max_annual_benefit,
          eligible_categories: f.categories, labour_included: f.labour_included, parts_included: f.parts_included,
          priority_booking: f.priority_booking, priority_support: f.priority_support,
          emergency_support: f.emergency_support, emergency_notes: f.emergency_notes,
          benefits: lines(f.benefits), exclusions: lines(f.exclusions), eligibility_notes: f.eligibility_notes,
          requires_homeserve_project: f.requires_project, is_active: f.is_active,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setMsg({ ok: false, t: data.error ?? 'Could not save' })
      else { setMsg({ ok: true, t: 'Saved' }); router.refresh() }
    } finally { setBusy(false) }
  }

  const chk = 'flex items-center gap-2 text-sm text-stone-700'
  const box = 'h-4 w-4 accent-[#FF4D17]'
  const legend = 'font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-900/60'
  return (
    <div className="space-y-6 border-t border-ink-900/10 p-5">
      <fieldset className="space-y-3"><legend className={legend}>Presentation</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Plan name" value={f.name} onChange={(e) => set('name', e.target.value)} />
          <Input label="Tagline" value={f.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </div>
        <Textarea label="Description" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} />
      </fieldset>

      <fieldset className="space-y-3"><legend className={legend}>Pricing (set by HomeServe — nothing is assumed)</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input type="number" min={0} label="Annual price (₹)" value={f.annual_price} onChange={(e) => set('annual_price', e.target.value)} hint="Required to make the plan active" />
          <Input type="number" min={0} label="Monthly price (₹, optional)" value={f.monthly_price} onChange={(e) => set('monthly_price', e.target.value)}
            hint={MEMBERSHIP_BILLING.monthlyBillingEnabled ? undefined : 'Stored only. Monthly billing needs Razorpay Subscriptions and is not enabled.'} />
          <Input type="number" min={1} max={36} label="Term (months)" value={f.term_months} onChange={(e) => set('term_months', e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="space-y-3"><legend className={legend}>Benefits and limits</legend>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input type="number" min={0} label="Home inspections / year" value={f.inspection_frequency_per_year} onChange={(e) => set('inspection_frequency_per_year', e.target.value)} />
          <Input type="number" min={0} label="Included visits / year" value={f.included_visits} onChange={(e) => set('included_visits', e.target.value)} />
          <Input type="number" min={0} max={100} step="0.5" label="Discount (%)" value={f.discount_percent} onChange={(e) => set('discount_percent', e.target.value)} />
          <Input type="number" min={0} label="Service credits per term (₹)" value={f.service_credit_amount} onChange={(e) => set('service_credit_amount', e.target.value)} />
          <Input type="number" min={0} label="Max benefit per request (₹)" value={f.max_benefit_per_service} onChange={(e) => set('max_benefit_per_service', e.target.value)} hint="Blank = no per-request cap" />
          <Input type="number" min={0} label="Max benefit per year (₹)" value={f.max_annual_benefit} onChange={(e) => set('max_annual_benefit', e.target.value)} hint="Blank = no annual cap" />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className={chk}><input type="checkbox" className={box} checked={f.labour_included} onChange={(e) => set('labour_included', e.target.checked)} /> Included visits also cover labour</label>
          <label className={chk}><input type="checkbox" className={box} checked={f.parts_included} onChange={(e) => set('parts_included', e.target.checked)} /> Benefits may apply to materials/parts</label>
          <label className={chk}><input type="checkbox" className={box} checked={f.priority_booking} onChange={(e) => set('priority_booking', e.target.checked)} /> Priority booking</label>
          <label className={chk}><input type="checkbox" className={box} checked={f.priority_support} onChange={(e) => set('priority_support', e.target.checked)} /> Priority support</label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`e-${plan.id}`} className="text-sm font-medium text-stone-700">Emergency support</label>
            <select id={`e-${plan.id}`} value={f.emergency_support} onChange={(e) => set('emergency_support', e.target.value as typeof f.emergency_support)} className="field">
              <option value="none">None</option><option value="guidance_only">Guidance only</option><option value="priority_response">Priority response</option>
            </select>
          </div>
          <Input label="Emergency wording shown to customers (optional)" value={f.emergency_notes} onChange={(e) => set('emergency_notes', e.target.value)} hint="Only state what HomeServe will actually deliver" />
        </div>
      </fieldset>

      <fieldset className="space-y-3"><legend className={legend}>Eligible service categories</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {CATEGORY_ORDER.map((c) => (
            <label key={c} className={chk}>
              <input type="checkbox" className={box} checked={f.categories.includes(c)}
                onChange={(e) => set('categories', e.target.checked ? [...f.categories, c] : f.categories.filter((x) => x !== c))} />
              {CATEGORY_META[c].label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3"><legend className={legend}>Extra wording and eligibility</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Textarea label="Extra benefit lines (one per line)" rows={3} value={f.benefits} onChange={(e) => set('benefits', e.target.value)} />
          <Textarea label="Extra exclusions (one per line)" rows={3} value={f.exclusions} onChange={(e) => set('exclusions', e.target.value)} />
        </div>
        <Input label="Eligibility note (optional)" value={f.eligibility_notes} onChange={(e) => set('eligibility_notes', e.target.value)} />
        <label className={chk}><input type="checkbox" className={box} checked={f.requires_project} onChange={(e) => set('requires_project', e.target.checked)} /> Only for customers with a completed HomeServe renovation</label>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-ink-900/10 pt-4">
        <label className={`${chk} font-semibold`}><input type="checkbox" className={box} checked={f.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Active — visible and purchasable by customers</label>
        <Button size="sm" loading={busy} onClick={save}>Save plan</Button>
        {msg && <span role="status" className={`text-sm ${msg.ok ? 'text-sage-700' : 'text-rose-700'}`}>{msg.t}</span>}
      </div>
      <p className="text-xs text-stone-500">Changes affect new purchases and renewals only. Existing members keep the terms they bought.</p>
    </div>
  )
}
