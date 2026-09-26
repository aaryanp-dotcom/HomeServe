import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  Users, Package, TrendingUp,
  ChevronRight, AlertCircle, MapPin,
  PhoneCall, FileText, CreditCard,
  ArrowUpRight, BarChart3, Wrench, LifeBuoy,
} from 'lucide-react'
import { Badge } from '@/components/ui/shared'
import { CATEGORY_META, type MaintenanceCategory } from '@/lib/maintenance/config'

export const metadata: Metadata = { title: 'Admin Dashboard' }

// ── Config ────────────────────────────────────────────────────────────────────

const LEAD_STATUS_CFG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' }> = {
  new:                  { label: 'New',             variant: 'danger' },
  contacted:            { label: 'Contacted',       variant: 'warning' },
  qualified:            { label: 'Qualified',       variant: 'accent' },
  site_visit_scheduled: { label: 'Visit Scheduled', variant: 'accent' },
  site_visit_completed: { label: 'Visit Done',      variant: 'accent' },
  quote_preparation:    { label: 'Quote Prep',      variant: 'warning' },
  quote_sent:           { label: 'Quote Sent',      variant: 'accent' },
  negotiation:          { label: 'Negotiation',     variant: 'warning' },
  won:                  { label: 'Won',             variant: 'success' },
  lost:                 { label: 'Lost',            variant: 'default' },
}

const SCOPE_MAP: Record<string, string> = {
  full_home: 'Full Home', kitchen: 'Kitchen', bathroom: 'Bathroom',
  living_room: 'Living Room', bedroom: 'Bedroom', painting: 'Painting',
  flooring: 'Flooring', false_ceiling: 'Ceiling', electrical: 'Electrical',
  plumbing: 'Plumbing', carpentry: 'Carpentry', civil_work: 'Civil', other: 'Other',
}

function scopeLabel(scope: string[]) {
  if (!scope?.length) return '—'
  return scope.slice(0, 2).map(s => SCOPE_MAP[s] ?? s).join(', ') + (scope.length > 2 ? ` +${scope.length - 2}` : '')
}

// ── Data fetcher ──────────────────────────────────────────────────────────────

async function getAdminData() {
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

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')

  const today = new Date().toISOString().slice(0, 10)

  const [
    recentRequestsRes,
    allLeadsCountRes,
    newLeadsRes,
    contactedLeadsRes,
    wonLeadsRes,
    lostLeadsRes,
    quotesSentRes,
    activeProjectsRes,
    completedProjectsRes,
    revenueRes,
    outstandingRes,
    customersRes,
    upcomingVisitsRes,
    overdueLeadsRes,
    recentQuotationsRes,
    thisMonthLeadsRes,
    thisMonthRevenueRes,
    maintenanceOpenRes,
    maintenanceTriageRes,
    maintenanceRevenueRes,
    activeMembersRes,
  ] = await Promise.all([
    // Recent requests (feed)
    supabase
      .from('renovation_requests')
      .select('id, request_number, full_name, mobile, city, locality, scope, status, created_at, budget_range')
      .order('created_at', { ascending: false })
      .limit(8),

    // Total leads ever
    supabase.from('renovation_requests').select('id', { count: 'exact', head: true }),

    // New (uncontacted)
    supabase.from('renovation_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),

    // In contact stage
    supabase.from('renovation_requests').select('id', { count: 'exact', head: true })
      .in('status', ['contacted', 'qualified']),

    // Won
    supabase.from('renovation_requests').select('id', { count: 'exact', head: true }).eq('status', 'won'),

    // Lost
    supabase.from('renovation_requests').select('id', { count: 'exact', head: true }).eq('status', 'lost'),

    // Quotes sent/viewed
    supabase.from('renovation_requests').select('id', { count: 'exact', head: true })
      .in('status', ['quote_sent', 'negotiation']),

    // Active projects
    supabase.from('bookings').select('id', { count: 'exact', head: true })
      .in('status', ['confirmed', 'assigned', 'in_progress', 'milestone_1_done', 'milestone_2_done'])
      .eq('booking_type', 'project'),

    // Completed projects
    supabase.from('bookings').select('id', { count: 'exact', head: true })
      .eq('status', 'completed').eq('booking_type', 'project'),

    // Total revenue collected
    supabase.from('payments').select('amount').eq('status', 'captured'),

    // Outstanding (total booked - paid)
    supabase.from('bookings')
      .select('total_amount, paid_amount')
      .in('status', ['payment_pending', 'confirmed', 'assigned', 'in_progress', 'milestone_1_done', 'milestone_2_done'])
      .eq('booking_type', 'project'),

    // Total homeowner accounts
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', 'homeowner'),

    // Upcoming site visits (today + future, not completed/cancelled)
    supabase.from('site_visits')
      .select('id, scheduled_date, scheduled_time, status, request_id, renovation_requests(full_name, city)')
      .gte('scheduled_date', today)
      .in('status', ['scheduled', 'requested'])
      .order('scheduled_date', { ascending: true })
      .limit(5),

    // Leads older than 2 days still 'new' (need follow-up)
    supabase.from('renovation_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
      .lt('created_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()),

    // Recent quotations
    supabase.from('quotations')
      .select('id, quotation_number, status, total_amount, created_at, customer_name')
      .order('created_at', { ascending: false })
      .limit(5),

    // Leads this month
    supabase.from('renovation_requests')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

    // Revenue this month
    supabase.from('payments')
      .select('amount')
      .eq('status', 'captured')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

    // Home maintenance: open requests (not yet closed/cancelled)
    supabase.from('maintenance_requests').select('id', { count: 'exact', head: true })
      .not('status', 'in', '(closed,cancelled)'),

    // Maintenance requests still waiting on HomeServe to even confirm them
    supabase.from('maintenance_requests')
      .select('id, request_number, category, urgency, created_at')
      .eq('status', 'requested')
      .order('created_at', { ascending: true })
      .limit(5),

    // Maintenance revenue collected
    supabase.from('maintenance_payments').select('amount').eq('status', 'captured'),

    // Active/upcoming memberships
    supabase.from('maintenance_subscriptions').select('id', { count: 'exact', head: true }).in('status', ['active', 'upcoming']),
  ])

  const totalRevenue = (revenueRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0)
  const thisMonthRevenue = (thisMonthRevenueRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0)
  const outstandingAmount = (outstandingRes.data ?? []).reduce(
    (s, b) => s + (Number(b.total_amount) - Number(b.paid_amount)), 0,
  )

  const total = allLeadsCountRes.count ?? 0
  const won = wonLeadsRes.count ?? 0
  const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0

  return {
    recentRequests: recentRequestsRes.data ?? [],
    recentQuotations: recentQuotationsRes.data ?? [],
    upcomingVisits: upcomingVisitsRes.data ?? [],
    // counts
    newLeads:          newLeadsRes.count ?? 0,
    contactedLeads:    contactedLeadsRes.count ?? 0,
    quotesSent:        quotesSentRes.count ?? 0,
    wonLeads:          won,
    lostLeads:         lostLeadsRes.count ?? 0,
    totalLeads:        total,
    activeProjects:    activeProjectsRes.count ?? 0,
    completedProjects: completedProjectsRes.count ?? 0,
    customers:         customersRes.count ?? 0,
    overdueLeads:      overdueLeadsRes.count ?? 0,
    thisMonthLeads:    thisMonthLeadsRes.count ?? 0,
    // financials
    totalRevenue,
    thisMonthRevenue,
    outstandingAmount,
    conversionRate,
    // home maintenance
    maintenanceOpen:    maintenanceOpenRes.count ?? 0,
    maintenanceTriage:  maintenanceTriageRes.data ?? [],
    maintenanceRevenue: (maintenanceRevenueRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0),
    activeMembers:      activeMembersRes.count ?? 0,
  }
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function Stat({
  label, value, sub, icon, href, accent = false, alert = false,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  href?: string
  accent?: boolean
  alert?: boolean
}) {
  const inner = (
    <div className={`p-5 border transition-all h-full ${
      alert  ? 'bg-rose-50 border-rose-200' :
      accent ? 'bg-cobalt-500 border-cobalt-500' :
               'bg-white border-ink-900/15 hover:border-ink-900/50 hover:border-ink-900'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`h-8 w-8 flex items-center justify-center ${
          alert  ? 'bg-rose-100 text-rose-700' :
          accent ? 'bg-cobalt-400 text-white' :
                   'bg-stone-100 text-stone-500'
        }`}>
          {icon}
        </div>
        {href && (
          <ArrowUpRight size={13} className={accent ? 'text-white/90' : 'text-stone-500'} />
        )}
      </div>
      <p className={`text-2xl font-bold tracking-tight ${accent ? 'text-white' : alert ? 'text-rose-700' : 'text-stone-900'}`}>
        {value}
      </p>
      <p className={`text-xs mt-0.5 ${accent ? 'text-white/90' : alert ? 'text-rose-700' : 'text-stone-500'}`}>{label}</p>
      {sub && <p className={`text-xs mt-1 font-medium ${accent ? 'text-white/90' : 'text-stone-400'}`}>{sub}</p>}
    </div>
  )
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner
}

// ── Pipeline bar ──────────────────────────────────────────────────────────────

function PipelineBar({
  stages,
}: {
  stages: { label: string; count: number; href: string; color: string }[]
}) {
  const max = Math.max(...stages.map(s => s.count), 1)
  return (
    <div className="space-y-2">
      {stages.map(({ label, count, href, color }) => (
        <Link key={label} href={href} className="flex items-center gap-3 group">
          <span className="w-28 text-xs text-stone-500 shrink-0 text-right">{label}</span>
          <div className="flex-1 h-5 bg-stone-100 overflow-hidden">
            <div
              className={`h-full transition-all ${color}`}
              style={{ width: `${Math.max((count / max) * 100, count > 0 ? 8 : 0)}%` }}
            />
          </div>
          <span className="w-6 text-xs font-semibold text-stone-700 shrink-0">{count}</span>
        </Link>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const d = await getAdminData()

  const fmt = (n: number) => n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
    ? `₹${(n / 1000).toFixed(0)}K`
    : `₹${n.toLocaleString('en-IN')}`

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            HomeServe · Delhi NCR ·{' '}
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link href="/get-started" target="_blank"
          className="coarse:min-h-11 hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-ink-900 text-white hover:bg-cobalt-600 transition-colors"
        >
          View Site
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Alert strip — uncontacted leads */}
      {d.overdueLeads > 0 && (
        <Link href="/admin/leads?status=new"
          className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 hover:border-rose-300 transition-all"
        >
          <AlertCircle size={16} className="text-rose-700 shrink-0" />
          <p className="text-sm text-rose-800 font-medium">
            {d.overdueLeads} lead{d.overdueLeads !== 1 ? 's' : ''} have not been contacted in over 2 days
          </p>
          <span className="ml-auto text-xs font-semibold text-rose-700 flex items-center gap-1">
            Review <ChevronRight size={12} />
          </span>
        </Link>
      )}

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label={`New leads${d.thisMonthLeads > 0 ? ` · ${d.thisMonthLeads} this month` : ''}`}
          value={d.newLeads}
          icon={<AlertCircle size={16} />}
          href="/admin/leads?status=new"
          alert={d.newLeads > 0}
        />
        <Stat
          label="Active projects"
          value={d.activeProjects}
          sub={`${d.completedProjects} completed`}
          icon={<Package size={16} />}
          href="/admin/bookings"
          accent
        />
        <Stat
          label="Revenue collected"
          value={fmt(d.totalRevenue)}
          sub={d.thisMonthRevenue > 0 ? `${fmt(d.thisMonthRevenue)} this month` : undefined}
          icon={<TrendingUp size={16} />}
          href="/admin/payments"
        />
        <Stat
          label="Outstanding"
          value={fmt(d.outstandingAmount)}
          sub={`${d.customers} customers`}
          icon={<CreditCard size={16} />}
          href="/admin/payments"
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left col: recent requests */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent requests table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-stone-900">Recent Requests</h2>
              <Link href="/admin/leads"
                className="text-xs font-medium text-cobalt-500 hover:text-cobalt-600 flex items-center gap-1"
              >
                All {d.totalLeads} leads <ChevronRight size={13} />
              </Link>
            </div>
            <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
              <table className="min-w-[600px] w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">Scope</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {d.recentRequests.map((r) => {
                    const cfg = LEAD_STATUS_CFG[r.status] ?? { label: r.status, variant: 'default' as const }
                    return (
                      <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-stone-800 truncate max-w-[130px]">{r.full_name}</p>
                          <p className="text-xs text-stone-400">{r.mobile}</p>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <p className="text-sm text-stone-600">{r.city}</p>
                          <p className="text-xs text-stone-400 truncate max-w-[100px]">{r.locality}</p>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-xs text-stone-500">
                          {scopeLabel(r.scope as string[])}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={cfg.variant} dot size="sm">{cfg.label}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link href={`/admin/leads/${r.id}`}
                            className="text-xs text-cobalt-500 hover:text-cobalt-700 font-medium"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                  {d.recentRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-400">
                        No requests yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent quotations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-stone-900">Recent Quotations</h2>
              <Link href="/admin/quotations"
                className="text-xs font-medium text-cobalt-500 hover:text-cobalt-600 flex items-center gap-1"
              >
                All <ChevronRight size={13} />
              </Link>
            </div>
            <div className="space-y-2">
              {d.recentQuotations.length === 0 ? (
                <p className="text-sm text-stone-400 py-4 text-center">No quotations yet</p>
              ) : d.recentQuotations.map((q) => {
                const QS_CFG: Record<string, { label: string; variant: 'success' | 'warning' | 'accent' | 'default' | 'danger' }> = {
                  draft: { label: 'Draft', variant: 'default' },
                  sent:  { label: 'Sent',  variant: 'accent' },
                  viewed:{ label: 'Viewed',variant: 'accent' },
                  accepted: { label: 'Accepted', variant: 'success' },
                  rejected: { label: 'Rejected', variant: 'danger' },
                  revision_requested: { label: 'Revision', variant: 'warning' },
                }
                const qcfg = QS_CFG[q.status] ?? { label: q.status, variant: 'default' as const }
                return (
                  <Link key={q.id} href={`/admin/quotations/${q.id}`}
                    className="flex items-center justify-between gap-3 p-4 border border-ink-900/15 bg-white hover:border-ink-900/50 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{q.customer_name}</p>
                      <p className="text-xs text-stone-400 font-mono">{q.quotation_number ?? q.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {q.total_amount > 0 && (
                        <span className="text-sm font-semibold text-stone-700">
                          ₹{Number(q.total_amount).toLocaleString('en-IN')}
                        </span>
                      )}
                      <Badge variant={qcfg.variant} size="sm">{qcfg.label}</Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-6">

          {/* Lead pipeline funnel */}
          <div className="p-5 border border-ink-900/15 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <BarChart3 size={15} className="text-cobalt-500" />
                Lead Pipeline
              </h3>
              <span className="text-xs text-stone-400">{d.conversionRate}% conversion</span>
            </div>
            <PipelineBar stages={[
              { label: 'New',          count: d.newLeads,       href: '/admin/leads?status=new',                  color: 'bg-rose-400' },
              { label: 'In Contact',   count: d.contactedLeads, href: '/admin/leads?status=contacted',            color: 'bg-amber-400' },
              { label: 'Quote Sent',   count: d.quotesSent,     href: '/admin/leads?status=quote_sent',           color: 'bg-cobalt-400' },
              { label: 'Won',          count: d.wonLeads,       href: '/admin/leads?status=won',                  color: 'bg-sage-500' },
              { label: 'Lost',         count: d.lostLeads,      href: '/admin/leads?status=lost',                 color: 'bg-stone-300' },
            ]} />
            <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-stone-900">{d.totalLeads}</p>
                <p className="text-xs text-stone-400">Total leads</p>
              </div>
              <div>
                <p className="text-lg font-bold text-sage-700">{d.conversionRate}%</p>
                <p className="text-xs text-stone-400">Conversion</p>
              </div>
            </div>
          </div>

          {/* Upcoming site visits */}
          <div className="p-5 border border-ink-900/15 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <MapPin size={15} className="text-cobalt-500" />
                Upcoming Visits
              </h3>
              <Link href="/admin/site-visits"
                className="text-xs text-cobalt-500 hover:text-cobalt-700 font-medium"
              >
                All visits
              </Link>
            </div>
            {d.upcomingVisits.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-stone-400">No upcoming visits</p>
                <Link href="/admin/site-visits/new"
                  className="mt-2 inline-block text-xs font-semibold text-cobalt-500 hover:text-cobalt-700"
                >
                  + Schedule one
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {d.upcomingVisits.map((v) => {
                  const req = Array.isArray(v.renovation_requests)
                    ? v.renovation_requests[0]
                    : v.renovation_requests
                  const isToday = v.scheduled_date === new Date().toISOString().slice(0, 10)
                  return (
                    <Link key={v.id} href={`/admin/site-visits`}
                      className="flex items-start justify-between gap-2 py-2 border-b border-stone-50 last:border-0"
                    >
                      <div>
                        <p className="text-xs font-medium text-stone-800">
                          {(req as { full_name?: string })?.full_name ?? '—'}
                        </p>
                        <p className="text-xs text-stone-400">
                          {(req as { city?: string })?.city ?? ''}
                          {v.scheduled_time ? ` · ${v.scheduled_time}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold shrink-0 ${isToday ? 'text-cobalt-600' : 'text-stone-400'}`}>
                        {isToday
                          ? 'Today'
                          : new Date(v.scheduled_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Home maintenance */}
          <div className="p-5 border border-ink-900/15 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <Wrench size={15} className="text-cobalt-500" />
                Home Maintenance
              </h3>
              <Link href="/admin/maintenance" className="text-xs text-cobalt-500 hover:text-cobalt-700 font-medium">All requests</Link>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-stone-900">{d.maintenanceOpen}</p>
                <p className="text-xs text-stone-400">Open requests</p>
              </div>
              <div>
                <p className="text-lg font-bold text-stone-900">{d.activeMembers}</p>
                <p className="text-xs text-stone-400">Members</p>
              </div>
              <div>
                <p className="text-lg font-bold text-stone-900">{fmt(d.maintenanceRevenue)}</p>
                <p className="text-xs text-stone-400">Revenue</p>
              </div>
            </div>
            {d.maintenanceTriage.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-2">Nothing waiting on triage</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Needs triage</p>
                {d.maintenanceTriage.map((r) => (
                  <Link key={r.id} href={`/admin/maintenance/${r.id}`} className="flex items-center justify-between gap-2 py-1.5 border-b border-stone-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-stone-800 truncate">{r.request_number}</p>
                      <p className="text-xs text-stone-400">{CATEGORY_META[r.category as MaintenanceCategory]?.label ?? r.category}</p>
                    </div>
                    {r.urgency === 'urgent' && <span className="shrink-0 text-xs font-semibold text-rose-700">Urgent</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'All Leads',    href: '/admin/leads',          icon: <PhoneCall size={14} />,  bg: 'bg-rose-50   text-rose-700' },
              { label: 'Site Visits',  href: '/admin/site-visits',    icon: <MapPin size={14} />,     bg: 'bg-cobalt-50 text-cobalt-600' },
              { label: 'Quotations',   href: '/admin/quotations',     icon: <FileText size={14} />,   bg: 'bg-amber-50  text-amber-700' },
              { label: 'Projects',     href: '/admin/bookings',       icon: <Package size={14} />,    bg: 'bg-sage-50   text-sage-700' },
              { label: 'Maintenance',  href: '/admin/maintenance',    icon: <Wrench size={14} />,     bg: 'bg-cobalt-50 text-cobalt-600' },
              { label: 'Payments',     href: '/admin/payments',       icon: <CreditCard size={14} />, bg: 'bg-stone-100 text-stone-600' },
              { label: 'Customers',    href: '/admin/users',          icon: <Users size={14} />,      bg: 'bg-stone-100 text-stone-600' },
              { label: 'Tickets',      href: '/admin/tickets',        icon: <LifeBuoy size={14} />,   bg: 'bg-rose-50   text-rose-700' },
            ].map(({ label, href, icon, bg }) => (
              <Link key={label} href={href}
                className="flex items-center gap-2 p-3 border border-ink-900/15 bg-white hover:border-ink-900/50 transition-all"
              >
                <div className={`h-7 w-7 flex items-center justify-center shrink-0 ${bg}`}>
                  {icon}
                </div>
                <span className="text-xs font-medium text-stone-700">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
