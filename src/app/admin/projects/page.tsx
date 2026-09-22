import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ArrowUpRight, FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/shared'

export const metadata: Metadata = { title: 'Projects — Admin' }

const STATUS_CFG: Record<string, { label: string; variant: 'success' | 'warning' | 'accent' | 'default' | 'danger' }> = {
  payment_pending:  { label: 'Awaiting Advance',  variant: 'warning' },
  confirmed:        { label: 'Confirmed',          variant: 'accent' },
  assigned:         { label: 'Team Assigned',      variant: 'accent' },
  in_progress:      { label: 'In Progress',        variant: 'accent' },
  milestone_1_done: { label: 'Milestone 1 Done',   variant: 'accent' },
  milestone_2_done: { label: 'Milestone 2 Done',   variant: 'accent' },
  completed:        { label: 'Completed',          variant: 'success' },
  cancelled:        { label: 'Cancelled',          variant: 'danger' },
}

const ACTIVE_STATUSES = ['payment_pending', 'confirmed', 'assigned', 'in_progress', 'milestone_1_done', 'milestone_2_done']

export default async function AdminProjectsPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')

  // Fetch all renovation-type bookings
  const { data: projects } = await supabase
    .from('bookings')
    .select('id, booking_number, project_title, address, status, total_amount, paid_amount, created_at, homeowner_id')
    .eq('booking_type', 'project')
    .order('created_at', { ascending: false })

  const active    = (projects ?? []).filter(p => ACTIVE_STATUSES.includes(p.status))
  const completed = (projects ?? []).filter(p => p.status === 'completed')
  const cancelled = (projects ?? []).filter(p => p.status === 'cancelled')

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {active.length} active · {completed.length} completed
          </p>
        </div>
      </div>

      {/* Active projects */}
      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Active Projects ({active.length})</h2>
        {active.length === 0 ? (
          <EmptyState label="No active projects" />
        ) : (
          <div className="grid gap-3">
            {active.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </section>

      {/* Completed projects */}
      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Completed ({completed.length})</h2>
        {completed.length === 0 ? (
          <EmptyState label="No completed projects yet" />
        ) : (
          <div className="grid gap-3">
            {completed.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </section>

      {cancelled.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Cancelled ({cancelled.length})</h2>
          <div className="grid gap-3">
            {cancelled.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function ProjectCard({ project }: {
  project: {
    id: string
    booking_number: string
    project_title: string | null
    address: string | null
    status: string
    total_amount: number
    paid_amount: number
    created_at: string
  }
}) {
  const cfg = STATUS_CFG[project.status] ?? { label: project.status, variant: 'default' as const }
  const outstanding = Number(project.total_amount) - Number(project.paid_amount)
  return (
    <Link href={`/admin/projects/${project.id}`}
      className="flex items-center gap-4 p-4 bg-white border border-ink-900/15 hover:border-ink-900/50 hover:border-ink-900 transition-all group"
    >
      <div className="h-10 w-10 bg-stone-100 flex items-center justify-center shrink-0">
        <FolderOpen size={18} className="text-stone-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-900 truncate">
          {project.project_title ?? project.booking_number}
        </p>
        <p className="text-xs text-stone-400 truncate">{project.address ?? '—'}</p>
      </div>
      <div className="shrink-0 hidden sm:flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-stone-800">₹{Number(project.total_amount).toLocaleString('en-IN')}</p>
          {outstanding > 0 && (
            <p className="text-xs text-amber-700">₹{outstanding.toLocaleString('en-IN')} outstanding</p>
          )}
        </div>
        <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
      </div>
      <ArrowUpRight size={14} className="text-stone-500 group-hover:text-cobalt-500 transition-colors shrink-0" />
    </Link>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center p-10 border border-dashed border-stone-200 ">
      <p className="text-sm text-stone-400">{label}</p>
    </div>
  )
}
