import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/shared'
import { CATEGORY_META, REQUEST_STATUS, type MaintenanceCategory, type RequestStatus } from '@/lib/maintenance/config'
import { fmtDate, rupees, warrantyStatus } from '@/lib/maintenance/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Service History' }

type Kind = 'renovation' | 'quotation' | 'payment' | 'project' | 'warranty' | 'maintenance' | 'membership' | 'review'
interface Item { at: string; kind: Kind; title: string; detail?: string; href?: string; badge?: string; amount?: number }

const KINDS: { key: Kind; label: string }[] = [
  { key: 'renovation', label: 'Renovation' },
  { key: 'quotation', label: 'Quotations' },
  { key: 'payment', label: 'Payments' },
  { key: 'project', label: 'Projects' },
  { key: 'warranty', label: 'Warranty' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'membership', label: 'Membership' },
  { key: 'review', label: 'Reviews' },
]
const human = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/homeowner/history')

  // Everything below is read with the customer's own session, so RLS decides what they can see.
  const [leads, quotes, projects, warranties, mreqs, subs, mpays, reviews] = await Promise.all([
    supabase.from('renovation_requests').select('id, created_at, city, locality, scope, status').eq('user_id', user.id),
    supabase.from('quotations').select('id, quotation_number, project_title, total_amount, status, created_at, sent_at, accepted_at'),
    supabase.from('bookings').select('id, booking_number, project_title, service_category, booking_type, status, total_amount, created_at, completed_at, handover_date, warranty_months, payments(id, amount, status, payment_type, created_at)').eq('homeowner_id', user.id),
    supabase.from('warranty_requests').select('id, issue_category, status, created_at').eq('user_id', user.id),
    supabase.from('maintenance_requests').select('id, request_number, category, service_id, status, amount_due, created_at, closed_at'),
    supabase.from('maintenance_subscriptions').select('id, status, plan_snapshot, price_paid, start_date, end_date, created_at, property_id').in('status', ['active', 'upcoming', 'expired', 'cancelled']),
    supabase.from('maintenance_payments').select('id, kind, amount, status, description, created_at'),
    supabase.from('reviews').select('id, rating, subject_type, created_at, booking_id, maintenance_request_id').eq('homeowner_id', user.id),
  ])

  const svcIds = Array.from(new Set((mreqs.data ?? []).map((r) => r.service_id)))
  const { data: svcs } = svcIds.length ? await createAdminClient().from('maintenance_services').select('id, name').in('id', svcIds) : { data: [] }
  const svcName = new Map((svcs ?? []).map((s) => [s.id, s.name as string]))

  const items: Item[] = []
  for (const l of leads.data ?? []) items.push({ at: l.created_at, kind: 'renovation', title: 'Renovation request', detail: `${l.locality ?? ''}${l.locality ? ', ' : ''}${l.city} · ${(l.scope ?? []).map(human).join(', ')}`, badge: human(l.status), href: '/homeowner/requests' })
  for (const q of quotes.data ?? []) {
    items.push({ at: q.sent_at ?? q.created_at, kind: 'quotation', title: `Quotation ${q.quotation_number}`, detail: q.project_title, amount: Number(q.total_amount), badge: human(q.status), href: `/homeowner/quotations/${q.id}` })
  }
  for (const b of projects.data ?? []) {
    const isProject = b.booking_type === 'project'
    items.push({ at: b.created_at, kind: 'project', title: b.project_title ?? b.booking_number, detail: isProject ? 'Renovation project' : `Service booking · ${b.service_category ?? ''}`, amount: Number(b.total_amount), badge: human(b.status), href: isProject ? `/homeowner/projects/${b.id}` : `/homeowner/bookings/${b.id}` })
    if (b.handover_date) {
      const w = warrantyStatus({ handover_date: b.handover_date, warranty_months: b.warranty_months, warranty_terms: null })
      items.push({ at: b.handover_date, kind: 'project', title: `Handover — ${b.project_title ?? b.booking_number}`, detail: w.state === 'active' ? `Warranty active until ${fmtDate(w.ends)}` : w.state === 'ended' ? `Warranty ended ${fmtDate(w.ends)}` : 'Warranty terms are in your project agreement', href: `/homeowner/projects/${b.id}`, badge: 'Handover' })
    }
    for (const p of ((b.payments as { id: string; amount: number; status: string; payment_type: string; created_at: string }[]) ?? [])) {
      if (p.status === 'captured' || p.status === 'refunded') items.push({ at: p.created_at, kind: 'payment', title: `Payment — ${human(p.payment_type)}`, detail: b.project_title ?? b.booking_number, amount: Number(p.amount), badge: p.status === 'captured' ? 'Paid' : 'Refunded', href: '/homeowner/payments' })
    }
  }
  for (const w of warranties.data ?? []) items.push({ at: w.created_at, kind: 'warranty', title: 'Warranty request', detail: w.issue_category, badge: human(w.status), href: '/homeowner/warranty' })
  for (const r of mreqs.data ?? []) {
    items.push({ at: r.created_at, kind: 'maintenance', title: svcName.get(r.service_id) ?? CATEGORY_META[r.category as MaintenanceCategory].label, detail: r.request_number, badge: REQUEST_STATUS[r.status as RequestStatus]?.label, amount: Number(r.amount_due) > 0 ? Number(r.amount_due) : undefined, href: `/homeowner/maintenance/${r.id}` })
  }
  for (const s of subs.data ?? []) items.push({ at: s.start_date ?? s.created_at, kind: 'membership', title: `${(s.plan_snapshot as { name: string }).name} membership`, detail: `${fmtDate(s.start_date)} – ${fmtDate(s.end_date)}`, amount: Number(s.price_paid), badge: human(s.status), href: '/homeowner/membership' })
  for (const p of mpays.data ?? []) if (p.status === 'captured' || p.status === 'refunded') items.push({ at: p.created_at, kind: 'payment', title: p.kind === 'membership' ? 'Membership payment' : 'Maintenance payment', detail: p.description ?? undefined, amount: Number(p.amount), badge: p.status === 'captured' ? 'Paid' : 'Refunded', href: p.kind === 'membership' ? '/homeowner/membership' : '/homeowner/maintenance' })
  for (const r of reviews.data ?? []) items.push({ at: r.created_at, kind: 'review', title: `You rated HomeServe ${r.rating}/5`, detail: r.subject_type === 'project' ? 'Renovation project' : 'Maintenance service', href: '/homeowner/reviews' })

  const filter = KINDS.find((k) => k.key === sp.type)?.key
  const shown = items.filter((i) => !filter || i.kind === filter).sort((a, b) => +new Date(b.at) - +new Date(a.at))
  const count = (k: Kind) => items.filter((i) => i.kind === k).length

  const groups = new Map<string, Item[]>()
  for (const i of shown) {
    const key = new Date(i.at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    groups.set(key, [...(groups.get(key) ?? []), i])
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-900/60">Your record with HomeServe</p>
          <h1 className="page-title">Service history</h1>
          <p className="mt-1 text-sm text-stone-500">From your first request to every service since, in one place.</p>
        </div>
        <Link href="/homeowner/maintenance/new" className="inline-flex h-10 items-center gap-2 bg-ink-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-cobalt-500"><Plus size={15} /> New service request</Link>
      </div>

      <nav aria-label="Filter history" className="flex flex-wrap gap-2">
        <Link href="/homeowner/history" className={cn('inline-flex items-center border px-3 py-1.5 text-sm coarse:min-h-11', !filter ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-900/25 bg-white text-ink-900 hover:border-ink-900')}>All <span className="font-mono text-xs opacity-60">{items.length}</span></Link>
        {KINDS.map((k) => (
          <Link key={k.key} href={`/homeowner/history?type=${k.key}`} aria-current={filter === k.key ? 'true' : undefined}
            className={cn('inline-flex items-center border px-3 py-1.5 text-sm coarse:min-h-11', filter === k.key ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-900/25 bg-white text-ink-900 hover:border-ink-900', count(k.key) === 0 && filter !== k.key && 'text-stone-600')}>
            {k.label} <span className="font-mono text-xs opacity-60">{count(k.key)}</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="border border-ink-900/15 bg-white p-8 text-center text-sm text-stone-500">
          {items.length === 0 ? 'Nothing here yet. Your renovation requests, projects, warranty, maintenance and membership will all appear in this timeline.' : 'Nothing of this type yet.'}
        </p>
      ) : (
        <div className="space-y-8">
          {Array.from(groups.entries()).map(([month, rows]) => (
            <section key={month}>
              <h2 className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">{month}</h2>
              <ol className="space-y-2 border-l-2 border-ink-900/15 pl-5">
                {rows.map((i, idx) => {
                  const body = (
                    <>
                      <span className="absolute -left-[1.6rem] top-4 h-2.5 w-2.5 bg-ink-900" />
                      <span className="min-w-0 flex-1 basis-44">
                        <span className="block font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-cobalt-600">{KINDS.find((k) => k.key === i.kind)?.label} · {fmtDate(i.at)}</span>
                        <span className="mt-0.5 block truncate text-sm font-semibold text-ink-900">{i.title}</span>
                        {i.detail && <span className="block truncate text-xs text-stone-500">{i.detail}</span>}
                      </span>
                      {i.amount != null && i.amount > 0 && <span className="text-sm font-medium text-ink-900">{rupees(i.amount)}</span>}
                      {i.badge && <Badge variant="outline" size="sm">{i.badge}</Badge>}
                      {i.href && <ChevronRight size={15} className="shrink-0 text-ink-900/60" />}
                    </>
                  )
                  const cls = 'relative flex flex-wrap items-center gap-x-3 gap-y-1.5 border border-ink-900/15 bg-white p-3.5 sm:flex-nowrap'
                  return <li key={idx}>{i.href ? <Link href={i.href} className={cn(cls, 'transition-colors hover:border-ink-900')}>{body}</Link> : <div className={cls}>{body}</div>}</li>
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
