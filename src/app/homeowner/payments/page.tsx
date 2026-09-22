import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { StatCard, EmptyState } from '@/components/ui/shared'
import { CreditCard, TrendingUp, Clock } from 'lucide-react'

export const metadata: Metadata = { title: 'Payments' }

export default async function HomeownerPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  // Fetch payments by joining through bookings (payments don't have homeowner_id)
  const { data: bookingPayments } = await adminSupabase
    .from('bookings')
    .select('id, booking_number, service_category, scheduled_date, total_amount, paid_amount, payments(*)')
    .eq('homeowner_id', user.id)
    .order('created_at', { ascending: false })

  const allBookings = bookingPayments ?? []
  const allPayments = allBookings.flatMap((b) =>
    ((b.payments as any[]) ?? []).map((p: any) => ({ ...p, booking_number: b.booking_number, service_category: b.service_category }))
  ).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const totalPaid    = allPayments.filter((p: any) => p.status === 'captured').reduce((sum, p: any) => sum + p.amount, 0)
  const totalPending = allPayments.filter((p: any) => p.status === 'created').reduce((sum, p: any) => sum + p.amount, 0)

  function statusVariant(status: string): 'emerald' | 'amber' | 'red' | 'outline' {
    if (status === 'captured') return 'emerald'
    if (status === 'created') return 'amber'
    if (status === 'failed')  return 'red'
    return 'outline'
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="page-title">Payments</h1>
        <p className="text-sm text-stone-600 mt-0.5">Your complete payment history.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3 sm:gap-4">
        <StatCard label="Total Paid"    value={formatCurrency(totalPaid)}    icon={<TrendingUp size={18} />} positive />
        <StatCard label="Pending"       value={formatCurrency(totalPending)} icon={<Clock size={18} />} />
        <StatCard label="Transactions"  value={allPayments.length}           icon={<CreditCard size={18} />} />
      </div>

      {/* Payments list */}
      {allPayments.length === 0 ? (
        <EmptyState tone="warm"
          icon={<CreditCard size={22} />}
          title="No payments yet"
          description="Your payment history will appear here after your first booking."
          action={<Link href="/maintenance" className="coarse:min-h-11 inline-flex items-center text-sm font-medium text-cobalt-500 hover:text-cobalt-600">Book a maintenance service →</Link>}
        />
      ) : (
        <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="min-w-full divide-y divide-[hsl(var(--border))] text-sm">
            <thead>
              <tr className="bg-paper-50 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Booking</th>
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
              {allPayments.map((p: any) => (
                <tr key={p.id} className="hover:bg-paper-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/homeowner/bookings/${p.booking_id}`} className="coarse:min-h-11 inline-flex items-center font-mono text-xs text-cobalt-500 hover:text-cobalt-700 hover:underline">
                      {p.booking_number ?? p.booking_id?.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600 text-xs">{p.service_category ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-600 capitalize text-xs">{p.payment_type?.replace(/_/g, ' ') ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
