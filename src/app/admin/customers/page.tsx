import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { User, ArrowUpRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Customers — Admin' }

export default async function AdminCustomersPage() {
  const cookieStore = cookies()
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

  // Fetch all homeowner profiles, joined with request count
  const { data: customers } = await supabase
    .from('user_profiles')
    .select('id, user_id, full_name, email, phone, created_at')
    .eq('role', 'homeowner')
    .order('created_at', { ascending: false })

  // For each customer, count their requests and active projects
  // We do this via a separate query to avoid complex joins at the DB layer
  const { data: requestCounts } = await supabase
    .from('renovation_requests')
    .select('user_id')

  const { data: projectCounts } = await supabase
    .from('bookings')
    .select('homeowner_id, status')
    .eq('booking_type', 'project')
    .neq('status', 'cancelled')

  const reqMap = new Map<string, number>()
  ;(requestCounts ?? []).forEach(r => {
    if (r.user_id) reqMap.set(r.user_id, (reqMap.get(r.user_id) ?? 0) + 1)
  })
  const projMap = new Map<string, { active: number; completed: number }>()
  ;(projectCounts ?? []).forEach(p => {
    if (!projMap.has(p.homeowner_id)) projMap.set(p.homeowner_id, { active: 0, completed: 0 })
    const entry = projMap.get(p.homeowner_id)!
    if (p.status === 'completed') entry.completed++
    else entry.active++
  })

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">

      <div>
        <h1 className="page-title">Customers</h1>
        <p className="text-sm text-stone-500 mt-0.5">{(customers ?? []).length} registered homeowners</p>
      </div>

      {(customers ?? []).length === 0 ? (
        <div className="flex items-center justify-center p-12 border border-dashed border-stone-200 ">
          <p className="text-sm text-stone-400">No customers registered yet</p>
        </div>
      ) : (
        <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="min-w-[600px] w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left panel-title px-4 py-3">Customer</th>
                <th className="text-left panel-title px-4 py-3 hidden sm:table-cell">Contact</th>
                <th className="text-center panel-title px-4 py-3">Requests</th>
                <th className="text-center panel-title px-4 py-3 hidden md:table-cell">Projects</th>
                <th className="text-right panel-title px-4 py-3 hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(customers ?? []).map(c => {
                const requests = reqMap.get(c.user_id) ?? 0
                const projects = projMap.get(c.user_id)
                return (
                  <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-cobalt-100 text-cobalt-600 flex items-center justify-center shrink-0">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="font-medium text-stone-800">{c.full_name ?? '—'}</p>
                          <p className="text-xs text-stone-400 sm:hidden">{c.email ?? c.phone ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-stone-600">{c.email ?? '—'}</p>
                      {c.phone && <p className="text-xs text-stone-400">{c.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold ${
                        requests > 0 ? 'bg-cobalt-100 text-cobalt-700' : 'bg-stone-100 text-stone-400'
                      }`}>
                        {requests}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-center">
                      <div className="flex items-center justify-center gap-2 text-xs text-stone-600">
                        {projects ? (
                          <>
                            {projects.active > 0 && (
                              <span className="px-2 py-0.5 bg-cobalt-50 text-cobalt-600 font-medium">
                                {projects.active} active
                              </span>
                            )}
                            {projects.completed > 0 && (
                              <span className="px-2 py-0.5 bg-sage-50 text-sage-700 font-medium">
                                {projects.completed} done
                              </span>
                            )}
                            {projects.active === 0 && projects.completed === 0 && (
                              <span className="text-stone-400">—</span>
                            )}
                          </>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-right">
                      <span className="text-xs text-stone-400">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${c.user_id}`}
                        aria-label="Open customer" className="flex items-center justify-center h-7 w-7 coarse:h-11 coarse:w-11 border border-ink-900/25 hover:border-ink-900 hover:text-cobalt-600 transition-colors text-stone-600"
                      >
                        <ArrowUpRight size={13} />
                      </Link>
                    </td>
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
