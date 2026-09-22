import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HardHat } from 'lucide-react'
import { StatCard } from '@/components/ui/shared'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Site Team — Admin' }

export default async function AdminTeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')

  const { data: team } = await admin
    .from('user_profiles')
    .select('id, user_id, full_name, email, phone, created_at')
    .eq('role', 'contractor')
    .order('created_at', { ascending: false })

  const userIds = (team ?? []).map((t) => t.user_id)
  const safeIds = userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']

  const [{ data: contractorProfiles }, { data: bookings }, { data: visits }] = await Promise.all([
    admin.from('contractor_profiles').select('user_id, is_available, experience_years').in('user_id', safeIds),
    admin.from('bookings').select('contractor_id, status').in('contractor_id', safeIds),
    admin.from('maintenance_visits').select('technician_id, status').in('technician_id', safeIds),
  ])

  const cpMap = new Map((contractorProfiles ?? []).map((c) => [c.user_id, c]))
  const jobMap = new Map<string, { active: number; completed: number }>()
  const bump = (id: string | null, done: boolean) => {
    if (!id) return
    const entry = jobMap.get(id) ?? { active: 0, completed: 0 }
    if (done) entry.completed++; else entry.active++
    jobMap.set(id, entry)
  }
  for (const b of bookings ?? []) bump(b.contractor_id, b.status === 'completed')
  for (const v of visits ?? []) bump(v.technician_id, v.status === 'completed')

  const list = team ?? []
  const availableCount = list.filter((t) => cpMap.get(t.user_id)?.is_available !== false).length

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-6">
      <div>
        <h1 className="page-title">Site Team</h1>
        <p className="text-sm text-stone-500 mt-0.5">Technicians and site contractors who carry out jobs on HomeServe&apos;s behalf.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Team members" value={list.length} icon={<HardHat size={18} />} />
        <StatCard label="Available now" value={availableCount} icon={<HardHat size={18} />} />
      </div>

      {list.length === 0 ? (
        <div className="flex items-center justify-center p-12 border border-dashed border-stone-200">
          <p className="text-sm text-stone-400">No site team members yet</p>
        </div>
      ) : (
        <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="min-w-[640px] w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left panel-title px-4 py-3">Name</th>
                <th className="text-left panel-title px-4 py-3 hidden sm:table-cell">Contact</th>
                <th className="text-center panel-title px-4 py-3">Availability</th>
                <th className="text-center panel-title px-4 py-3">Active jobs</th>
                <th className="text-center panel-title px-4 py-3 hidden md:table-cell">Completed</th>
                <th className="text-right panel-title px-4 py-3 hidden lg:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {list.map((t) => {
                const cp = cpMap.get(t.user_id)
                const jobs = jobMap.get(t.user_id) ?? { active: 0, completed: 0 }
                const available = cp?.is_available !== false
                return (
                  <tr key={t.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-cobalt-100 text-cobalt-600 flex items-center justify-center shrink-0">
                          <HardHat size={14} />
                        </div>
                        <div>
                          <p className="font-medium text-stone-800">{t.full_name ?? '—'}</p>
                          <p className="text-xs text-stone-400 sm:hidden">{t.email ?? t.phone ?? '—'}</p>
                          {cp?.experience_years != null && <p className="text-xs text-stone-400">{cp.experience_years} yrs experience</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-stone-600">{t.email ?? '—'}</p>
                      {t.phone && <p className="text-xs text-stone-400">{t.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={available ? 'emerald' : 'default'}>{available ? 'Available' : 'Unavailable'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold ${jobs.active > 0 ? 'bg-cobalt-100 text-cobalt-700' : 'bg-stone-100 text-stone-400'}`}>
                        {jobs.active}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-center text-stone-600">{jobs.completed}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-right">
                      <span className="text-xs text-stone-400">{new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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
