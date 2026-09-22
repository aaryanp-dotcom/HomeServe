import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/shared'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, bookingStatusLabel, bookingStatusColor } from '@/lib/utils'
import { Plus, CalendarDays, Zap, ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'My Bookings' }

export default async function HomeownerBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: bookings } = await adminSupabase
    .from('bookings')
    .select('*, service:services(name, category)')
    .eq('homeowner_id', user.id)
    .order('created_at', { ascending: false })

  const allBookings = bookings ?? []
  const active = allBookings.filter(b => !['completed', 'cancelled', 'refunded'].includes(b.status))
  const past = allBookings.filter(b => ['completed', 'cancelled', 'refunded'].includes(b.status))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {allBookings.length} booking{allBookings.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/maintenance">
          <Button size="sm" variant="primary" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            New Booking
          </Button>
        </Link>
      </div>

      {allBookings.length === 0 ? (
        <EmptyState tone="warm"
          icon={<CalendarDays className="h-7 w-7 text-stone-400" />}
          title="No bookings yet"
          description="Browse our 22 service categories and book your first home service."
          action={
            <Link href="/maintenance">
              <Button variant="outline">Browse Services</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-3.5 w-3.5 text-sage-500" />
                <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
                  Active ({active.length})
                </h2>
              </div>
              <div className="space-y-3">
                {active.map(b => <BookingCard key={b.id} booking={b} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-3.5 w-3.5 rounded-full bg-stone-300 " />
                <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
                  Past ({past.length})
                </h2>
              </div>
              <div className="space-y-3 opacity-75">
                {past.map(b => <BookingCard key={b.id} booking={b} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking }: { booking: any }) {
  return (
    <Link href={`/homeowner/bookings/${booking.id}`}>
      <Card className="hover:border-ink-900 transition-all duration-200 cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-1.5">
                <span className="font-mono text-xs text-stone-400 ">
                  {booking.booking_number}
                </span>
                <Badge variant={bookingStatusColor(booking.status) as any}>
                  {bookingStatusLabel(booking.status)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {booking.booking_type === 'instant' ? '⚡ Instant' : '📋 Project'}
                </Badge>
              </div>
              <p className="font-semibold text-stone-900 group-hover:text-sage-800 transition-colors">
                {booking.service?.name ?? booking.service_category}
              </p>
              <p className="text-sm text-stone-500 mt-0.5">
                {formatDate(booking.scheduled_date)} at {booking.scheduled_time}
              </p>
              {booking.description && (
                <p className="text-xs text-stone-400 mt-1 truncate">
                  {booking.description}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-stone-900 ">
                {formatCurrency(booking.total_amount)}
              </p>
              {booking.total_amount > booking.paid_amount && (
                <p className="text-xs text-amber-700 mt-0.5">
                  Due: {formatCurrency(booking.total_amount - booking.paid_amount)}
                </p>
              )}
              {booking.paid_amount >= booking.total_amount && booking.total_amount > 0 && (
                <p className="text-xs text-sage-700 mt-0.5">Fully paid</p>
              )}
              <ArrowRight className="h-3.5 w-3.5 text-stone-500 group-hover:text-sage-500 group-hover:translate-x-0.5 transition-all ml-auto mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
