import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, bookingStatusLabel, bookingStatusColor } from '@/lib/utils'
import AssignContractorForm from '@/components/admin/AssignContractorForm'
import MilestonePanel from '@/components/admin/MilestonePanel'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function AdminBookingDetail({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/login')

  const { data: booking } = await adminSupabase
    .from('bookings')
    .select(`*, service:services(*), milestones(*), payments(*)`)
    .eq('id', id)
    .single()

  if (!booking) notFound()
  // bookings.homeowner_id / contractor_id reference auth.users, so the profiles are fetched separately (PostgREST cannot embed them).
  const { data: homeowner } = await adminSupabase.from('user_profiles').select('*').eq('user_id', booking.homeowner_id).maybeSingle()

  const { data: contractors } = await adminSupabase
    .from('contractor_profiles')
    .select('user_id, city, user:user_profiles!contractor_profiles_user_profile_fkey(full_name, phone)')

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/dashboard" className="flex items-center gap-1 text-stone-600 hover:text-ink-900 transition-colors">
          <ChevronLeft size={14} />
          Dashboard
        </Link>
        <span className="text-stone-500">/</span>
        <span className="text-ink-900 font-medium">Booking {booking.booking_number}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{booking.booking_number}</h1>
          <p className="text-sm text-stone-600 mt-0.5">
            {(booking.service as any)?.name} · {booking.booking_type === 'project' ? 'Project (20/40/40)' : 'Instant Service'}
          </p>
        </div>
        <Badge variant={bookingStatusColor(booking.status) as any} size="lg">{bookingStatusLabel(booking.status)}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-stone-500 text-xs mb-1">Name</p><p className="font-medium text-ink-900">{homeowner?.full_name}</p></div>
              <div><p className="text-stone-500 text-xs mb-1">Phone</p><p className="font-medium text-ink-900">{homeowner?.phone ?? '—'}</p></div>
              <div><p className="text-stone-500 text-xs mb-1">Address</p><p className="font-medium text-ink-900">{booking.address}</p></div>
              <div><p className="text-stone-500 text-xs mb-1">Date</p><p className="font-medium text-ink-900">{formatDate(booking.scheduled_date)} at {booking.scheduled_time}</p></div>
              <div className="col-span-2"><p className="text-stone-500 text-xs mb-1">Description</p><p className="font-medium text-ink-900">{booking.description}</p></div>
            </CardContent>
          </Card>
          <AssignContractorForm bookingId={booking.id} currentContractorId={booking.contractor_id} contractors={contractors ?? []} bookingStatus={booking.status} />
          {booking.booking_type === 'project' && (
            <MilestonePanel bookingId={booking.id} milestones={(booking.milestones as any[]) ?? []} payments={(booking.payments as any[]) ?? []} />
          )}
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-stone-600">Total</span><span className="font-bold text-ink-900">{formatCurrency(booking.total_amount)}</span></div>
              <div className="flex justify-between"><span className="text-stone-600">Collected</span><span className="font-bold text-sage-700">{formatCurrency(booking.paid_amount)}</span></div>
              <div className="flex justify-between border-t border-ink-900/10 pt-3">
                <span className="text-stone-600">Outstanding</span>
                <span className="font-bold text-amber-700">{formatCurrency(booking.total_amount - booking.paid_amount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
