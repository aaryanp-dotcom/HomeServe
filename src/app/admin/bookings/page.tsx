import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, bookingStatusLabel, bookingStatusColor } from '@/lib/utils'
import { AlertCircle, ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'All Bookings — Admin' }

export default async function AdminBookingsListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/login')

  const { data: bookings } = await adminSupabase
    .from('bookings')
    .select('*, service:services(name, category), homeowner:user_profiles!bookings_homeowner_profile_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const unassigned = (bookings ?? []).filter(b => b.status === 'confirmed' && !b.contractor_id).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">All Bookings</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {(bookings ?? []).length} booking{(bookings ?? []).length !== 1 ? 's' : ''} total
          </p>
        </div>
        {unassigned > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-rose-50 text-rose-700 px-3 py-1.5 border border-rose-200 ">
            <AlertCircle className="h-3.5 w-3.5" />
            {unassigned} unassigned
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
        <table className="min-w-full divide-y divide-stone-100 text-sm">
          <thead>
            <tr className="bg-stone-50 ">
              {['Booking #', 'Customer', 'Service', 'Date', 'Type', 'Amount', 'Status', ''].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left panel-title"
                >
                  {h || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 ">
            {(bookings ?? []).map((b) => (
              <tr key={b.id} className="hover:bg-stone-50 transition-colors group">
                <td className="px-4 py-3.5 font-mono text-xs text-stone-500 ">
                  {b.booking_number}
                </td>
                <td className="px-4 py-3.5 font-medium text-stone-900 ">
                  {(b.homeowner as any)?.full_name ?? '—'}
                </td>
                <td className="px-4 py-3.5 text-stone-600 ">
                  {(b.service as any)?.name ?? '—'}
                </td>
                <td className="px-4 py-3.5 text-stone-500 ">
                  {formatDate(b.scheduled_date)}
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs font-medium text-stone-500 ">
                    {b.booking_type === 'instant' ? '⚡ Instant' : '📋 Project'}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-stone-900 ">
                  {formatCurrency(b.total_amount)}
                </td>
                <td className="px-4 py-3.5">
                  <Badge variant={bookingStatusColor(b.status) as any}>
                    {bookingStatusLabel(b.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="flex items-center gap-1 text-xs font-medium text-sage-700 hover:text-sage-800 "
                  >
                    View
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {(!bookings || bookings.length === 0) && (
              <tr>
                <td colSpan={8} className="text-center py-16 text-stone-400 text-sm">
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
