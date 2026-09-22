import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Plus, ChevronRight, ClipboardList, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { Badge, Button, EmptyState } from '@/components/ui/shared'

export const metadata: Metadata = { title: 'My Requests' }

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' }> = {
  new:                  { label: 'Received',        variant: 'accent' },
  contacted:            { label: 'In Touch',        variant: 'warning' },
  qualified:            { label: 'Qualified',       variant: 'accent' },
  site_visit_scheduled: { label: 'Visit Scheduled', variant: 'accent' },
  site_visit_completed: { label: 'Visit Done',      variant: 'warning' },
  quote_preparation:    { label: 'Quote Prep',      variant: 'warning' },
  quote_sent:           { label: 'Quote Ready',     variant: 'accent' },
  negotiation:          { label: 'Review',          variant: 'warning' },
  won:                  { label: 'Project Active',  variant: 'success' },
  lost:                 { label: 'Closed',          variant: 'default' },
}

const SCOPE_LABELS: Record<string, string> = {
  full_home: 'Full Home', kitchen: 'Kitchen', bathroom: 'Bathroom',
  living_room: 'Living Room', bedroom: 'Bedroom', painting: 'Painting',
  flooring: 'Flooring', false_ceiling: 'False Ceiling', electrical: 'Electrical',
  plumbing: 'Plumbing', carpentry: 'Carpentry', civil_work: 'Civil Work', other: 'Other',
}

const BUDGET_LABELS: Record<string, string> = {
  under_5L: 'Under ₹5L', '5_10L': '₹5–10L', '10_20L': '₹10–20L',
  '20_30L': '₹20–30L', '30L_plus': '₹30L+', not_sure: 'TBD',
}

// ── Journey progress for the customer ──────────────────────────────────────

const JOURNEY_STEPS = [
  { id: 'new',                  label: 'Request Received' },
  { id: 'contacted',            label: 'Team in Touch' },
  { id: 'site_visit_scheduled', label: 'Site Visit Scheduled' },
  { id: 'site_visit_completed', label: 'Site Visit Done' },
  { id: 'quote_sent',           label: 'Quotation Ready' },
  { id: 'won',                  label: 'Project Started' },
]

const STATUS_ORDER = [
  'new', 'contacted', 'qualified',
  'site_visit_scheduled', 'site_visit_completed',
  'quote_preparation', 'quote_sent', 'negotiation',
  'won',
]

function getJourneyProgress(status: string): number {
  const idx = STATUS_ORDER.indexOf(status)
  return idx === -1 ? 0 : idx
}

function JourneyProgress({ status }: { status: string }) {
  const currentOrder = getJourneyProgress(status)

  return (
    <div className="mt-3">
      <div className="flex items-center gap-0">
        {JOURNEY_STEPS.map((step, i) => {
          const stepOrder = getJourneyProgress(step.id)
          const done = currentOrder > stepOrder
          const active = currentOrder === stepOrder || (i === JOURNEY_STEPS.length - 1 && currentOrder >= stepOrder)
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[0.6875rem] font-bold transition-all ${
                  done ? 'bg-sage-500 border-sage-500 text-white' :
                  active ? 'bg-cobalt-500 border-cobalt-500 text-white' :
                  'bg-white border-stone-200 text-stone-400'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`hidden sm:block text-[0.6875rem] mt-1 text-center leading-tight w-14 ${active ? 'text-cobalt-600 font-semibold' : done ? 'text-sage-700' : 'text-stone-400'}`}>
                  {step.label}
                </span>
              </div>
              {i < JOURNEY_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 transition-all ${done ? 'bg-sage-400' : 'bg-stone-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MyRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/homeowner/requests')

  const { data: requests } = await supabase
    .from('renovation_requests')
    .select('*, quotations(id, status, total_amount, quotation_number)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const list = requests ?? []

  const active = list.filter(r => !['lost', 'won'].includes(r.status)).length
  const projects = list.filter(r => r.status === 'won').length

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">My Renovation Requests</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {list.length === 0
              ? 'No requests submitted yet'
              : `${list.length} request${list.length !== 1 ? 's' : ''} · ${active} active · ${projects} project${projects !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/get-started">
          <Button icon={<Plus size={16} />}>New Request</Button>
        </Link>
      </div>

      {/* Stats */}
      {list.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Requests', value: list.length, icon: <ClipboardList size={16} className="text-cobalt-500" />, bg: 'bg-cobalt-50' },
            { label: 'In Progress', value: active, icon: <TrendingUp size={16} className="text-amber-500" />, bg: 'bg-amber-50' },
            { label: 'Projects', value: projects, icon: <CheckCircle size={16} className="text-sage-500" />, bg: 'bg-sage-50' },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className={`flex items-center gap-3 p-4 ${bg}`}>
              {icon}
              <div>
                <p className="text-xl font-semibold text-stone-900">{value}</p>
                <p className="text-xs text-stone-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {list.length === 0 ? (
        <EmptyState tone="warm"
          icon={<ClipboardList size={24} />}
          title="No renovation requests yet"
          description="Tell us about your renovation needs. Our team will get in touch to schedule a consultation and site visit."
          action={
            <Link href="/get-started">
              <Button icon={<Plus size={14} />}>Start Your Renovation</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {list.map((req) => {
            const cfg = STATUS_CONFIG[req.status] ?? { label: req.status, variant: 'default' as const }
            const scope = (req.scope ?? []) as string[]
            return (
              <div key={req.id} className="p-5 border border-ink-900/15 bg-white hover:border-ink-900/50 hover:border-ink-900 transition-all">

                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-stone-900 text-sm">
                        {scope.length > 0
                          ? scope.slice(0, 2).map(s => SCOPE_LABELS[s] ?? s).join(' + ') + (scope.length > 2 ? ` +${scope.length - 2} more` : '')
                          : 'Renovation Request'}
                      </p>
                      <Badge variant={cfg.variant} dot size="sm">{cfg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <AlertCircle size={11} />
                        {req.city}{req.locality ? `, ${req.locality}` : ''}
                      </span>
                      {req.property_type && <span>{req.property_type}</span>}
                      {req.budget_range && <span>{BUDGET_LABELS[req.budget_range] ?? req.budget_range}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-stone-400">
                      {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Journey progress */}
                {req.status !== 'lost' && <JourneyProgress status={req.status} />}

                {/* Lost */}
                {req.status === 'lost' && (
                  <p className="text-xs text-stone-400 mt-2 italic">This request was closed. Submit a new request if you&apos;d like to proceed.</p>
                )}

                {/* Notes from HomeServe */}
                {req.admin_notes && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                      <Clock size={11} /> Message from HomeServe
                    </p>
                    <p className="text-xs text-amber-800">{req.admin_notes}</p>
                  </div>
                )}

                {/* Quotation CTA — link to the most recent sent/viewed quotation */}
                {(['quote_sent', 'won'].includes(req.status) || req.status === 'quote_preparation') && (() => {
                  const quotes = (req.quotations ?? []) as { id: string; status: string; total_amount: number; quotation_number: string | null }[]
                  const actionable = quotes.find(q => ['sent', 'viewed', 'accepted'].includes(q.status)) ?? quotes[0]
                  if (!actionable) return null
                  return (
                    <div className="mt-3 p-3 bg-cobalt-50 border border-cobalt-100 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-cobalt-700 font-medium">
                          {actionable.status === 'accepted' ? 'Quotation accepted' : 'Your quotation is ready for review'}
                        </p>
                        {actionable.total_amount > 0 && (
                          <p className="text-xs text-cobalt-500 mt-0.5">
                            ₹{Number(actionable.total_amount).toLocaleString('en-IN')} · {actionable.quotation_number ?? ''}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/homeowner/quotations/${actionable.id}`}
                        className="text-xs font-semibold text-cobalt-600 hover:text-cobalt-800 flex items-center gap-1 shrink-0"
                      >
                        {actionable.status === 'accepted' ? 'View' : 'Review & Accept'} <ChevronRight size={11} />
                      </Link>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}

      {/* Info footer */}
      <div className="p-4 border border-ink-900/15 bg-stone-50">
        <p className="panel-title mb-2">How it works</p>
        <div className="space-y-1.5">
          {[
            'Submit your renovation requirement',
            'Our team reviews and contacts you within 24 hours',
            'We schedule a site visit at your convenience',
            'You receive a detailed, transparent quotation',
            'Accept the quote to start your renovation project',
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
