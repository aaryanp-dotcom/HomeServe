import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EmptyState, StarRating } from '@/components/ui/shared'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'My Reviews' }

interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  subject_type: 'project' | 'maintenance'
  created_at: string
  booking_id: string | null
  maintenance_request_id: string | null
}

/**
 * Reviews are about HomeServe's work on a project or a maintenance service, written by the
 * customer who received it. Nothing is generated; an empty state is shown until they write one.
 */
export default async function HomeownerReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/homeowner/reviews')

  const [{ data: rows }, { data: doneProjects }, { data: doneServices }] = await Promise.all([
    supabase.from('reviews').select('id, rating, comment, subject_type, created_at, booking_id, maintenance_request_id').eq('homeowner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('bookings').select('id, project_title, booking_number, service_category').eq('homeowner_id', user.id).eq('status', 'completed'),
    supabase.from('maintenance_requests').select('id, request_number, service_id').in('status', ['completed', 'customer_confirmed', 'closed']),
  ])
  const reviews = (rows ?? []) as ReviewRow[]

  const admin = createAdminClient()
  const svcIds = Array.from(new Set((doneServices ?? []).map((r) => r.service_id)))
  const { data: svcs } = svcIds.length ? await admin.from('maintenance_services').select('id, name').in('id', svcIds) : { data: [] }
  const svcName = new Map((svcs ?? []).map((s) => [s.id, s.name as string]))

  const reviewedProjects = new Set(reviews.map((r) => r.booking_id).filter(Boolean))
  const reviewedServices = new Set(reviews.map((r) => r.maintenance_request_id).filter(Boolean))
  const pending = [
    ...(doneProjects ?? []).filter((b) => !reviewedProjects.has(b.id)).map((b) => ({ key: b.id, title: b.project_title ?? b.booking_number, href: `/homeowner/bookings/${b.id}`, kind: 'Project' })),
    ...(doneServices ?? []).filter((r) => !reviewedServices.has(r.id)).map((r) => ({ key: r.id, title: svcName.get(r.service_id) ?? r.request_number, href: `/homeowner/maintenance/${r.id}`, kind: 'Service' })),
  ]

  const subject = (r: ReviewRow) => {
    if (r.subject_type === 'maintenance') return { label: 'Maintenance service', href: `/homeowner/maintenance/${r.maintenance_request_id}`, cta: 'View service request' }
    return { label: 'Renovation project', href: `/homeowner/bookings/${r.booking_id}`, cta: 'View project' }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-5 sm:p-8">
      <div>
        <h1 className="page-title">My reviews</h1>
        <p className="mt-1 text-sm text-stone-500">
          {reviews.length > 0 ? `You have reviewed ${reviews.length} job${reviews.length !== 1 ? 's' : ''} with HomeServe.` : 'Tell us how HomeServe did on a completed project or service.'}
        </p>
      </div>

      {pending.length > 0 && (
        <section className="border-2 border-ink-900 bg-white p-5">
          <h2 className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Waiting for your review</h2>
          <ul className="mt-3 divide-y divide-ink-900/10 text-sm">
            {pending.map((p) => (
              <li key={p.key}><Link href={p.href} className="flex items-center justify-between gap-3 py-2.5 hover:text-cobalt-600"><span>{p.title}<span className="ml-2 font-mono text-[0.6875rem] uppercase text-stone-400">{p.kind}</span></span><span className="text-cobalt-600">Review →</span></Link></li>
            ))}
          </ul>
        </section>
      )}

      {reviews.length === 0 ? (
        pending.length === 0 && <EmptyState tone="warm" icon={<Star size={22} />} title="No reviews yet" description="Once a project or service is complete you can rate your experience with HomeServe here." action={<Link href="/homeowner/history" className="coarse:min-h-11 inline-flex items-center text-sm font-medium text-cobalt-600 hover:text-cobalt-700">See your service history →</Link>} />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const s = subject(r)
            return (
              <div key={r.id} className="space-y-3 border border-ink-900/15 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">HomeServe</p>
                    <p className="mt-0.5 text-xs text-stone-500">{s.label}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StarRating rating={r.rating} size="sm" showValue />
                    <span className="text-xs text-stone-400">{formatDate(r.created_at)}</span>
                  </div>
                </div>
                {r.comment && <p className="border-t border-ink-900/10 pt-3 text-sm leading-relaxed text-stone-600">&ldquo;{r.comment}&rdquo;</p>}
                <Link href={s.href} className="coarse:min-h-11 inline-flex items-center text-xs font-medium text-cobalt-600 hover:text-cobalt-700">{s.cta} →</Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
