import type { Metadata } from 'next'
import Link from 'next/link'
import { adminPage } from '@/lib/maintenance/page-auth'
import { Badge } from '@/components/ui/shared'
import { CATEGORY_LABEL, STATUS_LABEL, type SupportTicket, type TicketStatus } from '@/lib/support/types'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Tickets — Admin' }

const TABS: { key: string; label: string; statuses: TicketStatus[] | null }[] = [
  { key: '',            label: 'All',         statuses: null },
  { key: 'open',        label: 'Open',        statuses: ['open'] },
  { key: 'in_progress', label: 'In progress', statuses: ['in_progress'] },
  { key: 'resolved',    label: 'Resolved',    statuses: ['resolved'] },
  { key: 'closed',      label: 'Closed',      statuses: ['closed'] },
]

const STATUS_VARIANT: Record<TicketStatus, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  open: 'warning', in_progress: 'accent', resolved: 'success', closed: 'default',
}

export default async function AdminTicketsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { supabase } = await adminPage('/admin/tickets')
  const { tab: tabKey } = await searchParams

  const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(300)
  const tickets = (data ?? []) as SupportTicket[]

  const tab = TABS.find((t) => t.key === tabKey) ?? TABS[0]
  const count = (t: (typeof TABS)[number]) => t.statuses ? tickets.filter((x) => t.statuses!.includes(x.status)).length : tickets.length
  const shown = tab.statuses ? tickets.filter((t2) => tab.statuses!.includes(t2.status)) : tickets

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8">
      <div>
        <h1 className="page-title">Support tickets</h1>
        <p className="mt-1 text-sm text-stone-500">From the public contact form and homeowners raising a ticket from their dashboard.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b-2 border-ink-900" role="tablist">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/tickets${t.key ? `?tab=${t.key}` : ''}`} role="tab" aria-selected={t.key === tab.key}
            className={cn('border-2 border-b-0 px-4 py-2 text-sm font-medium', t.key === tab.key ? 'border-ink-900 bg-white text-ink-900' : 'border-transparent text-stone-500 hover:text-ink-900')}>
            {t.label} <span className="font-mono text-xs text-stone-400">{count(t)}</span>
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="border border-ink-900/15 bg-white p-8 text-center text-sm text-stone-500">Nothing here.</p>
      ) : (
        <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="min-w-[680px] w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink-900 bg-paper-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-600">Ticket</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-600">From</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-600 hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-600 hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-600">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/10">
              {shown.map((t) => (
                <tr key={t.id} className="hover:bg-paper-50">
                  <td className="px-4 py-3.5">
                    <p className="font-mono text-xs text-stone-600">{t.ticket_number}</p>
                    <p className="max-w-[220px] truncate font-medium text-ink-900">{t.subject}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="max-w-[150px] truncate text-stone-800">{t.name}{t.user_id && <span className="ml-1.5 text-xs text-cobalt-600">· account</span>}</p>
                    <p className="text-xs text-stone-500">{t.email}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden text-stone-600 md:table-cell">{CATEGORY_LABEL[t.category]}</td>
                  <td className="px-4 py-3.5 hidden text-xs text-stone-500 sm:table-cell">{formatDate(t.created_at)}</td>
                  <td className="px-4 py-3.5"><Badge variant={STATUS_VARIANT[t.status]} dot size="sm">{STATUS_LABEL[t.status]}</Badge></td>
                  <td className="px-4 py-3.5 text-right"><Link href={`/admin/tickets/${t.id}`} className="text-xs font-medium text-cobalt-600 hover:text-cobalt-700">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
