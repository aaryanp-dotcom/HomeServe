import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Plus, ShieldCheck, CheckCircle, Clock } from 'lucide-react'
import { Badge, Button, EmptyState } from '@/components/ui/shared'
import { fmtDate, warrantyStatus } from '@/lib/maintenance/format'
import { WARRANTY_VS_MAINTENANCE } from '@/lib/maintenance/config'

export const metadata: Metadata = { title: 'Warranty & Support' }

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' }> = {
  new:                { label: 'Submitted',       variant: 'accent' },
  under_review:       { label: 'Under Review',    variant: 'warning' },
  site_visit_required:{ label: 'Visit Required',  variant: 'warning' },
  in_progress:        { label: 'In Progress',     variant: 'accent' },
  resolved:           { label: 'Resolved',        variant: 'success' },
  closed:             { label: 'Closed',          variant: 'default' },
}

export default async function WarrantyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/homeowner/warranty')

  const { data: requests } = await supabase
    .from('warranty_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('bookings')
    .select('id, project_title, booking_number, status, handover_date, warranty_months, warranty_terms')
    .eq('homeowner_id', user.id)
    .eq('booking_type', 'project')
    .order('created_at', { ascending: false })

  const list = requests ?? []
  const open = list.filter(r => !['resolved', 'closed'].includes(r.status)).length

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-3xl">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Warranty &amp; Support</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {list.length === 0 ? 'No service requests yet' : `${list.length} request${list.length !== 1 ? 's' : ''} · ${open} open`}
          </p>
        </div>
        <Link href="/homeowner/warranty/new">
          <Button icon={<Plus size={16} />}>Raise Request</Button>
        </Link>
      </div>

      {/* Info card */}
      <div className="panel-warm p-5 bg-cobalt-50 flex gap-4">
        <ShieldCheck size={24} className="text-cobalt-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-cobalt-900 mb-1">Warranty Coverage</p>
          <p className="text-sm text-cobalt-700 leading-relaxed">
            Your completed HomeServe project is covered under our warranty terms. If you notice any issue with the work done, raise a service request and our team will review and resolve it.
          </p>
          <p className="text-xs text-cobalt-500 mt-2">Warranty period and coverage details are specified in your project agreement.</p>
        </div>
      </div>

      {/* Per-project warranty facts (entered by HomeServe at handover) */}
      {(projects ?? []).length > 0 && (
        <div className="space-y-3">
          <p className="panel-title">Your projects</p>
          {(projects ?? []).map((p) => {
            const w = warrantyStatus(p)
            return (
              <Link key={p.id} href={`/homeowner/projects/${p.id}`} className="block p-4 border border-ink-900/15 bg-white hover:border-ink-900/50 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{p.project_title ?? p.booking_number}</p>
                    <p className="text-xs text-stone-500 mt-1">
                      {w.state === 'not_handed_over' && 'Not handed over yet — warranty terms are in your project agreement.'}
                      {w.state === 'terms_in_agreement' && `Handed over ${fmtDate(w.handover)} — warranty terms are in your project agreement.`}
                      {w.state === 'active' && `Handed over ${fmtDate(w.handover)} — warranty active until ${fmtDate(w.ends)}.`}
                      {w.state === 'ended' && `Handed over ${fmtDate(w.handover)} — warranty ended ${fmtDate(w.ends)}.`}
                    </p>
                  </div>
                  <Badge variant={w.state === 'active' ? 'success' : w.state === 'ended' ? 'default' : 'accent'} size="sm" dot>
                    {w.state === 'active' ? 'Active' : w.state === 'ended' ? 'Ended' : w.state === 'not_handed_over' ? 'Pending' : 'See agreement'}
                  </Badge>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Warranty is not maintenance */}
      <div className="panel-warm p-5 bg-paper-50 flex gap-4">
        <div>
          <p className="text-sm font-semibold text-stone-900 mb-1">Looking for repairs or servicing?</p>
          <p className="text-xs text-stone-600 leading-relaxed">{WARRANTY_VS_MAINTENANCE.maintenance} {WARRANTY_VS_MAINTENANCE.membership}</p>
          <Link href="/homeowner/maintenance" className="coarse:min-h-11 inline-block mt-2 text-xs font-semibold text-cobalt-600 hover:text-cobalt-700">Go to home maintenance →</Link>
        </div>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <EmptyState tone="warm"
          icon={<ShieldCheck size={24} />}
          title="No service requests"
          description="Completed a HomeServe project and have an issue to report? Raise a warranty or support request and our team will respond promptly."
          action={
            <Link href="/homeowner/warranty/new">
              <Button icon={<Plus size={14} />}>Raise a Request</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {list.map((req) => {
            const cfg = STATUS_CONFIG[req.status] ?? { label: req.status, variant: 'default' as const }
            return (
              <div key={req.id} className="p-5 border border-ink-900/15 bg-white hover:border-ink-900/50 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-stone-900 text-sm">{req.issue_category ?? 'Service Request'}</p>
                      <Badge variant={cfg.variant} dot size="sm">{cfg.label}</Badge>
                    </div>
                    {req.description && (
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed line-clamp-2">{req.description}</p>
                    )}
                    <p className="text-xs text-stone-400 mt-2">
                      {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {req.status === 'in_progress' && (
                    <div className="flex items-center gap-1 shrink-0 text-xs text-cobalt-600 font-medium">
                      <Clock size={12} /> In Progress
                    </div>
                  )}
                  {req.status === 'resolved' && (
                    <CheckCircle size={16} className="text-sage-500 shrink-0" />
                  )}
                </div>
                {req.resolution_notes && (
                  <div className="mt-3 p-3 bg-sage-50 border border-sage-100">
                    <p className="text-xs font-semibold text-sage-700 mb-1">Resolution</p>
                    <p className="text-xs text-sage-800">{req.resolution_notes}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* How to raise a request */}
      <div className="p-5 border border-ink-900/15 bg-stone-50">
        <p className="panel-title mb-3">How to raise a warranty request</p>
        <div className="space-y-2">
          {[
            'Click "Raise Request" above',
            'Select the issue category',
            'Describe the problem and upload photos if available',
            'Provide your preferred visit time',
            'Our team will review and respond within 24 hours',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
              <span className="h-4 w-4 rounded-full bg-cobalt-100 text-cobalt-600 font-bold flex items-center justify-center shrink-0 text-[0.6875rem] mt-0.5">{i + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
