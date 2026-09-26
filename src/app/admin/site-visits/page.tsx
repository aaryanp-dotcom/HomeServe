import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Plus, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/shared'

export const metadata: Metadata = { title: 'Site Visits — Admin' }

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' }> = {
  requested:   { label: 'Requested',   variant: 'warning' },
  scheduled:   { label: 'Scheduled',   variant: 'accent' },
  completed:   { label: 'Completed',   variant: 'success' },
  rescheduled: { label: 'Rescheduled', variant: 'warning' },
  cancelled:   { label: 'Cancelled',   variant: 'danger' },
}

export default async function AdminSiteVisitsPage() {
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

  const { data: visits } = await supabase
    .from('site_visits')
    .select(`*, request:renovation_requests(full_name, mobile, city, locality, scope)`)
    .order('scheduled_date', { ascending: true })
    .limit(100)

  const upcoming = (visits ?? []).filter(v => v.status !== 'completed' && v.status !== 'cancelled')
  const completed = (visits ?? []).filter(v => v.status === 'completed')

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Site Visits</h1>
          <p className="text-sm text-stone-500 mt-0.5">Schedule and manage customer site visits</p>
        </div>
        <Link href="/admin/site-visits/new"
          className="coarse:min-h-11 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 transition-colors"
        >
          <Plus size={15} /> Schedule Visit
        </Link>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-3">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="p-8 text-center border border-ink-900/15 bg-white">
            <p className="text-stone-400 text-sm">No upcoming site visits.</p>
            <Link href="/admin/leads" className="coarse:min-h-11 text-xs text-cobalt-500 hover:text-cobalt-700 mt-2 block">
              Go to leads to schedule one →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((visit) => {
              const req = (Array.isArray(visit.request) ? visit.request[0] : visit.request) as {
                full_name?: string; mobile?: string; city?: string; locality?: string; scope?: string[]
              } | null
              const cfg = STATUS_CONFIG[visit.status] ?? { label: visit.status, variant: 'default' as const }
              return (
                <div key={visit.id} className="flex items-center justify-between p-4 border border-ink-900/15 bg-white hover:border-ink-900/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 bg-cobalt-50 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-cobalt-600">
                        {visit.scheduled_date ? new Date(visit.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric' }) : '?'}
                      </span>
                      <span className="text-2xs text-cobalt-600 uppercase">
                        {visit.scheduled_date ? new Date(visit.scheduled_date).toLocaleDateString('en-IN', { month: 'short' }) : '—'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{req?.full_name ?? 'Customer'}</p>
                      <p className="text-xs text-stone-400">
                        {req?.locality}, {req?.city}
                        {visit.scheduled_time ? ` · ${visit.scheduled_time}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={cfg.variant} dot size="sm">{cfg.label}</Badge>
                    <Link href={`/admin/site-visits/${visit.id}`} className="coarse:min-h-11 inline-flex items-center text-xs text-cobalt-500 hover:text-cobalt-700 font-medium">
                      Details <ChevronRight size={12} className="inline" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-3">Completed ({completed.length})</h2>
          <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="min-w-[600px] w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {completed.map((visit) => {
                  const req = (Array.isArray(visit.request) ? visit.request[0] : visit.request) as {
                    full_name?: string; city?: string; locality?: string
                  } | null
                  return (
                    <tr key={visit.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3.5 font-medium text-stone-800">{req?.full_name ?? '—'}</td>
                      <td className="px-4 py-3.5 text-stone-500 hidden sm:table-cell">{req?.locality}, {req?.city}</td>
                      <td className="px-4 py-3.5 text-stone-500 text-xs">
                        {visit.scheduled_date ? new Date(visit.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link href={`/admin/site-visits/${visit.id}`} className="coarse:min-h-11 inline-flex items-center text-xs text-cobalt-500 hover:text-cobalt-700 font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
