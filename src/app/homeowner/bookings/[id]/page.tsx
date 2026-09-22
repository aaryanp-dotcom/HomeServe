import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/shared'
import { formatCurrency, formatDate, bookingStatusLabel, bookingStatusColor } from '@/lib/utils'
import HomeownerMilestonePayment from '@/components/homeowner/HomeownerMilestonePayment'
import ReviewForm from '@/components/homeowner/ReviewForm'
import type { Milestone, Payment } from '@/types'
import { ChevronLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Booking Detail' }
interface Props { params: Promise<{ id: string }> }

export default async function HomeownerBookingDetail({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: booking } = await adminSupabase
    .from('bookings')
    .select('*, service:services(*), milestones(*), payments(*)')
    .eq('id', id)
    .eq('homeowner_id', user.id)
    .single()

  if (!booking) notFound()

  // bookings.contractor_id points at auth.users, so PostgREST cannot embed the profile; look it up directly.
  const { data: assigned } = booking.contractor_id
    ? await adminSupabase.from('user_profiles').select('full_name, phone').eq('user_id', booking.contractor_id).maybeSingle()
    : { data: null }

  const { data: review } = await adminSupabase
    .from('reviews')
    .select('rating, comment')
    .eq('booking_id', id)
    .eq('homeowner_id', user.id)
    .single()

  const milestones = (booking.milestones as Milestone[]) ?? []
  const payments   = (booking.payments as Payment[]) ?? []
  const outstanding = booking.total_amount - booking.paid_amount
  const contractor  = assigned as { full_name?: string; phone?: string | null } | null

  return (
    <div className="p-6 lg:p-8 max-w-4xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/homeowner/bookings" className="flex items-center gap-1 text-stone-600 hover:text-ink-900 transition-colors">
          <ChevronLeft size={14} />
          My Bookings
        </Link>
        <span className="text-stone-500">/</span>
        <span className="text-ink-900 font-medium">{booking.booking_number}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="page-title">{booking.booking_number}</h1>
          <p className="text-sm text-stone-600 mt-0.5">
            {(booking.service as any)?.name} · {booking.booking_type === 'project' ? 'Project (20/40/40)' : 'Instant Service'}
          </p>
        </div>
        <Badge variant={bookingStatusColor(booking.status) as any} size="lg" className="flex-shrink-0">
          {bookingStatusLabel(booking.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* Service Details */}
          <Card>
            <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-stone-500 text-xs mb-1">Service</p><p className="font-medium text-ink-900">{(booking.service as any)?.name}</p></div>
              <div><p className="text-stone-500 text-xs mb-1">Category</p><p className="font-medium text-ink-900">{booking.service_category}</p></div>
              <div><p className="text-stone-500 text-xs mb-1">Date</p><p className="font-medium text-ink-900">{formatDate(booking.scheduled_date)}</p></div>
              <div><p className="text-stone-500 text-xs mb-1">Time</p><p className="font-medium text-ink-900">{booking.scheduled_time}</p></div>
              <div className="col-span-2"><p className="text-stone-500 text-xs mb-1">Address</p><p className="font-medium text-ink-900">{booking.address}, {booking.city}</p></div>
              {booking.description && (
                <div className="col-span-2"><p className="text-stone-500 text-xs mb-1">Your Request</p><p className="font-medium text-ink-900">{booking.description}</p></div>
              )}
            </CardContent>
          </Card>

          {/* Assigned HomeServe team member */}
          {contractor ? (
            <Card>
              <CardHeader><CardTitle>Your HomeServe team</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-4">
                <Avatar name={contractor.full_name ?? 'C'} size="lg" />
                <div className="flex-1">
                  <p className="font-semibold text-ink-900">{contractor.full_name}</p>
                  <p className="text-sm text-stone-600">{contractor.phone ?? '—'}</p>
                </div>
                <Badge variant="emerald">✓ Verified</Badge>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-3xl mb-3">⏳</p>
                <p className="text-sm font-medium text-ink-900">Assigning our team</p>
                <p className="text-xs text-stone-600 mt-1">We&apos;ll let you know as soon as a team member is assigned.</p>
              </CardContent>
            </Card>
          )}

          {/* Milestone payments */}
          {booking.booking_type === 'project' && (
            <Card>
              <CardHeader><CardTitle>Milestone Payments</CardTitle></CardHeader>
              <CardContent>
                <HomeownerMilestonePayment
                  bookingId={booking.id}
                  bookingType={booking.booking_type}
                  milestones={milestones}
                  payments={payments}
                />
              </CardContent>
            </Card>
          )}

          {/* Review */}
          {booking.status === 'completed' && (
            <Card>
              <CardHeader><CardTitle>Rate Your Experience</CardTitle></CardHeader>
              <CardContent>
                <ReviewForm
                  bookingId={booking.id}
                  subjectName={(booking.service as any)?.name ?? booking.service_category ?? 'your project'}
                  existingReview={review}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Total</span>
                <span className="font-bold text-ink-900">{formatCurrency(booking.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Paid</span>
                <span className="font-bold text-sage-700">{formatCurrency(booking.paid_amount)}</span>
              </div>
              {outstanding > 0 && (
                <div className="flex justify-between border-t border-ink-900/10 pt-3">
                  <span className="text-stone-600">Outstanding</span>
                  <span className="font-bold text-amber-700">{formatCurrency(outstanding)}</span>
                </div>
              )}
              {outstanding === 0 && (
                <div className="bg-sage-50 border border-sage-200 p-2 text-center text-xs text-sage-700 font-medium">
                  ✓ Fully Paid
                </div>
              )}
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-xs">
                    <span className="text-stone-600 capitalize">{p.payment_type.replace(/_/g, ' ')}</span>
                    <div className="text-right">
                      <span className="font-medium text-ink-900">{formatCurrency(p.amount)}</span>
                      <Badge
                        variant={p.status === 'captured' ? 'emerald' : 'outline'}
                        size="sm"
                        className="ml-2"
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
