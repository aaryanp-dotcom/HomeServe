import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Badge, EmptyState } from '@/components/ui/shared'
import { PageHeader } from '@/components/ui/layout'
import { formatDate } from '@/lib/utils'
import { getContractorJobs, type ContractorJob } from '@/lib/contractor/jobs'
import { slotLabel } from '@/lib/maintenance/config'
import { Briefcase, ChevronRight, Wrench, Hammer } from 'lucide-react'

export const metadata: Metadata = { title: 'My jobs' }

export default async function ContractorJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/contractor/jobs')

  const jobs = await getContractorJobs(user.id)
  const active = jobs.filter((j) => j.phase === 'active')
  const past = jobs.filter((j) => j.phase === 'done')

  const row = (j: ContractorJob, muted = false) => (
    <li key={`${j.kind}-${j.id}`}>
      <Link href={j.href} className={`group flex min-h-[4.25rem] items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-paper-50 ${muted ? 'opacity-80' : ''}`}>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`inline-flex items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-wider ${j.kind === 'maintenance' ? 'text-cobalt-600' : 'text-stone-600'}`}>
              {j.kind === 'maintenance' ? <Wrench size={11} /> : <Hammer size={11} />}
              {j.kind === 'maintenance' ? 'Maintenance' : 'Renovation'}
            </span>
            <Badge variant={j.statusVariant} size="sm">{j.statusLabel}</Badge>
          </span>
          <span className="mt-1 block truncate font-semibold text-ink-900">{j.title}</span>
          <span className="block text-sm text-stone-600">{j.date ? formatDate(j.date) : 'Date to be set'}{j.timeWindow ? ` · ${slotLabel(j.timeWindow)}` : ''}</span>
          {j.subtitle && <span className="block truncate text-sm text-stone-600">{j.subtitle}</span>}
        </span>
        <ChevronRight size={18} className="shrink-0 text-stone-500 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  )

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-5 sm:p-8">
      <PageHeader eyebrow="Site team" title="My jobs" description={`${active.length} in hand · ${past.length} finished`} />

      <section aria-labelledby="active-h">
        <h2 id="active-h" className="panel-title mb-3">In hand ({active.length})</h2>
        {active.length === 0 ? (
          <EmptyState icon={<Briefcase size={20} />} title="No jobs in hand" description="Jobs HomeServe assigns to you will appear here." />
        ) : (
          <ul className="panel divide-y divide-ink-900/10">{active.map((j) => row(j))}</ul>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-h">
          <h2 id="past-h" className="panel-title mb-3">Finished ({past.length})</h2>
          <ul className="panel divide-y divide-ink-900/10">{past.map((j) => row(j, true))}</ul>
        </section>
      )}
    </div>
  )
}
