import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Mail, Phone, User } from 'lucide-react'
import { adminPage } from '@/lib/maintenance/page-auth'
import { Badge } from '@/components/ui/shared'
import { AdminTicketPanel } from '@/components/support/AdminTicketPanel'
import { STATUS_LABEL, CATEGORY_LABEL, type SupportTicket, type TicketMessage, type TicketStatus } from '@/lib/support/types'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Ticket — Admin' }

const STATUS_VARIANT: Record<TicketStatus, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  open: 'warning', in_progress: 'accent', resolved: 'success', closed: 'default',
}

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await adminPage(`/admin/tickets/${id}`)

  const { data: ticket } = await supabase.from('support_tickets').select('*').eq('id', id).maybeSingle()
  if (!ticket) notFound()
  const t = ticket as SupportTicket

  const { data: msgs } = await supabase.from('support_ticket_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true })
  const messages = (msgs ?? []) as TicketMessage[]

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
      <Link href="/admin/tickets" className="coarse:min-h-11 inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-ink-900"><ChevronLeft size={14} /> Tickets</Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-cobalt-600">{t.ticket_number} · {CATEGORY_LABEL[t.category]} · {t.source === 'contact_form' ? 'Contact form' : 'Dashboard'}</p>
          <h1 className="mt-1 page-title">{t.subject}</h1>
        </div>
        <Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <div className="panel divide-y divide-ink-900/10">
            {messages.map((m) => (
              <div key={m.id} className={`p-4 ${m.sender_role === 'homeserve' ? 'bg-cobalt-50/40' : ''}`}>
                <p className="mb-1 font-mono text-[0.6875rem] uppercase tracking-wider text-stone-600">
                  {m.sender_role === 'homeserve' ? 'HomeServe' : t.name} · {new Date(m.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                </p>
                <p className="whitespace-pre-line text-sm text-ink-900">{m.body}</p>
              </div>
            ))}
          </div>
          <AdminTicketPanel id={t.id} status={t.status} />
        </div>

        <aside className="border-2 border-ink-900 bg-white p-5 text-sm">
          <h2 className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">From</h2>
          <p className="flex items-center gap-1.5 font-semibold text-ink-900"><User size={13} />{t.name}</p>
          <p className="mt-1 flex items-center gap-1.5 text-stone-600"><Mail size={12} />{t.email}</p>
          {t.phone && <p className="mt-1 flex items-center gap-1.5 text-stone-600"><Phone size={12} />{t.phone}</p>}
          {t.user_id && <Link href={`/admin/customers/${t.user_id}`} className="mt-3 inline-block text-xs font-semibold text-cobalt-600 hover:text-cobalt-700">View customer account →</Link>}
          <p className="mt-3 border-t border-ink-900/10 pt-3 text-xs text-stone-500">Raised {formatDate(t.created_at)}</p>
        </aside>
      </div>
    </div>
  )
}
