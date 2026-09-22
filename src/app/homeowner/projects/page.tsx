import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Plus, ChevronRight, Hammer, TrendingUp, CheckCircle } from 'lucide-react'
import { Badge, Button, EmptyState } from '@/components/ui/shared'

export const metadata: Metadata = { title: 'My Projects' }

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'accent' | 'default' | 'danger' }> = {
  payment_pending:  { label: 'Awaiting Advance',  variant: 'warning' },
  confirmed:        { label: 'Confirmed',          variant: 'accent' },
  assigned:         { label: 'Team Assigned',      variant: 'accent' },
  in_progress:      { label: 'In Progress',        variant: 'accent' },
  milestone_1_done: { label: 'Milestone 1 Done',   variant: 'accent' },
  milestone_2_done: { label: 'Milestone 2 Done',   variant: 'accent' },
  completed:        { label: 'Completed',          variant: 'success' },
  cancelled:        { label: 'Cancelled',          variant: 'danger' },
}

export default async function HomeownerProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/homeowner/projects')

  const admin = createAdminClient()
  const { data: bookings } = await admin
    .from('bookings')
    .select('id, booking_number, project_title, status, total_amount, paid_amount, created_at, address, quotation_id')
    .eq('homeowner_id', user.id)
    .eq('booking_type', 'project')
    .order('created_at', { ascending: false })

  const list = bookings ?? []
  const active = list.filter(b => !['completed', 'cancelled'].includes(b.status)).length

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">My Projects</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {list.length === 0
              ? 'No projects yet'
              : `${list.length} project${list.length !== 1 ? 's' : ''} · ${active} active`}
          </p>
        </div>
        <Link href="/get-started">
          <Button icon={<Plus size={16} />}>New Request</Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <EmptyState tone="warm"
          icon={<Hammer size={24} />}
          title="No projects yet"
          description="Once you accept a quotation, your project will appear here with milestones, payment tracking and progress updates."
          action={
            <Link href="/homeowner/requests">
              <Button size="sm">View My Requests</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {list.map(b => {
            const cfg = STATUS_CONFIG[b.status] ?? { label: b.status, variant: 'default' as const }
            const outstanding = Number(b.total_amount) - Number(b.paid_amount)
            return (
              <Link
                key={b.id}
                href={`/homeowner/projects/${b.id}`}
                className="flex items-center justify-between gap-4 p-5 border border-ink-900/15 bg-white hover:border-ink-900/50 hover:border-ink-900 transition-all group"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="h-10 w-10 bg-cobalt-50 flex items-center justify-center shrink-0">
                    {b.status === 'completed'
                      ? <CheckCircle size={18} className="text-sage-500" />
                      : <TrendingUp size={18} className="text-cobalt-500" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {b.project_title ?? b.booking_number}
                      </p>
                      <Badge variant={cfg.variant} dot size="sm">{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-stone-400 truncate">{b.address}</p>
                    <p className="text-xs text-stone-400 mt-0.5 font-mono">{b.booking_number}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-4">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">₹{Number(b.total_amount).toLocaleString('en-IN')}</p>
                    {outstanding > 0
                      ? <p className="text-xs text-amber-700">₹{outstanding.toLocaleString('en-IN')} due</p>
                      : <p className="text-xs text-sage-700">Fully paid</p>}
                  </div>
                  <ChevronRight size={15} className="text-stone-500 group-hover:text-stone-500 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
