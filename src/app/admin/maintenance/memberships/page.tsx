import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { adminPage } from '@/lib/maintenance/page-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminMembershipActions } from '@/components/maintenance/AdminMembershipActions'
import { Badge } from '@/components/ui/shared'
import { AdminAddMembership } from '@/components/maintenance/AdminAddMembership'
import { daysUntil, fmtDate, remainingBenefits, rupees } from '@/lib/maintenance/format'
import { cn } from '@/lib/utils'
import type { Subscription, UsageRow } from '@/lib/maintenance/types'

export const metadata: Metadata = { title: 'Memberships — Admin' }

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'expiring', label: 'Expiring (30 days)' },
  { key: 'renewals', label: 'Renewals' },
  { key: 'ended', label: 'Ended' },
]

export default async function AdminMembershipsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const { supabase } = await adminPage('/admin/maintenance/memberships')
  const tab = searchParams.tab ?? 'active'

  const { data } = await supabase.from('maintenance_subscriptions').select('*').order('end_date', { ascending: true }).limit(500)
  const all = (data ?? []) as Subscription[]
  const horizon = 30
  const rows = all.filter((s) => {
    if (tab === 'active') return s.status === 'active'
    if (tab === 'expiring') return s.status === 'active' && (daysUntil(s.end_date) ?? 999) <= horizon
    if (tab === 'renewals') return !!s.renewed_from_id || s.status === 'upcoming'
    return ['expired', 'cancelled'].includes(s.status)
  })

  const ids = rows.map((s) => s.id)
  const admin = createAdminClient()
  const uids = Array.from(new Set(rows.map((s) => s.user_id)))
  const pids = Array.from(new Set(rows.map((s) => s.property_id)))
  const [{ data: usage }, { data: profiles }, { data: props }, { data: mpays }, { data: allPlans }] = await Promise.all([
    ids.length ? supabase.from('subscription_usage').select('*').in('subscription_id', ids) : { data: [] },
    uids.length ? admin.from('user_profiles').select('user_id, full_name, phone').in('user_id', uids) : { data: [] },
    pids.length ? supabase.from('customer_properties').select('id, label, city').in('id', pids) : { data: [] },
    ids.length ? supabase.from('maintenance_payments').select('id, subscription_id, amount, method, created_at').in('subscription_id', ids).eq('status', 'captured').order('created_at', { ascending: false }) : { data: [] },
    supabase.from('maintenance_plans').select('id, name, annual_price').order('sort_order'),
  ])
  const who = new Map((profiles ?? []).map((p) => [p.user_id, p]))
  const prop = new Map((props ?? []).map((p) => [p.id, p]))
  const activeCount = all.filter((s) => s.status === 'active').length
  const expiringCount = all.filter((s) => s.status === 'active' && (daysUntil(s.end_date) ?? 999) <= horizon).length

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
      <Link href="/admin/maintenance" className="coarse:min-h-11 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-ink-900"><ArrowLeft size={14} /> Maintenance</Link>
      <div>
        <h1 className="page-title">Memberships</h1>
        <p className="mt-1 text-sm text-stone-500">{activeCount} active · {expiringCount} ending within {horizon} days</p>
      </div>

      <AdminAddMembership plans={(allPlans ?? []).map((p) => ({ id: p.id, name: p.name, annual_price: p.annual_price == null ? null : Number(p.annual_price) }))} />

      <div className="flex flex-wrap gap-1 border-b-2 border-ink-900" role="tablist">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/maintenance/memberships?tab=${t.key}`} role="tab" aria-selected={tab === t.key}
            className={cn('border-2 border-b-0 px-4 py-2 text-sm font-medium', tab === t.key ? 'border-ink-900 bg-white text-ink-900' : 'border-transparent text-stone-500 hover:text-ink-900')}>{t.label}</Link>
        ))}
      </div>

      {rows.length === 0 ? <p className="border border-ink-900/15 bg-white p-8 text-center text-sm text-stone-500">No memberships here.</p> : (
        <div className="overflow-x-auto border-2 border-ink-900 bg-white" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="w-full min-w-[860px] text-sm">
            <thead><tr className="border-b-2 border-ink-900 bg-paper-100 text-left font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-900/60">
              <th className="p-3">Customer</th><th className="p-3">Plan · Home</th><th className="p-3">Term</th><th className="p-3">Usage</th><th className="p-3">Status</th><th className="p-3"><span className="sr-only">Actions</span></th>
            </tr></thead>
            <tbody className="divide-y divide-ink-900/10">
              {rows.map((s) => {
                const rem = remainingBenefits(s, ((usage ?? []) as UsageRow[]).filter((u) => u.subscription_id === s.id))
                const left = daysUntil(s.end_date)
                return (
                  <tr key={s.id} className="align-top">
                    <td className="p-3"><Link href={`/admin/customers/${s.user_id}`} className="font-medium text-ink-900 hover:underline">{who.get(s.user_id)?.full_name ?? '—'}</Link><span className="block text-xs text-stone-500">{who.get(s.user_id)?.phone}</span></td>
                    <td className="p-3">{s.plan_snapshot.name}<span className="block text-xs text-stone-500">{prop.get(s.property_id)?.label} · {prop.get(s.property_id)?.city} · paid {rupees(Number(s.price_paid))}</span></td>
                    <td className="p-3">{fmtDate(s.start_date)} → {fmtDate(s.end_date)}{s.status === 'active' && left != null && <span className={cn('block text-xs', left <= horizon ? 'font-semibold text-amber-700' : 'text-stone-500')}>{left} days left{s.cancel_at_period_end ? ' · not renewing' : ''}</span>}{s.renewed_from_id && <span className="block text-xs text-stone-500">renewal</span>}</td>
                    <td className="p-3 text-xs text-stone-600">
                      {rem.inspectionsTotal > 0 && <span className="block">Inspections {rem.inspectionsUsed}/{rem.inspectionsTotal}</span>}
                      {rem.visitsTotal > 0 && <span className="block">Visits {rem.visitsUsed}/{rem.visitsTotal}</span>}
                      {rem.creditsTotal > 0 && <span className="block">Credits {rupees(rem.creditsUsed)}/{rupees(rem.creditsTotal)}</span>}
                      <span className="block">Benefit used {rupees(rem.benefitUsed)}{rem.annualCap != null ? ` of ${rupees(Number(rem.annualCap))}` : ''}</span>
                    </td>
                    <td className="p-3"><Badge variant={s.status === 'active' ? 'success' : s.status === 'cancelled' ? 'danger' : s.status === 'upcoming' ? 'accent' : 'default'} dot>{s.status.replace('_', ' ')}</Badge></td>
                    <td className="p-3"><AdminMembershipActions id={s.id} status={s.status} inspectionsLeft={rem.inspectionsLeft} payment={(() => { const p = (mpays ?? []).find((x) => x.subscription_id === s.id); return p ? { id: p.id, amount: Number(p.amount), method: p.method } : null })()} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
