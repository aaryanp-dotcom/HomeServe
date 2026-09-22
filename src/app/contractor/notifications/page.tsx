import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bell, CheckCircle, Clock, Wrench, Hammer } from 'lucide-react'
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

// What each event means to the technician receiving it — same events HomeServe sends, read from
// their side of the job rather than the customer's.
const EVENTS: Record<string, { title: string; message: string; icon: React.ReactNode }> = {
  booking_assigned:          { title: 'New job assigned', message: 'You have been assigned to a renovation job.', icon: <Hammer size={16} /> },
  booking_started:           { title: 'Job started', message: 'Work has been marked as started on one of your jobs.', icon: <Wrench size={16} /> },
  booking_completed:         { title: 'Job completed', message: 'One of your jobs has been marked complete.', icon: <CheckCircle size={16} /> },
  technician_visit_assigned: { title: 'New visit assigned', message: 'You have been assigned a maintenance visit.', icon: <Wrench size={16} /> },
}

function target(n: Row): { href: string; label: string } | null {
  if (n.reference_type === 'maintenance_visit' && n.reference_id) return { href: `/contractor/visits/${n.reference_id}`, label: 'View visit' }
  if (n.booking_id) return { href: `/contractor/jobs/${n.booking_id}`, label: 'View job' }
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

export default async function ContractorNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/contractor/notifications')

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
      <div>
        <h1 className="page-title">Notifications</h1>
        <p className="mt-1 text-sm text-stone-500">{items.length > 0 ? `${items.length} recent update${items.length !== 1 ? 's' : ''}` : 'All caught up'}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState tone="warm" icon={<Bell size={22} />} title="No notifications yet" description="New job and visit assignments will appear here." />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const cfg = EVENTS[n.event] ?? { title: n.event.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()), message: 'There is an update on one of your jobs.', icon: <Bell size={16} /> }
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
