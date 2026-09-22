import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatCard, EmptyState } from '@/components/ui/shared'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Users, CalendarDays, MapPin } from 'lucide-react'

export const metadata: Metadata = { title: 'Users — Admin' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/login')

  const { data: users } = await adminSupabase
    .from('user_profiles')
    .select('*, bookings_count:bookings(count)')
    .eq('role', 'homeowner')
    .order('created_at', { ascending: false })

  // Get booking counts per user separately
  const { data: bookingCounts } = await adminSupabase
    .from('bookings')
    .select('homeowner_id')

  const countMap: Record<string, number> = {}
  for (const b of bookingCounts ?? []) {
    countMap[b.homeowner_id] = (countMap[b.homeowner_id] ?? 0) + 1
  }

  const list = users ?? []

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-6">
      <div>
        <h1 className="page-title">Users</h1>
        <p className="text-sm text-stone-600 mt-0.5">All registered homeowners on the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Homeowners" value={list.length} icon={<Users size={18} />} />
        <StatCard label="With Bookings" value={Object.keys(countMap).length} icon={<CalendarDays size={18} />} />
      </div>

      {/* Table */}
      {list.length === 0 ? (
        <EmptyState icon={<Users size={22} />} title="No users yet" description="Registered homeowners will appear here." />
      ) : (
        <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="min-w-full divide-y divide-[hsl(var(--border))] text-sm">
            <thead>
              <tr className="bg-paper-50 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Bookings</th>
                <th className="px-4 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
              {list.map((u) => (
                <tr key={u.id} className="hover:bg-paper-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink-900">{u.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-600 text-xs">{u.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    {u.city ? (
                      <span className="flex items-center gap-1 text-xs text-stone-600">
                        <MapPin size={11} />
                        {u.city}{u.state ? `, ${u.state}` : ''}
                      </span>
                    ) : (
                      <span className="text-stone-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={countMap[u.user_id] ? 'blue' : 'outline'}>
                      {countMap[u.user_id] ?? 0}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
