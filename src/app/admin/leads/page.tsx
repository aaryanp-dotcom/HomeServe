import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/shared'

export const metadata: Metadata = { title: 'Leads — Admin' }

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' }> = {
  new:                  { label: 'New',              variant: 'danger' },
  contacted:            { label: 'Contacted',        variant: 'warning' },
  qualified:            { label: 'Qualified',        variant: 'accent' },
  site_visit_scheduled: { label: 'Visit Scheduled', variant: 'accent' },
  site_visit_completed: { label: 'Visit Done',      variant: 'accent' },
  quote_preparation:    { label: 'Quote Prep',      variant: 'warning' },
  quote_sent:           { label: 'Quote Sent',      variant: 'accent' },
  negotiation:          { label: 'Negotiation',     variant: 'warning' },
  won:                  { label: 'Won',             variant: 'success' },
  lost:                 { label: 'Lost',            variant: 'default' },
}

const BUDGET_LABELS: Record<string, string> = {
  under_5L: '<₹5L', '5_10L': '₹5–10L', '10_20L': '₹10–20L',
  '20_30L': '₹20–30L', '30L_plus': '₹30L+', not_sure: 'TBD',
}

const STATUS_TABS = [
  { id: '',                    label: 'All' },
  { id: 'new',                 label: 'New' },
  { id: 'contacted',           label: 'Contacted' },
  { id: 'site_visit_scheduled',label: 'Visit Scheduled' },
  { id: 'site_visit_completed',label: 'Visit Done' },
  { id: 'quote_sent',          label: 'Quote Sent' },
  { id: 'won',                 label: 'Won' },
  { id: 'lost',                label: 'Lost' },
]

function scopeLabel(scope: string[]) {
  if (!scope || scope.length === 0) return '—'
  const MAP: Record<string, string> = {
    full_home: 'Full Home', kitchen: 'Kitchen', bathroom: 'Bathroom',
    living_room: 'Living Room', bedroom: 'Bedroom', painting: 'Painting',
    flooring: 'Flooring', false_ceiling: 'Ceiling', electrical: 'Electrical',
    plumbing: 'Plumbing', carpentry: 'Carpentry', civil_work: 'Civil', other: 'Other',
  }
  return scope.slice(0, 2).map(s => MAP[s] ?? s).join(', ') + (scope.length > 2 ? ` +${scope.length - 2}` : '')
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminLeadsPage({ searchParams }: Props) {
  const { status } = await searchParams

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')

  let query = supabase
    .from('renovation_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: requests } = await query

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Leads & Enquiries</h1>
          <p className="text-sm text-stone-500 mt-0.5">All renovation requests from homeowners</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id ? `/admin/leads?status=${tab.id}` : '/admin/leads'}
            className={`inline-flex items-center whitespace-nowrap text-xs font-medium px-3.5 py-2 coarse:min-h-11 border transition-all ${
              (tab.id === '' && !status) || status === tab.id
                ? 'bg-cobalt-500 text-white border-cobalt-500'
                : 'bg-white text-stone-600 border-stone-200 hover:border-cobalt-300'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
        <table className="min-w-[600px] w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Request #</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">Location</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">Scope</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden lg:table-cell">Budget</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">Date</th>
              <th className="text-right px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {(requests ?? []).map((r) => {
              const cfg = STATUS_CONFIG[r.status] ?? { label: r.status, variant: 'default' as const }
              return (
                <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-stone-500">{r.request_number ?? r.id.slice(0, 8)}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-stone-800">{r.full_name}</p>
                    <p className="text-xs text-stone-400">{r.mobile}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <p className="text-sm text-stone-700">{r.city}</p>
                    <p className="text-xs text-stone-400 truncate max-w-[140px]">{r.locality}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-sm text-stone-500">
                    {scopeLabel(r.scope as string[])}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-stone-500">
                    {r.budget_range ? BUDGET_LABELS[r.budget_range] ?? r.budget_range : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={cfg.variant} dot size="sm">{cfg.label}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-stone-400 text-xs hidden md:table-cell">
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/admin/leads/${r.id}`} className="coarse:min-h-11 inline-flex items-center gap-1 text-xs font-medium text-cobalt-500 hover:text-cobalt-700">
                      View <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              )
            })}
            {(requests ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-stone-400">
                  No leads found{status ? ` with status "${status}"` : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
