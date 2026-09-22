import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LifeBuoy, Plus, ChevronRight } from 'lucide-react'
import { Badge, Button, EmptyState } from '@/components/ui/shared'
import { PageHeader } from '@/components/ui/layout'
import { STATUS_LABEL, CATEGORY_LABEL, type SupportTicket, type TicketStatus } from '@/lib/support/types'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Support' }

const STATUS_VARIANT: Record<TicketStatus, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  open: 'warning', in_progress: 'accent', resolved: 'success', closed: 'default',
}

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/homeowner/support')

  const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false })
  const tickets = (data ?? []) as SupportTicket[]

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-5 sm:p-8">
      <PageHeader
        eyebrow="Support"
        title="My tickets"
        description="Raise a ticket for anything that doesn't fit a project or a maintenance request — billing questions, account issues, general help."
        actions={<Link href="/homeowner/support/new"><Button icon={<Plus size={16} />}>Raise a ticket</Button></Link>}
      />

      {tickets.length === 0 ? (
        <EmptyState tone="warm" icon={<LifeBuoy size={22} />} title="No tickets yet"
          description="Something not working, or a question about your account or a payment? Raise a ticket and we'll get back to you."
          action={<Link href="/homeowner/support/new"><Button size="sm" icon={<Plus size={14} />}>Raise a ticket</Button></Link>} />
      ) : (
        <ul className="panel divide-y divide-ink-900/10">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link href={`/homeowner/support/${t.id}`} className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-paper-50">
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-stone-600">{t.ticket_number}</span>
                    <span className="text-xs text-stone-500">{CATEGORY_LABEL[t.category]}</span>
                  </span>
                  <span className="mt-1 block truncate font-semibold text-ink-900">{t.subject}</span>
                  <span className="block text-sm text-stone-600">{formatDate(t.created_at)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <Badge variant={STATUS_VARIANT[t.status]} dot size="sm">{STATUS_LABEL[t.status]}</Badge>
                  <ChevronRight size={16} className="text-stone-500 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
