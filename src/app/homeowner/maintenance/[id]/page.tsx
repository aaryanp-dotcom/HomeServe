import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, CalendarClock, MapPin, BadgeCheck, MessageSquare, Camera, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { RequestStatusBadge, StatusTrack } from '@/components/maintenance/StatusTrack'
import { RequestActions } from '@/components/maintenance/RequestActions'
import { PayButton } from '@/components/maintenance/PayButton'
import { AddPhotos } from '@/components/maintenance/AddPhotos'
import ReviewForm from '@/components/homeowner/ReviewForm'
import { CATEGORY_META, REQUEST_STATUS, slotLabel, type RequestStatus } from '@/lib/maintenance/config'
import { fmtDate, rupees } from '@/lib/maintenance/format'
import type { MaintenanceRequest, RequestEvent, Visit } from '@/lib/maintenance/types'

export const metadata: Metadata = { title: 'Service Request' }

export default async function MaintenanceRequestPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/homeowner/maintenance/${id}`)

  // RLS returns the row only if it is this customer's.
  const { data: reqRow } = await supabase.from('maintenance_requests').select('*').eq('id', id).maybeSingle()
  if (!reqRow) notFound()
  const r = reqRow as MaintenanceRequest
  const status = r.status as RequestStatus

  const admin = createAdminClient()
  const [{ data: ev }, { data: vs }, { data: media }, { data: svc }, { data: review }] = await Promise.all([
    supabase.from('maintenance_request_events').select('*').eq('request_id', r.id).order('created_at', { ascending: false }),
    supabase.from('maintenance_visits').select('*').eq('request_id', r.id).order('scheduled_date', { ascending: false }),
    supabase.from('maintenance_request_media').select('id, storage_path, kind, caption').eq('request_id', r.id).order('created_at'),
    admin.from('maintenance_services').select('name, slug').eq('id', r.service_id).maybeSingle(),
    supabase.from('reviews').select('rating, comment').eq('maintenance_request_id', r.id).eq('homeowner_id', user.id).maybeSingle(),
  ])
  const events = (ev ?? []) as RequestEvent[]
  const visits = (vs ?? []) as Visit[]

  // Short-lived signed URLs for photos the customer is entitled to see.
  const paths = (media ?? []).map((m) => m.storage_path)
  const { data: signed } = paths.length ? await admin.storage.from('maintenance-media').createSignedUrls(paths, 3600) : { data: [] }
  const urlOf = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]))

  const hasCharges = Number(r.visit_fee) + Number(r.labour_charge) + Number(r.materials_cost) > 0
  const payable = r.payment_status === 'pending' && Number(r.amount_due) > 0 && ['completed', 'customer_confirmed', 'closed'].includes(status)
  const customerPhotoCount = (media ?? []).filter((m) => m.kind === 'customer_photo').length
  const canAddPhotos = !['closed', 'cancelled'].includes(status) && customerPhotoCount < 6
  const reviewable = ['completed', 'customer_confirmed', 'closed'].includes(status)

  const row = (k: React.ReactNode, v: React.ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-2 text-sm"><dt className="text-stone-500">{k}</dt><dd className="text-right font-medium text-ink-900">{v}</dd></div>
  )

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-5 sm:p-8">
      <Link href="/homeowner/maintenance" className="coarse:min-h-11 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-ink-900"><ArrowLeft size={14} /> Home maintenance</Link>

      {sp.created && (
        <div className="border-2 border-ink-900 bg-white p-4 text-sm">
          <p className="font-semibold text-ink-900">We have your request.</p>
          <p className="mt-1 text-stone-600">Our team will review it and confirm shortly. You can follow every step here.</p>
          {sp.photos === 'failed' && <p className="mt-2 flex gap-2 text-amber-800"><AlertTriangle size={15} className="mt-0.5 shrink-0" />Your request was saved but the photos could not be uploaded. You can add them below.</p>}
        </div>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-cobalt-600">{r.request_number} · {CATEGORY_META[r.category].label}</p>
          <h1 className="mt-1 page-title">{svc?.name ?? CATEGORY_META[r.category].label}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500"><MapPin size={13} />{r.address_snapshot}</p>
        </div>
        <RequestStatusBadge status={status} />
      </header>

      <section className="space-y-4 border-2 border-ink-900 bg-white p-5">
        <StatusTrack status={status} />
        <p className="text-sm text-stone-600">{REQUEST_STATUS[status].hint}</p>
        {r.completion_summary && <p className="border-l-4 border-sage-500 bg-sage-50 p-3 text-sm text-sage-900"><strong>From our team:</strong> {r.completion_summary}</p>}
        {r.cancellation_reason && status === 'cancelled' && <p className="text-sm text-stone-600">Reason: {r.cancellation_reason}</p>}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <RequestActions id={r.id} status={status} section="confirm" />

          {/* Visits */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60"><CalendarClock size={13} /> Visits</h2>
            {visits.length === 0 ? (
              <p className="border border-ink-900/15 bg-white p-4 text-sm text-stone-500">
                No visit is scheduled yet.{r.preferred_date && <> You asked for {fmtDate(r.preferred_date)} ({slotLabel(r.preferred_slot)}).</>}
              </p>
            ) : (
              <ul className="space-y-2">
                {visits.map((v) => (
                  <li key={v.id} className="flex items-center justify-between border border-ink-900/15 bg-white p-4 text-sm">
                    <span><strong className="text-ink-900">{fmtDate(v.scheduled_date)}</strong> · {slotLabel(v.time_window)}{v.notes && <span className="block text-xs text-stone-500">{v.notes}</span>}</span>
                    <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-stone-500">{v.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Photos */}
          {((media ?? []).length > 0 || canAddPhotos) && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60"><Camera size={13} /> Photos</h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {(media ?? []).map((m) => urlOf.get(m.storage_path) && (
                  <a key={m.id} href={urlOf.get(m.storage_path) ?? undefined} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden border border-ink-900/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlOf.get(m.storage_path) ?? undefined} alt={m.caption ?? m.kind.replace('_', ' ')} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    <span className="absolute bottom-0 left-0 bg-ink-900/80 px-1.5 py-0.5 font-mono text-[0.6875rem] uppercase text-white">{m.kind === 'customer_photo' ? 'You' : m.kind}</span>
                  </a>
                ))}
              </div>
              {canAddPhotos && <div className="mt-3"><AddPhotos requestId={r.id} max={6 - customerPhotoCount} /></div>}
            </section>
          )}

          {/* Timeline + messages */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60"><MessageSquare size={13} /> Updates and messages</h2>
            {(() => {
              const shown = events.filter((e) => e.event_type !== 'charges' || (e.body && e.body !== 'Charges updated'))
              const render = (list: typeof shown) => list.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute -left-[1.6rem] top-1.5 h-2 w-2 bg-ink-900" />
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-stone-400">
                    {e.actor_role === 'customer' ? 'You' : e.actor_role === 'homeserve' ? 'HomeServe' : 'System'} · {new Date(e.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <p className="mt-0.5 text-ink-900">
                    {e.event_type === 'status_change' && e.to_status ? <><strong>{REQUEST_STATUS[e.to_status].customer}.</strong> </> : null}
                    {e.event_type === 'charges' ? 'Charges updated.' : e.body}
                  </p>
                </li>
              ))
              return (
                <>
                  <ol className="space-y-3 border-l-2 border-ink-900/15 pl-5">{render(shown.slice(0, 8))}</ol>
                  {shown.length > 8 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-cobalt-600 hover:text-cobalt-700">Show {shown.length - 8} earlier update{shown.length - 8 === 1 ? '' : 's'}</summary>
                      <ol className="mt-3 space-y-3 border-l-2 border-ink-900/15 pl-5">{render(shown.slice(8))}</ol>
                    </details>
                  )}
                </>
              )
            })()}
          </section>

          <RequestActions id={r.id} status={status} section="rest" />

          {reviewable && (
            <section className="border-2 border-ink-900 bg-white p-5">
              <h2 className="mb-3 font-display text-lg font-bold tracking-[-0.02em] text-ink-900">Rate your experience</h2>
              <ReviewForm maintenanceRequestId={r.id} subjectName={svc?.name ?? 'this service'} existingReview={review as { rating: number; comment: string } | null} />
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="border-2 border-ink-900 bg-white p-5">
            <h2 className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Your request</h2>
            <dl className="mt-2 divide-y divide-ink-900/10">
              {row('Raised', fmtDate(r.created_at))}
              {row('Priority', r.urgency === 'urgent' ? 'Urgent' : 'Routine')}
              {(r.preferred_date || (r.preferred_slot && r.preferred_slot !== 'any')) && row('Preferred', r.preferred_date ? `${fmtDate(r.preferred_date)} · ${slotLabel(r.preferred_slot)}` : slotLabel(r.preferred_slot))}
              {r.team_label && row('HomeServe team', r.team_label)}
            </dl>
            <p className="mt-3 border-t border-ink-900/10 pt-3 text-sm leading-snug text-stone-600">{r.description}</p>
          </div>

          <div className="border-2 border-ink-900 bg-white p-5">
            <h2 className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Charges</h2>
            {!hasCharges ? (
              <p className="mt-2 text-sm text-stone-500">No charges have been added yet. We will tell you the charges before anything beyond the visit proceeds.</p>
            ) : (
              <>
                <dl className="mt-2 divide-y divide-ink-900/10">
                  {Number(r.visit_fee) > 0 && row('Visit fee', rupees(Number(r.visit_fee)))}
                  {Number(r.labour_charge) > 0 && row('Labour', rupees(Number(r.labour_charge)))}
                  {(r.materials ?? []).map((m) => row(`${m.item} × ${m.qty}`, rupees(m.amount)))}
                  {Number(r.membership_discount) > 0 && row(<span className="inline-flex items-center gap-1 text-sage-700"><BadgeCheck size={13} />Membership benefit</span>, `− ${rupees(Number(r.membership_discount))}`)}
                  {Number(r.membership_credit_used) > 0 && row(<span className="inline-flex items-center gap-1 text-sage-700"><BadgeCheck size={13} />Service credit</span>, `− ${rupees(Number(r.membership_credit_used))}`)}
                  <div className="flex items-center justify-between py-3"><dt className="font-semibold text-ink-900">Amount due</dt><dd className="font-display text-xl font-bold text-ink-900">{rupees(Number(r.amount_due))}</dd></div>
                </dl>
                <p className="text-xs text-stone-500">
                  {r.payment_status === 'paid' ? `Paid on ${fmtDate(r.paid_at)}.` : r.payment_status === 'waived' ? 'HomeServe has waived this amount.' : r.payment_status === 'not_required' ? 'Nothing to pay.' : payable ? 'Ready to pay.' : 'You can pay once the work is marked complete.'}
                </p>
                {payable && (
                  <div className="mt-4">
                    <PayButton createUrl={`/api/maintenance/requests/${r.id}/pay`} label={`Pay ${rupees(Number(r.amount_due))}`} description={`Service request ${r.request_number}`} fullWidth />
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
