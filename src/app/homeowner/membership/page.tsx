import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BadgeCheck, Check, Minus, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge, EmptyState } from '@/components/ui/shared'
import { MembershipActions } from '@/components/maintenance/MembershipActions'
import { RequestStatusBadge } from '@/components/maintenance/StatusTrack'
import { getActivePlans } from '@/lib/maintenance/data'
import {
  coveredCategoriesText, daysUntil, describePlanBenefits, describePlanLimits, fmtDate, planPurchasable, remainingBenefits, rupees,
} from '@/lib/maintenance/format'
import { CATEGORY_META, MEMBERSHIP_BILLING, OPEN_STATUSES, WARRANTY_VS_MAINTENANCE, type RequestStatus } from '@/lib/maintenance/config'
import type { MaintenanceRequest, Property, Subscription, UsageRow } from '@/lib/maintenance/types'

export const metadata: Metadata = { title: 'My Membership' }

const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'accent' | 'warning' | 'default' | 'danger' }> = {
  active: { label: 'Active', variant: 'success' },
  upcoming: { label: 'Starts on renewal', variant: 'accent' },
  pending_payment: { label: 'Awaiting payment', variant: 'warning' },
  expired: { label: 'Expired', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
}

export default async function MembershipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/homeowner/membership')

  const [{ data: subRows }, { data: propRows }, plans] = await Promise.all([
    supabase.from('maintenance_subscriptions').select('*').order('created_at', { ascending: false }),
    supabase.from('customer_properties').select('*'),
    getActivePlans(),
  ])
  const subs = (subRows ?? []) as Subscription[]
  const props = new Map(((propRows ?? []) as Property[]).map((p) => [p.id, p]))
  const ids = subs.map((s) => s.id)

  const [{ data: usageRows }, { data: payRows }, { data: reqRows }] = ids.length
    ? await Promise.all([
        supabase.from('subscription_usage').select('*').in('subscription_id', ids).order('created_at', { ascending: false }),
        supabase.from('maintenance_payments').select('*').in('subscription_id', ids).order('created_at', { ascending: false }),
        supabase.from('maintenance_requests').select('*').order('created_at', { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const usage = (usageRows ?? []) as UsageRow[]
  const requests = (reqRows ?? []) as MaintenanceRequest[]
  const svcIds = Array.from(new Set(requests.map((r) => r.service_id)))
  const { data: svcs } = svcIds.length ? await createAdminClient().from('maintenance_services').select('id, name').in('id', svcIds) : { data: [] }
  const svcName = new Map((svcs ?? []).map((s) => [s.id, s.name as string]))

  const current = subs.filter((s) => ['active', 'upcoming', 'pending_payment'].includes(s.status))
  const ended = subs.filter((s) => ['expired', 'cancelled'].includes(s.status))
  const activeFirst = [...current].sort((a, b) => (a.status === 'active' ? -1 : 1) - (b.status === 'active' ? -1 : 1))

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-5 sm:p-8">
      <div>
        <p className="mb-1 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-900/60">Home care</p>
        <h1 className="page-title">My membership</h1>
        <p className="mt-1 text-sm text-stone-500">What you bought, what is left, and what it has been used for.</p>
      </div>

      {subs.length === 0 && (
        <EmptyState tone="warm" icon={<BadgeCheck size={22} />} title="You do not have a membership"
          description="A HomeServe membership is optional. You can book any maintenance service on its own at any time."
          action={<Link href="/maintenance/plans" className="text-sm font-medium text-cobalt-600 underline-offset-4 hover:underline">See membership plans</Link>} />
      )}

      {activeFirst.map((s) => {
        const snap = s.plan_snapshot
        const u = usage.filter((x) => x.subscription_id === s.id)
        const rem = remainingBenefits(s, u)
        const prop = props.get(s.property_id)
        const left = daysUntil(s.end_date)
        const badge = STATUS_BADGE[s.status]
        const pays = ((payRows ?? []) as { subscription_id: string }[]).filter((p) => p.subscription_id === s.id) as unknown as
          { id: string; amount: number; status: string; created_at: string; description: string | null }[]
        const forHome = requests.filter((r) => r.property_id === s.property_id)
        const upcoming = forHome.filter((r) => OPEN_STATUSES.includes(r.status as RequestStatus))
        const past = forHome.filter((r) => !OPEN_STATUSES.includes(r.status as RequestStatus))
        const usedRequests = u.filter((x) => x.request_id && ['visit', 'discount', 'credit', 'visit_coverage'].includes(x.usage_type))
        const nextIsRenewed = subs.some((x) => x.property_id === s.property_id && x.status === 'upcoming')
        const plan = plans.find((p) => p.id === s.plan_id)
        const canRenew = s.status === 'active' && !s.cancel_at_period_end && !nextIsRenewed && left != null && left <= MEMBERSHIP_BILLING.renewalWindowDays && !!plan && planPurchasable(plan)

        return (
          <article key={s.id} className="space-y-6 border-2 border-ink-900 bg-white p-6">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-cobalt-600">HomeServe membership</p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.02em] text-ink-900">{snap.name}</h2>
                <p className="mt-0.5 text-sm text-stone-500">{prop ? `${prop.label} · ${prop.address_line}, ${prop.city}` : 'Your home'}</p>
              </div>
              <Badge variant={badge.variant} dot>{s.cancel_at_period_end && s.status === 'active' ? 'Ends on ' + fmtDate(s.end_date) : badge.label}</Badge>
            </header>

            <dl className="grid gap-4 border-y border-ink-900/10 py-4 text-sm sm:grid-cols-4">
              <div><dt className="text-stone-500">Started</dt><dd className="font-medium text-ink-900">{fmtDate(s.start_date)}</dd></div>
              <div><dt className="text-stone-500">{s.cancel_at_period_end ? 'Ends' : 'Renewal date'}</dt><dd className="font-medium text-ink-900">{fmtDate(s.end_date)}{left != null && s.status === 'active' && <span className="block text-xs font-normal text-stone-500">{left > 0 ? `${left} day${left === 1 ? '' : 's'} left` : 'ends today'}</span>}</dd></div>
              <div><dt className="text-stone-500">Paid</dt><dd className="font-medium text-ink-900">{rupees(Number(s.price_paid))}</dd></div>
              <div><dt className="text-stone-500">Term</dt><dd className="font-medium text-ink-900">{snap.term_months} months</dd></div>
            </dl>

            {s.status === 'pending_payment' && (
              <p className="border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">This membership starts once payment is complete. If you paid and it still shows here, it will update shortly.</p>
            )}

            {/* remaining */}
            {['active', 'upcoming'].includes(s.status) && (
              <section>
                <h3 className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">What is left</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {rem.inspectionsTotal > 0 && <Meter label="Home inspections" used={rem.inspectionsUsed} total={rem.inspectionsTotal} />}
                  {rem.visitsTotal > 0 && <Meter label="Included visits" used={rem.visitsUsed} total={rem.visitsTotal} />}
                  {rem.creditsTotal > 0 && <Meter label="Service credits" used={rem.creditsUsed} total={rem.creditsTotal} money />}
                  {rem.annualCap != null && <Meter label="Annual benefit cap" used={rem.benefitUsed} total={Number(rem.annualCap)} money />}
                  {rem.inspectionsTotal === 0 && rem.visitsTotal === 0 && rem.creditsTotal === 0 && rem.annualCap == null && (
                    <p className="text-sm text-stone-500 sm:col-span-3">This plan has no counted allowances; its benefits are the discounts and priority listed below.</p>
                  )}
                </div>
              </section>
            )}

            <section className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold text-ink-900">Your benefits</h3>
                <ul className="space-y-1.5 text-sm text-stone-700">
                  {describePlanBenefits(snap).map((b) => <li key={b} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-sage-700" />{b}</li>)}
                </ul>
                <p className="mt-3 text-xs text-stone-500">Applies to: {coveredCategoriesText(snap)}.</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-ink-900">Limits</h3>
                <ul className="space-y-1.5 text-sm text-stone-600">
                  {describePlanLimits(snap).map((b) => <li key={b} className="flex gap-2"><Minus size={14} className="mt-0.5 shrink-0 text-stone-400" />{b}</li>)}
                </ul>
              </div>
            </section>

            {/* services used */}
            {usedRequests.length > 0 && (
              <section>
                <h3 className="mb-2 font-semibold text-ink-900">Services where benefits were used</h3>
                <ul className="divide-y divide-ink-900/10 border border-ink-900/15 text-sm">
                  {Array.from(new Set(usedRequests.map((x) => x.request_id!))).map((rid) => {
                    const r = requests.find((q) => q.id === rid)
                    if (!r) return null
                    const saved = usedRequests.filter((x) => x.request_id === rid && x.usage_type !== 'visit').reduce((a, x) => a + Number(x.amount), 0)
                    return (
                      <li key={rid}><Link href={`/homeowner/maintenance/${rid}`} className="flex items-center justify-between gap-3 p-3 hover:bg-paper-100">
                        <span>{svcName.get(r.service_id) ?? CATEGORY_META[r.category].label}<span className="block text-xs text-stone-500">{fmtDate(r.created_at)}</span></span>
                        <span className="font-medium text-sage-700">{saved > 0 ? `${rupees(saved)} covered` : 'Included visit'}</span>
                      </Link></li>
                    )
                  })}
                </ul>
              </section>
            )}

            {/* upcoming / past maintenance */}
            <section className="grid gap-6 sm:grid-cols-2">
              <RequestList title="Upcoming maintenance" empty="Nothing open for this home." rows={upcoming} svcName={svcName} />
              <RequestList title="Past maintenance" empty="No completed services yet." rows={past.slice(0, 5)} svcName={svcName} />
            </section>

            {/* payments */}
            {pays.length > 0 && (
              <section>
                <h3 className="mb-2 font-semibold text-ink-900">Payment history</h3>
                <ul className="divide-y divide-ink-900/10 border border-ink-900/15 text-sm">
                  {pays.map((p) => (
                    <li key={p.id} className="flex items-center justify-between p-3">
                      <span>{p.description ?? 'Membership'}<span className="block text-xs text-stone-500">{fmtDate(p.created_at)}</span></span>
                      <span className="text-right"><span className="font-medium text-ink-900">{rupees(Number(p.amount))}</span><span className="block font-mono text-[0.6875rem] uppercase text-stone-500">{p.status === 'captured' ? 'paid' : p.status}</span></span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {nextIsRenewed && <p className="rounded-soft-sm border border-sage-500/40 bg-sage-50 p-3 text-sm text-sage-900">Your renewal is paid. The next term starts on {fmtDate(s.end_date)}.</p>}
            {s.cancel_at_period_end && s.status === 'active' && <p className="text-sm text-stone-600">You have chosen not to renew. Your benefits continue until {fmtDate(s.end_date)}.</p>}
            {s.status === 'active' && !canRenew && !s.cancel_at_period_end && !nextIsRenewed && (
              <p className="text-xs text-stone-500">Renewal opens {MEMBERSHIP_BILLING.renewalWindowDays} days before your renewal date. Memberships do not renew automatically.</p>
            )}

            <MembershipActions id={s.id} status={s.status} cancelAtPeriodEnd={s.cancel_at_period_end} canRenew={canRenew}
              renewPrice={plan?.annual_price ? rupees(Number(plan.annual_price)) : undefined} planName={snap.name} endDate={fmtDate(s.end_date)} />
            <p className="border-t border-ink-900/10 pt-4 text-xs text-stone-500">{WARRANTY_VS_MAINTENANCE.membership}</p>
          </article>
        )
      })}

      {ended.length > 0 && (
        <section>
          <h2 className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Earlier memberships</h2>
          <div className="space-y-3">
            {ended.map((s) => {
              const prop = props.get(s.property_id)
              const plan = plans.find((p) => p.id === s.plan_id)
              const hasLive = subs.some((x) => x.property_id === s.property_id && ['active', 'upcoming', 'pending_payment'].includes(x.status))
              const renewable = s.status === 'expired' && !hasLive && !!plan && planPurchasable(plan)
              return (
                <div key={s.id} className="space-y-3 border border-ink-900/15 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink-900">{s.plan_snapshot.name} <span className="font-normal text-stone-500">· {prop?.label ?? 'Home'}</span></p>
                      <p className="text-xs text-stone-500">{fmtDate(s.start_date)} – {fmtDate(s.end_date)}{s.cancellation_reason && s.status === 'cancelled' ? ` · ${s.cancellation_reason}` : ''}</p>
                    </div>
                    <Badge variant={STATUS_BADGE[s.status].variant} dot>{STATUS_BADGE[s.status].label}</Badge>
                  </div>
                  {renewable && <MembershipActions id={s.id} status="expired" cancelAtPeriodEnd={false} canRenew renewPrice={rupees(Number(plan!.annual_price))} planName={s.plan_snapshot.name} />}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {subs.length > 0 && current.length === 0 && plans.length > 0 && (
        <p className="text-sm text-stone-600">Want member benefits again? <Link href="/maintenance/plans" className="font-medium text-cobalt-600 underline-offset-4 hover:underline">See plans</Link>.</p>
      )}
    </div>
  )
}

function Meter({ label, used, total, money }: { label: string; used: number; total: number; money?: boolean }) {
  const left = Math.max(0, total - used)
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0
  const f = (n: number) => (money ? rupees(n) : String(n))
  return (
    <div className="border border-ink-900/15 p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-ink-900">{f(left)} <span className="text-sm font-normal text-stone-500">of {f(total)} left</span></p>
      <div className="mt-2 h-1.5 bg-ink-900/10" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${label} used`}>
        <div className="h-full bg-cobalt-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function RequestList({ title, empty, rows, svcName }: { title: string; empty: string; rows: MaintenanceRequest[]; svcName: Map<string, string> }) {
  return (
    <div>
      <h3 className="mb-2 font-semibold text-ink-900">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-stone-500">{empty}</p> : (
        <ul className="divide-y divide-ink-900/10 border border-ink-900/15 text-sm">
          {rows.map((r) => (
            <li key={r.id}><Link href={`/homeowner/maintenance/${r.id}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 p-3 hover:bg-paper-100">
              <span className="min-w-0 flex-1 basis-32"><span className="block truncate">{svcName.get(r.service_id) ?? CATEGORY_META[r.category].label}</span><span className="block text-xs text-stone-500">{fmtDate(r.created_at)}</span></span>
              <span className="flex items-center gap-1"><RequestStatusBadge status={r.status as RequestStatus} /><ChevronRight size={14} className="text-ink-900/60" /></span>
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  )
}
