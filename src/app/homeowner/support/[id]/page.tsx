import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ChevronLeft, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/shared'
import { PageHeader } from '@/components/ui/layout'
import { TicketReplyBox } from '@/components/support/TicketReplyBox'
import { STATUS_LABEL, CATEGORY_LABEL, type SupportTicket, type TicketMessage, type TicketStatus } from '@/lib/support/types'

export const metadata: Metadata = { title: 'Support ticket' }

const STATUS_VARIANT: Record<TicketStatus, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  open: 'warning', in_progress: 'accent', resolved: 'success', closed: 'default',
}

export default async function TicketDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params
  const { new: justCreated } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/homeowner/support/${id}`)

  const { data: ticket } = await supabase.from('support_tickets').select('*').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!ticket) notFound()
  const t = ticket as SupportTicket

  const { data: msgs } = await supabase.from('support_ticket_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true })
  const messages = (msgs ?? []) as TicketMessage[]

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-5 sm:p-8">
      <Link href="/homeowner/support" className="coarse:min-h-11 inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-ink-900"><ChevronLeft size={14} /> My tickets</Link>

      <PageHeader eyebrow={`${t.ticket_number} · ${CATEGORY_LABEL[t.category]}`} title={t.subject} actions={<Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>} />

      {justCreated && (
        <p role="status" className="flex items-center gap-2 border border-sage-500/40 bg-sage-50 p-3 text-sm text-sage-900"><CheckCircle size={15} />Sent — we&apos;ll reply here and by email.</p>
      )}

      <div className="panel divide-y divide-ink-900/10">
        {messages.map((m) => (
          <div key={m.id} className={`p-4 ${m.sender_role === 'homeserve' ? 'bg-cobalt-50/40' : ''}`}>
            <p className="mb-1 font-mono text-[0.6875rem] uppercase tracking-wider text-stone-600">
              {m.sender_role === 'homeserve' ? 'HomeServe' : 'You'} · {new Date(m.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            </p>
            <p className="whitespace-pre-line text-sm text-ink-900">{m.body}</p>
          </div>
        ))}
      </div>

      {t.status !== 'closed' ? (
        <TicketReplyBox ticketId={t.id} />
      ) : (
        <p className="text-sm text-stone-600">This ticket is closed. Raise a new one if you need anything else.</p>
      )}
    </div>
  )
}
