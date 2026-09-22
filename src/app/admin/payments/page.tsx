import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/shared'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, Clock, XCircle } from 'lucide-react'

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/login')

  const { data: payments } = await adminSupabase
    .from('payments')
    .select(`*, booking:bookings(booking_number, total_amount, homeowner:user_profiles!bookings_homeowner_profile_fkey(full_name))`)
    .order('created_at', { ascending: false })
    .limit(200)

  const list = payments ?? []
  const totalCaptured = list.filter((p) => p.status === 'captured').reduce((sum, p) => sum + p.amount, 0)
  const totalPending  = list.filter((p) => p.status === 'created').reduce((sum, p) => sum + p.amount, 0)
  const totalFailed   = list.filter((p) => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0)

  function statusBadgeVariant(status: string): 'emerald' | 'red' | 'purple' | 'outline' {
    switch (status) {
      case 'captured': return 'emerald'
      case 'failed':   return 'red'
      case 'refunded': return 'purple'
      default:         return 'outline'
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">

      {/* Header */}
      <div>
        <h1 className="page-title">Payments</h1>
        <p className="text-sm text-stone-600 mt-0.5">All payment transactions across the platform.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-3">
        <StatCard label="Total Collected"   value={formatCurrency(totalCaptured)} icon={<TrendingUp size={18} />} positive />
        <StatCard label="Pending / In-flight" value={formatCurrency(totalPending)} icon={<Clock size={18} />} />
        <StatCard label="Failed"            value={formatCurrency(totalFailed)}   icon={<XCircle size={18} />} />
      </div>

      {/* Table */}
      <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
        <table className="min-w-full divide-y divide-[hsl(var(--border))] text-sm">
          <thead>
            <tr className="bg-paper-50 text-xs font-semibold text-stone-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Booking</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Razorpay Order</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
            {list.map((p) => (
              <tr key={p.id} className="hover:bg-paper-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/bookings/${p.booking_id}`} className="text-cobalt-500 hover:text-cobalt-700 hover:underline">
                    {(p.booking as any)?.booking_number ?? p.booking_id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-900">
                  {(p.booking as any)?.homeowner?.[0]?.full_name ?? (p.booking as any)?.homeowner?.full_name ?? '—'}
                </td>
                <td className="px-4 py-3 text-stone-600 capitalize">{p.payment_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 font-semibold text-ink-900">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-3 font-mono text-xs text-stone-500">{p.razorpay_order_id ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadgeVariant(p.status)}>{p.status}</Badge>
                </td>
                <td className="px-4 py-3 text-stone-600 text-xs">{formatDate(p.created_at)}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-stone-500">No payments recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
