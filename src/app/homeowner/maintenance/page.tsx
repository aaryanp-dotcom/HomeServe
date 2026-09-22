import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, BadgeCheck, ChevronRight, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button, EmptyState } from '@/components/ui/shared'
import { RequestStatusBadge } from '@/components/maintenance/StatusTrack'
import { HomesManager } from '@/components/maintenance/HomesManager'
import { CategoryIcon } from '@/components/maintenance/CategoryIcon'
import { CATEGORY_META, OPEN_STATUSES, remindersForMonth, type RequestStatus } from '@/lib/maintenance/config'
import { fmtDate } from '@/lib/maintenance/format'
import type { MaintenanceRequest, Property, Subscription } from '@/lib/maintenance/types'

export const metadata: Metadata = { title: 'Home Maintenance' }

export default async function HomeownerMaintenancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/homeowner/maintenance')

  const [{ data: reqs }, { data: subs }, { data: homes }] = await Promise.all([
    supabase.from('maintenance_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('maintenance_subscriptions').select('*').in('status', ['active', 'upcoming']),
    supabase.from('customer_properties').select('*').order('created_at'),
  ])
  const requests = (reqs ?? []) as MaintenanceRequest[]
  const members = (subs ?? []) as Subscription[]

  const ids = Array.from(new Set(requests.map((r) => r.service_id)))
  const { data: svcs } = ids.length ? await createAdminClient().from('maintenance_services').select('id, name').in('id', ids) : { data: [] }
  const name = new Map((svcs ?? []).map((s) => [s.id, s.name as string]))

  const open = requests.filter((r) => OPEN_STATUSES.includes(r.status as RequestStatus))
  const past = requests.filter((r) => !OPEN_STATUSES.includes(r.status as RequestStatus))
  const reminders = remindersForMonth(new Date().getMonth())

  const Row = ({ r }: { r: MaintenanceRequest }) => (
    <Link href={`/homeowner/maintenance/${r.id}`} className="group flex flex-wrap items-center gap-x-4 gap-y-2 border border-ink-900/15 bg-white p-4 transition-colors hover:border-ink-900 sm:flex-nowrap">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-ink-900 text-white"><CategoryIcon category={r.category} size={18} /></span>
      <span className="min-w-0 flex-1 basis-40">
        <span className="block truncate text-sm font-semibold text-ink-900">{name.get(r.service_id) ?? CATEGORY_META[r.category].label}</span>
        <span className="block truncate text-xs text-stone-500">{r.request_number} · {fmtDate(r.created_at)} · {r.address_snapshot}</span>
      </span>
      <span className="ml-auto flex items-center gap-2 sm:ml-0">
        <RequestStatusBadge status={r.status as RequestStatus} />
        <ChevronRight size={16} className="text-ink-900/60 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-900/60">Home care</p>
          <h1 className="page-title">Home maintenance</h1>
          <p className="mt-1 text-sm text-stone-500">Request a service, follow its progress and see what you have booked before.</p>
        </div>
        <Link href="/homeowner/maintenance/new"><Button icon={<Plus size={16} />}>Request a service</Button></Link>
      </div>

      {members.length > 0 && (
        <Link href="/homeowner/membership" className="flex items-center gap-3 border-2 border-ink-900 bg-white p-4 transition-colors hover:bg-paper-100">
          <BadgeCheck size={20} className="text-cobalt-500" />
          <span className="flex-1 text-sm text-ink-900">
            <strong>{members.map((m) => m.plan_snapshot.name).join(', ')}</strong> membership{members.length > 1 ? 's' : ''} — see benefits and usage
          </span>
          <ChevronRight size={16} className="text-ink-900/60" />
        </Link>
      )}

      {requests.length === 0 ? (
        <EmptyState tone="warm" icon={<Wrench size={22} />} title="No maintenance requests yet"
          description="Need a repair, a service or a check-up? Tell us what your home needs and HomeServe will take it from there."
          action={<Link href="/homeowner/maintenance/new"><Button icon={<Plus size={14} />}>Request a service</Button></Link>} />
      ) : (
        <>
          <section>
            <h2 className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Open ({open.length})</h2>
            <div className="space-y-2">{open.length ? open.map((r) => <Row key={r.id} r={r} />) : <p className="text-sm text-stone-500">Nothing open right now.</p>}</div>
          </section>
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Closed ({past.length})</h2>
              <div className="space-y-2">{past.map((r) => <Row key={r.id} r={r} />)}</div>
            </section>
          )}
        </>
      )}

      <HomesManager properties={(homes ?? []) as Property[]} />

      {reminders.length > 0 && (
        <section className="border-2 border-dashed border-ink-900/25 p-5">
          <h2 className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Worth thinking about this time of year</h2>
          <ul className="mt-3 space-y-3">
            {reminders.map((r) => (
              <li key={r.title} className="flex items-start gap-3 text-sm">
                <CategoryIcon category={r.category} size={16} className="mt-0.5 shrink-0 text-cobalt-500" />
                <span><strong className="text-ink-900">{r.title}.</strong> <span className="text-stone-600">{r.body}</span>{' '}
                  <Link href={`/homeowner/maintenance/new?category=${r.category}`} className="font-medium text-cobalt-600 underline-offset-4 hover:underline">Request</Link>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
