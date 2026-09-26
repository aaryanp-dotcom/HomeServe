import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, AlertTriangle } from 'lucide-react'
import { adminPage } from '@/lib/maintenance/page-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { RequestStatusBadge } from '@/components/maintenance/StatusTrack'
import { CATEGORY_META, type RequestStatus } from '@/lib/maintenance/config'
import { fmtDate, rupees } from '@/lib/maintenance/format'
import { cn } from '@/lib/utils'
import type { MaintenanceRequest } from '@/lib/maintenance/types'

export const metadata: Metadata = { title: 'Maintenance — Admin' }

const TABS: { key: string; label: string; statuses: RequestStatus[] }[] = [
  { key: 'new',       label: 'New',       statuses: ['requested'] },
  { key: 'scheduled', label: 'Scheduled', statuses: ['confirmed', 'scheduled'] },
  { key: 'active',    label: 'Active',    statuses: ['visit_underway', 'in_progress', 'completed', 'customer_confirmed'] },
  { key: 'completed', label: 'Completed', statuses: ['closed'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
]

export default async function AdminMaintenancePage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const sp = await searchParams
  const { supabase } = await adminPage('/admin/maintenance')

  const [{ data: all }, { data: expiring }] = await Promise.all([
    supabase.from('maintenance_requests').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('maintenance_subscriptions').select('id').eq('status', 'active').lte('end_date', new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)),
  ])
  const requests = (all ?? []) as MaintenanceRequest[]
  // Land on the first queue that has something in it (New → Scheduled → Active), unless one was chosen.
  const firstWithWork = TABS.find((t) => requests.some((r) => t.statuses.includes(r.status as RequestStatus))) ?? TABS[0]
  const tab = TABS.find((t) => t.key === sp.tab) ?? (requests.some((r) => TABS[0].statuses.includes(r.status as RequestStatus)) ? TABS[0] : firstWithWork)
  const count = (t: (typeof TABS)[number]) => requests.filter((r) => t.statuses.includes(r.status as RequestStatus)).length
  const rows = requests.filter((r) => tab.statuses.includes(r.status as RequestStatus))

  const uids = Array.from(new Set(rows.map((r) => r.user_id)))
  const svcIds = Array.from(new Set(rows.map((r) => r.service_id)))
  const admin = createAdminClient()
  const [{ data: profiles }, { data: svcs }] = await Promise.all([
    uids.length ? admin.from('user_profiles').select('user_id, full_name, phone').in('user_id', uids) : { data: [] },
    svcIds.length ? admin.from('maintenance_services').select('id, name').in('id', svcIds) : { data: [] },
  ])
  const who = new Map((profiles ?? []).map((p) => [p.user_id, p]))
  const svc = new Map((svcs ?? []).map((s) => [s.id, s.name as string]))
  const q = (sp.q ?? '').trim().toLowerCase()
  const shown = q ? rows.filter((r) => `${r.request_number} ${who.get(r.user_id)?.full_name ?? ''} ${r.address_snapshot}`.toLowerCase().includes(q)) : rows

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="mt-1 text-sm text-stone-500">Customer service requests, from first request to close.</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Maintenance sections">
          {[['/admin/maintenance/new', 'New request'], ['/admin/maintenance/memberships', `Memberships${expiring?.length ? ` (${expiring.length} ending soon)` : ''}`], ['/admin/maintenance/services', 'Service catalogue'], ['/admin/maintenance/plans', 'Plans'], ['/admin/maintenance/audit', 'Audit log']].map(([h, l]) => (
            <Link key={h} href={h} className="inline-flex items-center coarse:min-h-11 border border-ink-900/25 bg-white px-3 py-1.5 font-medium text-ink-900 hover:border-ink-900">{l}</Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink-900">
        <div className="flex flex-wrap gap-1" role="tablist">
          {TABS.map((t) => (
            <Link key={t.key} href={`/admin/maintenance?tab=${t.key}`} role="tab" aria-selected={t.key === tab.key}
              className={cn('border-2 border-b-0 px-4 py-2 text-sm font-medium', t.key === tab.key ? 'border-ink-900 bg-white text-ink-900' : 'border-transparent text-stone-500 hover:text-ink-900')}>
              {t.label} <span className="font-mono text-xs text-stone-400">{count(t)}</span>
            </Link>
          ))}
        </div>
        <form className="pb-2"><input type="hidden" name="tab" value={tab.key} />
          <input name="q" defaultValue={sp.q} placeholder="Search number, customer, address" aria-label="Search requests" className="field w-64" />
        </form>
      </div>

      {shown.length === 0 ? (
        <p className="border border-ink-900/15 bg-white p-8 text-center text-sm text-stone-500">No requests here.</p>
      ) : (
        <div className="overflow-x-auto border-2 border-ink-900 bg-white" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b-2 border-ink-900 bg-paper-100 text-left font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-900/60">
              <th className="p-3">Request</th><th className="p-3">Customer</th><th className="p-3">Service</th><th className="p-3">Status</th><th className="p-3 text-right">Due</th><th className="w-8"><span className="sr-only">Open</span></th>
            </tr></thead>
            <tbody className="divide-y divide-ink-900/10">
              {shown.map((r) => (
                <tr key={r.id} className="hover:bg-paper-100">
                  <td className="p-3"><Link href={`/admin/maintenance/${r.id}`} className="font-semibold text-ink-900">{r.request_number}</Link>
                    <span className="block text-xs text-stone-500">{fmtDate(r.created_at)}{r.urgency === 'urgent' && <span className="ml-2 inline-flex items-center gap-1 font-semibold text-rose-700"><AlertTriangle size={11} />Urgent</span>}{r.subscription_id && <span className="ml-2 text-sage-700">Member</span>}</span></td>
                  <td className="p-3">{who.get(r.user_id)?.full_name ?? '—'}<span className="block text-xs text-stone-500">{r.city}</span></td>
                  <td className="p-3">{svc.get(r.service_id) ?? CATEGORY_META[r.category].label}</td>
                  <td className="p-3"><RequestStatusBadge status={r.status as RequestStatus} audience="admin" /></td>
                  <td className="p-3 text-right">{Number(r.amount_due) > 0 ? <>{rupees(Number(r.amount_due))}<span className="block text-xs text-stone-500">{r.payment_status}</span></> : '—'}</td>
                  <td className="p-3"><Link href={`/admin/maintenance/${r.id}`} aria-label={`Open ${r.request_number}`}><ChevronRight size={16} className="text-ink-900/60" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
