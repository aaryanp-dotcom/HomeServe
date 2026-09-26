import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ArrowLeft, User } from 'lucide-react'
import { Badge } from '@/components/ui/shared'
import { CATEGORY_META, REQUEST_STATUS, type MaintenanceCategory, type RequestStatus } from '@/lib/maintenance/config'
import { fmtDate } from '@/lib/maintenance/format'

export const metadata: Metadata = { title: 'Customer Detail — Admin' }

interface Props { params: Promise<{ userId: string }> }

const LEAD_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' }> = {
  new: { label: 'New', variant: 'danger' },
  contacted: { label: 'Contacted', variant: 'warning' },
  qualified: { label: 'Qualified', variant: 'accent' },
  site_visit_scheduled: { label: 'Visit Scheduled', variant: 'accent' },
  site_visit_completed: { label: 'Visit Done', variant: 'accent' },
  quote_preparation: { label: 'Quote Prep', variant: 'warning' },
  quote_sent: { label: 'Quote Sent', variant: 'accent' },
  negotiation: { label: 'Negotiation', variant: 'warning' },
  won: { label: 'Won', variant: 'success' },
  lost: { label: 'Lost', variant: 'default' },
}

const BOOKING_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'accent' | 'default' | 'danger' }> = {
  payment_pending:  { label: 'Awaiting Advance', variant: 'warning' },
  confirmed:        { label: 'Confirmed',         variant: 'accent' },
  assigned:         { label: 'Team Assigned',     variant: 'accent' },
  in_progress:      { label: 'In Progress',       variant: 'accent' },
  milestone_1_done: { label: 'M1 Done',           variant: 'accent' },
  milestone_2_done: { label: 'M2 Done',           variant: 'accent' },
  completed:        { label: 'Completed',         variant: 'success' },
  cancelled:        { label: 'Cancelled',         variant: 'danger' },
}

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { userId } = await params

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

  const { data: adminProfile } = await supabase
    .from('user_profiles').select('role').eq('user_id', user.id).single()
  if (adminProfile?.role !== 'admin') redirect('/homeowner/dashboard')

  const { data: customerProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!customerProfile) notFound()

  // Fetch all activity for this customer in parallel
  const [requestsRes, projectsRes, paymentsRes, warrantyRes] = await Promise.all([
    supabase.from('renovation_requests')
      .select('id, request_number, city, scope, status, budget_range, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    supabase.from('bookings')
      .select('id, booking_number, project_title, status, total_amount, paid_amount, created_at')
      .eq('homeowner_id', userId)
      .eq('booking_type', 'project')
      .order('created_at', { ascending: false }),

    // payments has no homeowner column: filter through the booking it belongs to.
    supabase.from('payments')
      .select('id, amount, payment_type, status, created_at, booking:bookings!inner(homeowner_id)')
      .eq('booking.homeowner_id', userId)
      .eq('status', 'captured')
      .order('created_at', { ascending: false })
      .limit(10),

    supabase.from('warranty_requests')
      .select('id, issue_category, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  const [{ data: mreqs }, { data: msubs }] = await Promise.all([
    supabase.from('maintenance_requests').select('id, request_number, category, status, amount_due, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.from('maintenance_subscriptions').select('id, status, plan_snapshot, start_date, end_date').eq('user_id', userId).order('created_at', { ascending: false }),
  ])

  const requests  = requestsRes.data ?? []
  const projects  = projectsRes.data ?? []
  const payments  = paymentsRes.data ?? []
  const warranty  = warrantyRes.data ?? []
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)

  const SCOPE_MAP: Record<string, string> = {
    full_home: 'Full Home', kitchen: 'Kitchen', bathroom: 'Bathroom',
    living_room: 'Living Room', bedroom: 'Bedroom', painting: 'Painting',
    flooring: 'Flooring', false_ceiling: 'Ceiling', electrical: 'Electrical',
    plumbing: 'Plumbing', carpentry: 'Carpentry', civil_work: 'Civil', other: 'Other',
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/customers" aria-label="Back" className="inline-flex items-center justify-center coarse:min-h-11 coarse:min-w-11 p-2 hover:bg-stone-100 transition-colors mt-0.5">
          <ArrowLeft size={16} className="text-stone-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cobalt-100 text-cobalt-600 flex items-center justify-center shrink-0">
              <User size={18} />
            </div>
            <div>
              <h1 className="page-title">
                {customerProfile.full_name ?? 'Unnamed Customer'}
              </h1>
              <p className="text-xs text-stone-400">{customerProfile.email ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Renovation requests */}
          <div className="p-5 bg-white border border-ink-900/15 ">
            <h2 className="panel-title mb-4">Renovation Requests ({requests.length})</h2>
            {requests.length === 0 ? (
              <p className="text-xs text-stone-400">No requests submitted</p>
            ) : (
              <div className="space-y-2">
                {requests.map(r => {
                  const cfg = LEAD_STATUS[r.status] ?? { label: r.status, variant: 'default' as const }
                  return (
                    <Link key={r.id} href={`/admin/leads/${r.id}`}
                      className="flex items-center justify-between p-3 bg-stone-50 hover:bg-stone-100 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-stone-700 font-mono">{r.request_number}</p>
                        <p className="text-xs text-stone-500">
                          {r.city} · {(r.scope as string[]).slice(0, 2).map((s: string) => SCOPE_MAP[s] ?? s).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400">
                          {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="p-5 bg-white border border-ink-900/15 ">
            <h2 className="panel-title mb-4">Projects ({projects.length})</h2>
            {projects.length === 0 ? (
              <p className="text-xs text-stone-400">No projects created yet</p>
            ) : (
              <div className="space-y-2">
                {projects.map(p => {
                  const cfg = BOOKING_STATUS[p.status] ?? { label: p.status, variant: 'default' as const }
                  return (
                    <Link key={p.id} href={`/admin/projects/${p.id}`}
                      className="flex items-center justify-between p-3 bg-stone-50 hover:bg-stone-100 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-stone-700">
                          {p.project_title ?? p.booking_number}
                        </p>
                        <p className="text-xs text-stone-500">
                          ₹{Number(p.total_amount).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Home maintenance + membership */}
          {((mreqs ?? []).length > 0 || (msubs ?? []).length > 0) && (
            <div className="p-5 bg-white border border-ink-900/15 ">
              <h2 className="panel-title mb-4">Home Maintenance ({(mreqs ?? []).length})</h2>
              {(msubs ?? []).map((m) => (
                <div key={m.id} className="mb-2 flex items-center justify-between p-3 bg-sage-50 text-xs">
                  <span className="font-medium text-sage-800">{(m.plan_snapshot as { name: string }).name} membership · {fmtDate(m.start_date)} – {fmtDate(m.end_date)}</span>
                  <span className="uppercase text-sage-700">{m.status.replace('_', ' ')}</span>
                </div>
              ))}
              <div className="space-y-2">
                {(mreqs ?? []).map((r) => (
                  <Link key={r.id} href={`/admin/maintenance/${r.id}`} className="flex items-center justify-between p-3 bg-stone-50 text-xs hover:bg-stone-100">
                    <span className="text-stone-700">{r.request_number} · {CATEGORY_META[r.category as MaintenanceCategory]?.label}</span>
                    <span className="text-stone-400">{REQUEST_STATUS[r.status as RequestStatus]?.label} · {fmtDate(r.created_at)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Warranty */}
          {warranty.length > 0 && (
            <div className="p-5 bg-white border border-ink-900/15 ">
              <h2 className="panel-title mb-4">Service Requests ({warranty.length})</h2>
              <div className="space-y-2">
                {warranty.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-stone-50 text-xs">
                    <span className="text-stone-700 capitalize">{w.issue_category.replace(/_/g, ' ')}</span>
                    <span className="text-stone-400">
                      {new Date(w.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Contact */}
          <div className="p-4 bg-white border border-ink-900/15 ">
            <p className="panel-title mb-3">Contact</p>
            <div className="space-y-2 text-xs">
              {customerProfile.email && (
                <div>
                  <p className="text-stone-400">Email</p>
                  <p className="font-medium text-stone-700">{customerProfile.email}</p>
                </div>
              )}
              {customerProfile.phone && (
                <div>
                  <p className="text-stone-400">Phone</p>
                  <p className="font-medium text-stone-700">{customerProfile.phone}</p>
                </div>
              )}
              <div>
                <p className="text-stone-400">Joined</p>
                <p className="font-medium text-stone-700">
                  {new Date(customerProfile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 bg-stone-50 border border-ink-900/15 ">
            <p className="panel-title mb-3">Activity</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Requests</span>
                <span className="font-semibold text-stone-700">{requests.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Projects</span>
                <span className="font-semibold text-stone-700">{projects.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Total paid</span>
                <span className="font-semibold text-stone-700">₹{totalPaid.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
