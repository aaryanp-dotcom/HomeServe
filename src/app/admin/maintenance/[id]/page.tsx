import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Phone, Mail, BadgeCheck, EyeOff } from 'lucide-react'
import { adminPage } from '@/lib/maintenance/page-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { RequestStatusBadge, StatusTrack } from '@/components/maintenance/StatusTrack'
import { AdminRequestPanel } from '@/components/maintenance/AdminRequestPanel'
import { AdminPaymentPanel } from '@/components/maintenance/AdminPaymentPanel'
import { CATEGORY_META, REQUEST_STATUS, slotLabel, type RequestStatus } from '@/lib/maintenance/config'
import { fmtDate, rupees } from '@/lib/maintenance/format'
import type { MaintenanceRequest, RequestEvent, Visit } from '@/lib/maintenance/types'

export const metadata: Metadata = { title: 'Maintenance Request — Admin' }

export default async function AdminRequestPage({ params }: { params: { id: string } }) {
  const { supabase } = await adminPage(`/admin/maintenance/${params.id}`)

  const { data: row } = await supabase.from('maintenance_requests').select('*').eq('id', params.id).maybeSingle()
  if (!row) notFound()
  const r = row as MaintenanceRequest
  const status = r.status as RequestStatus
  const admin = createAdminClient()

  const [{ data: ev }, { data: vs }, { data: media }, { data: svc }, { data: profile }, authUser, { data: staff }, { data: technicians }, { data: history }, { data: usage }, { data: sub }, { data: pays }] = await Promise.all([
    supabase.from('maintenance_request_events').select('*').eq('request_id', r.id).order('created_at', { ascending: false }),
    supabase.from('maintenance_visits').select('*').eq('request_id', r.id).order('scheduled_date', { ascending: false }),
    supabase.from('maintenance_request_media').select('id, storage_path, kind, caption').eq('request_id', r.id).order('created_at'),
    supabase.from('maintenance_services').select('name').eq('id', r.service_id).maybeSingle(),
    admin.from('user_profiles').select('full_name, phone').eq('user_id', r.user_id).maybeSingle(),
    admin.auth.admin.getUserById(r.user_id),
    admin.from('user_profiles').select('user_id, full_name').eq('role', 'admin'),
    admin.from('user_profiles').select('user_id, full_name').eq('role', 'contractor'),
    supabase.from('maintenance_requests').select('id, request_number, status, created_at, category').eq('user_id', r.user_id).neq('id', r.id).order('created_at', { ascending: false }).limit(8),
    supabase.from('subscription_usage').select('usage_type, amount, quantity').eq('request_id', r.id),
    r.subscription_id ? supabase.from('maintenance_subscriptions').select('plan_snapshot, end_date').eq('id', r.subscription_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('maintenance_payments').select('id, amount, status, method, reference, created_at').eq('request_id', r.id).in('status', ['captured', 'refunded']).order('created_at', { ascending: false }),
  ])
  const events = (ev ?? []) as RequestEvent[]
  const visits = (vs ?? []) as Visit[]
  const email = authUser.data?.user?.email

  const paths = (media ?? []).map((m) => m.storage_path)
  const { data: signed } = paths.length ? await admin.storage.from('maintenance-media').createSignedUrls(paths, 3600) : { data: [] }
  const urlOf = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]))

  const benefit = (t: string) => (usage ?? []).filter((u) => u.usage_type === t).reduce((a, u) => a + Number(u.amount), 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
      <Link href="/admin/maintenance" className="coarse:min-h-11 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-ink-900"><ArrowLeft size={14} /> Maintenance</Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-cobalt-600">{r.request_number} · {CATEGORY_META[r.category].label}{r.urgency === 'urgent' && <span className="ml-2 font-semibold text-rose-700">URGENT</span>}</p>
          <h1 className="mt-1 page-title">{svc?.name ?? CATEGORY_META[r.category].label}</h1>
        </div>
        <RequestStatusBadge status={status} audience="admin" />
      </header>

      <section className="border-2 border-ink-900 bg-white p-5"><StatusTrack status={status} /></section>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <AdminRequestPanel
          id={r.id} status={status} paymentStatus={r.payment_status} amountDue={Number(r.amount_due)}
          assignedTo={r.assigned_to} teamLabel={r.team_label}
          staff={(staff ?? []) as { user_id: string; full_name: string }[]}
          technicians={(technicians ?? []) as { user_id: string; full_name: string }[]}
          visits={visits.map((v) => ({ id: v.id, scheduled_date: v.scheduled_date, time_window: v.time_window, status: v.status, technician_id: v.technician_id }))}
          visitFee={Number(r.visit_fee)} labourCharge={Number(r.labour_charge)}
          materials={(r.materials ?? []).map((m) => ({ item: m.item, qty: m.qty, unit_price: m.unit_price }))}
          todayIso={new Date().toISOString().slice(0, 10)}
        />
          <AdminPaymentPanel requestId={r.id} amountDue={Number(r.amount_due)} canRecord={r.payment_status === 'pending' && Number(r.amount_due) > 0 && status !== 'cancelled'}
            payments={(pays ?? []).map((p) => ({ id: p.id, amount: Number(p.amount), status: p.status, method: p.method, reference: p.reference, created_at: p.created_at }))} />
        </div>

        <aside className="space-y-5">
          <div className="border-2 border-ink-900 bg-white p-5 text-sm">
            <h2 className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Customer</h2>
            <Link href={`/admin/customers/${r.user_id}`} className="font-semibold text-ink-900 underline-offset-4 hover:underline">{profile?.full_name ?? 'Customer'}</Link>
            {profile?.phone && <p className="mt-1 flex items-center gap-1.5 text-stone-600"><Phone size={12} />{profile.phone}</p>}
            {email && <p className="mt-1 flex items-center gap-1.5 text-stone-600"><Mail size={12} />{email}</p>}
            <p className="mt-2 flex items-start gap-1.5 text-stone-600"><MapPin size={12} className="mt-1 shrink-0" />{r.address_snapshot}</p>
            <p className="mt-3 border-t border-ink-900/10 pt-3 text-stone-700">{r.description}</p>
            <p className="mt-2 text-xs text-stone-500">Wants: {r.preferred_date ? `${fmtDate(r.preferred_date)} · ` : ''}{slotLabel(r.preferred_slot)}</p>
          </div>

          <div className="border-2 border-ink-900 bg-white p-5 text-sm">
            <h2 className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Membership</h2>
            {sub ? (
              <>
                <p className="flex items-center gap-1.5 font-semibold text-ink-900"><BadgeCheck size={14} className="text-sage-700" />{(sub.plan_snapshot as { name: string }).name} member</p>
                <p className="mt-1 text-xs text-stone-500">Benefits applied here: {rupees(benefit('visit_coverage') + benefit('discount'))} off, {rupees(benefit('credit'))} credit{(usage ?? []).some((u) => u.usage_type === 'visit') ? ', 1 included visit used' : ''}.</p>
              </>
            ) : <p className="text-stone-500">No membership applied. Saving charges re-checks the customer&apos;s membership.</p>}
            <dl className="mt-3 space-y-1 border-t border-ink-900/10 pt-3 text-stone-600">
              <div className="flex justify-between"><dt>Charges total</dt><dd>{rupees(Number(r.visit_fee) + Number(r.labour_charge) + Number(r.materials_cost))}</dd></div>
              <div className="flex justify-between"><dt>Membership discount</dt><dd>− {rupees(Number(r.membership_discount))}</dd></div>
              <div className="flex justify-between"><dt>Credit used</dt><dd>− {rupees(Number(r.membership_credit_used))}</dd></div>
              <div className="flex justify-between font-semibold text-ink-900"><dt>Amount due</dt><dd>{rupees(Number(r.amount_due))}</dd></div>
            </dl>
          </div>

          {(media ?? []).length > 0 && (
            <div className="border-2 border-ink-900 bg-white p-5">
              <h2 className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Photos</h2>
              <div className="grid grid-cols-3 gap-2">
                {(media ?? []).map((m) => urlOf.get(m.storage_path) && (
                  <a key={m.id} href={urlOf.get(m.storage_path) ?? undefined} target="_blank" rel="noreferrer" className="relative block aspect-square overflow-hidden border border-ink-900/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlOf.get(m.storage_path) ?? undefined} alt={m.kind.replace('_', ' ')} className="h-full w-full object-cover" />
                    <span className="absolute bottom-0 left-0 bg-ink-900/80 px-1 font-mono text-[0.6875rem] uppercase text-white">{m.kind === 'customer_photo' ? 'customer' : m.kind}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="border-2 border-ink-900 bg-white p-5 text-sm">
            <h2 className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Customer history</h2>
            {(history ?? []).length === 0 ? <p className="text-stone-500">First request.</p> : (
              <ul className="space-y-1.5">
                {(history ?? []).map((h) => (
                  <li key={h.id}><Link href={`/admin/maintenance/${h.id}`} className="flex justify-between gap-2 hover:underline"><span>{h.request_number} · {CATEGORY_META[h.category as keyof typeof CATEGORY_META]?.short}</span><span className="text-xs text-stone-500">{REQUEST_STATUS[h.status as RequestStatus]?.label}</span></Link></li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <section className="border-2 border-ink-900 bg-white p-5">
        <h2 className="mb-4 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Audit trail</h2>
        <ol className="space-y-3 border-l-2 border-ink-900/15 pl-5 text-sm">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span className={`absolute -left-[1.6rem] top-1.5 h-2 w-2 ${e.visible_to_customer ? 'bg-ink-900' : 'bg-amber-500'}`} />
              <p className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-stone-400">
                {e.actor_role} · {e.event_type.replace('_', ' ')} · {new Date(e.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                {!e.visible_to_customer && <span className="inline-flex items-center gap-1 text-amber-700"><EyeOff size={10} /> internal</span>}
              </p>
              <p className="mt-0.5 text-ink-900">
                {e.from_status && e.to_status ? `${REQUEST_STATUS[e.from_status].label} → ${REQUEST_STATUS[e.to_status].label}. ` : e.to_status ? `→ ${REQUEST_STATUS[e.to_status].label}. ` : ''}{e.body}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
