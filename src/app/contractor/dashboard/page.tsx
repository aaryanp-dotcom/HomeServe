import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Briefcase, CheckCircle, TrendingUp, ChevronRight, Wrench, Hammer } from 'lucide-react'
import { StatCard, Badge, EmptyState } from '@/components/ui/shared'
import { PageHeader, Panel } from '@/components/ui/layout'
import { formatDate } from '@/lib/utils'
import { getContractorJobs } from '@/lib/contractor/jobs'
import { slotLabel } from '@/lib/maintenance/config'

export const metadata: Metadata = { title: 'Site dashboard' }

export default async function ContractorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [jobs, profileRes] = await Promise.all([
    getContractorJobs(user.id),
    supabase.from('user_profiles').select('full_name').eq('user_id', user.id).single(),
  ])

  const active = jobs.filter((j) => j.phase === 'active')
  const stats = {
    total: jobs.length,
    active: active.length,
    completed: jobs.filter((j) => j.phase === 'done' && (j.status === 'completed')).length,
  }
  const upcoming = active.slice(0, 5)
  const firstName = profileRes.data?.full_name?.split(' ')[0]

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-5 sm:p-8">
      <PageHeader
        eyebrow="Site team"
        title={firstName ? `Hello, ${firstName}` : 'Your jobs'}
        description="Renovation jobs and maintenance visits HomeServe has assigned to you."
        actions={<Link href="/contractor/jobs" className="inline-flex h-10 items-center border-2 border-ink-900 px-4 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-white [@media(pointer:coarse)]:h-11">All jobs</Link>}
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Assigned to you" value={stats.total} icon={<Briefcase size={18} />} />
        <StatCard label="In hand" value={stats.active} icon={<TrendingUp size={18} />} />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle size={18} />} />
      </div>

      <Panel title="Coming up" padded={false}>
        <div className="px-5 pb-1" />
        {upcoming.length === 0 ? (
          <div className="p-5 pt-0">
            <EmptyState icon={<Briefcase size={20} />} title="No jobs in hand" description="When HomeServe assigns you a job it will show up here." />
          </div>
        ) : (
          <ul className="divide-y divide-ink-900/10 border-t border-ink-900/10">
            {upcoming.map((j) => (
              <li key={`${j.kind}-${j.id}`}>
                <Link href={j.href} className="group flex min-h-[3.75rem] items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-paper-50">
                  <span className="min-w-0">
                    <span className={`flex items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-wider ${j.kind === 'maintenance' ? 'text-cobalt-600' : 'text-stone-600'}`}>
                      {j.kind === 'maintenance' ? <Wrench size={11} /> : <Hammer size={11} />}
                      {j.kind === 'maintenance' ? 'Maintenance' : 'Renovation'}
                    </span>
                    <span className="block truncate text-sm font-semibold text-ink-900">{j.title}</span>
                    <span className="block font-mono text-[0.6875rem] uppercase tracking-wider text-stone-600">
                      {j.date ? formatDate(j.date) : 'Date to be set'}{j.timeWindow ? ` · ${slotLabel(j.timeWindow)}` : ''}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <Badge variant={j.statusVariant} dot size="sm">{j.statusLabel}</Badge>
                    <ChevronRight size={16} className="text-stone-500 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
