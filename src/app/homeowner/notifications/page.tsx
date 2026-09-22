import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bell, CheckCircle, Clock, CreditCard, Wrench, AlertCircle, CalendarClock, BadgeCheck, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EmptyState } from '@/components/ui/shared'
import { MarkRead } from './MarkRead'
import { dedupeFeed } from '@/lib/notifications/feed'

export const metadata: Metadata = { title: 'Notifications' }

type Row = {
  id: string; event: string; channel: string; created_at: string; read_at: string | null
  booking_id: string | null; reference_type: string | null; reference_id: string | null
}

// What each event means to the customer. Delivery (email / SMS) is an implementation detail and is not shown.
const EVENTS: Record<string, { title: string; message: string; icon: React.ReactNode }> = {
  booking_created:               { title: 'Booking submitted', message: 'Your booking has been created and is awaiting confirmation.', icon: <Wrench size={16} /> },
  booking_confirmed:             { title: 'Booking confirmed', message: 'Your booking has been confirmed. A HomeServe team member will be assigned shortly.', icon: <CheckCircle size={16} /> },
  booking_assigned:              { title: 'Team member assigned', message: 'A HomeServe team member has been assigned to your booking.', icon: <CheckCircle size={16} /> },
  booking_started:               { title: 'Work has started', message: 'Work on your booking has begun.', icon: <Wrench size={16} /> },
  booking_completed:             { title: 'Work completed', message: 'Your booking has been marked complete.', icon: <CheckCircle size={16} /> },
  booking_cancelled:             { title: 'Booking cancelled', message: 'Your booking has been cancelled.', icon: <AlertCircle size={16} /> },
  milestone_completed:           { title: 'Milestone completed', message: 'A milestone on your project has been completed.', icon: <CheckCircle size={16} /> },
  milestone_payment_due:         { title: 'Milestone payment due', message: 'A milestone is complete and its payment is due.', icon: <CreditCard size={16} /> },
  payment_received:              { title: 'Payment received', message: 'We have received your payment. Thank you.', icon: <CreditCard size={16} /> },
  payment_failed:                { title: 'Payment unsuccessful', message: 'Your payment could not be processed. You can try again.', icon: <AlertCircle size={16} /> },
  maintenance_request_received:  { title: 'Service request received', message: 'We have your request and will confirm it shortly.', icon: <Wrench size={16} /> },
  maintenance_request_confirmed: { title: 'Service request confirmed', message: 'HomeServe has confirmed your request. A visit will be scheduled.', icon: <CheckCircle size={16} /> },
  maintenance_visit_scheduled:   { title: 'Visit scheduled', message: 'A visit has been scheduled for your service request.', icon: <CalendarClock size={16} /> },
  maintenance_completed:         { title: 'Service completed', message: 'The work is done. Please confirm that you are happy with it.', icon: <CheckCircle size={16} /> },
  maintenance_payment_received:  { title: 'Payment received', message: 'We have received your payment for a service request.', icon: <CreditCard size={16} /> },
  membership_purchased:          { title: 'Membership confirmed', message: 'Your HomeServe membership is active.', icon: <BadgeCheck size={16} /> },
  membership_renewal_reminder:   { title: 'Membership ending soon', message: 'Your membership ends soon. You can renew it whenever you wish.', icon: <BadgeCheck size={16} /> },
  membership_expiry_notice:      { title: 'Membership ends this week', message: 'Your membership is about to end.', icon: <BadgeCheck size={16} /> },
  warranty_update:               { title: 'Warranty details updated', message: 'Handover and warranty details for your project have been recorded.', icon: <ShieldCheck size={16} /> },
}

function target(n: Row): { href: string; label: string } | null {
  if (n.reference_type === 'maintenance_request' && n.reference_id) return { href: `/homeowner/maintenance/${n.reference_id}`, label: 'View service request' }
  if (n.reference_type === 'membership') return { href: '/homeowner/membership', label: 'View membership' }
  if (n.reference_type === 'project' && n.reference_id) return { href: `/homeowner/projects/${n.reference_id}`, label: 'View project' }
  if (n.booking_id) return { href: `/homeowner/bookings/${n.booking_id}`, label: 'View booking' }
  return null
}

function relative(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/homeowner/notifications')

  const { data: logs } = await createAdminClient()
    .from('notification_logs')
    .select('id, event, channel, created_at, read_at, booking_id, reference_type, reference_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  const items = dedupeFeed((logs ?? []) as Row[])
  const unread = (logs ?? []).some((n) => !n.read_at)

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-5 sm:p-8">
      <MarkRead hasUnread={unread} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="mt-1 text-sm text-stone-500">{items.length > 0 ? `${items.length} recent update${items.length !== 1 ? 's' : ''}` : 'All caught up'}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState tone="warm" icon={<Bell size={22} />} title="No notifications yet" description="Updates about your projects, service requests, payments and membership will appear here." />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const cfg = EVENTS[n.event] ?? { title: n.event.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()), message: 'There is an update on your account.', icon: <Bell size={16} /> }
            const t = target(n)
            return (
              <li key={n.id} className="flex items-start gap-4 border border-ink-900/15 bg-white p-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-ink-900 text-white">{cfg.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ink-900">{cfg.title}</p>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-stone-400"><Clock size={11} />{relative(n.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-stone-600">{cfg.message}</p>
                  {t && <Link href={t.href} className="coarse:min-h-11 mt-1.5 inline-block text-xs font-medium text-cobalt-600 hover:text-cobalt-700">{t.label} →</Link>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
