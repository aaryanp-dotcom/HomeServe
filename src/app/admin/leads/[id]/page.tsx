import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ArrowLeft, Phone, Mail, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/shared'
import LeadStatusForm from './LeadStatusForm'
import { SizeSummary } from '@/components/size/SizeSummary'
import MeasurementsForm from './MeasurementsForm'
import type { RoomDetail } from '@/lib/size'

export const metadata: Metadata = { title: 'Lead Detail — Admin' }

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' }> = {
  new:                  { label: 'New',              variant: 'danger' },
  contacted:            { label: 'Contacted',        variant: 'warning' },
  qualified:            { label: 'Qualified',        variant: 'accent' },
  site_visit_scheduled: { label: 'Visit Scheduled', variant: 'accent' },
  site_visit_completed: { label: 'Visit Done',      variant: 'accent' },
  quote_preparation:    { label: 'Quote Prep',      variant: 'warning' },
  quote_sent:           { label: 'Quote Sent',      variant: 'accent' },
  negotiation:          { label: 'Negotiation',     variant: 'warning' },
  won:                  { label: 'Won',             variant: 'success' },
  lost:                 { label: 'Lost',            variant: 'default' },
}

const SCOPE_LABELS: Record<string, string> = {
  full_home: 'Full Home Renovation', kitchen: 'Kitchen', bathroom: 'Bathroom',
  living_room: 'Living Room', bedroom: 'Bedroom', painting: 'Painting',
  flooring: 'Flooring', false_ceiling: 'False Ceiling', electrical: 'Electrical',
  plumbing: 'Plumbing', carpentry: 'Carpentry & Wardrobes', civil_work: 'Civil & Masonry', other: 'Other',
}

const BUDGET_LABELS: Record<string, string> = {
  under_5L: 'Under ₹5 lakh', '5_10L': '₹5–10 lakh', '10_20L': '₹10–20 lakh',
  '20_30L': '₹20–30 lakh', '30L_plus': '₹30 lakh+', not_sure: 'Not sure',
}

const TIMELINE_LABELS: Record<string, string> = {
  immediately: 'Immediately', within_1_month: 'Within 1 month',
  '1_3_months': '1–3 months', '3_6_months': '3–6 months', just_exploring: 'Just exploring',
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')

  const { data: lead } = await supabase
    .from('renovation_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!lead) notFound()

  const { data: siteVisits } = await supabase
    .from('site_visits')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: false })

  const { data: quotations } = await supabase
    .from('quotations')
    .select('id, quotation_number, status, total_amount, created_at')
    .eq('request_id', id)
    .order('created_at', { ascending: false })

  const cfg = STATUS_CONFIG[lead.status] ?? { label: lead.status, variant: 'default' as const }
  const scope = (lead.scope ?? []) as string[]

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/leads" aria-label="Back" className="inline-flex items-center justify-center coarse:min-h-11 coarse:min-w-11 p-2 hover:bg-stone-100 transition-colors">
          <ArrowLeft size={16} className="text-stone-500" />
        </Link>
        <div>
          <h1 className="page-title">{lead.full_name}</h1>
          <p className="text-sm text-stone-500">{lead.request_number ?? lead.id.slice(0, 12)}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Main details */}
        <div className="lg:col-span-2 space-y-4">

          {/* Contact */}
          <div className="p-5 border border-ink-900/15 bg-white space-y-3">
            <h2 className="panel-title">Contact Information</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-cobalt-500" />
                <div>
                  <p className="text-xs text-stone-400">Mobile</p>
                  <p className="text-sm font-medium text-stone-800">{lead.mobile}</p>
                </div>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-cobalt-500" />
                  <div>
                    <p className="text-xs text-stone-400">Email</p>
                    <p className="text-sm font-medium text-stone-800">{lead.email}</p>
                  </div>
                </div>
              )}
              {lead.preferred_contact_time && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-cobalt-500" />
                  <div>
                    <p className="text-xs text-stone-400">Preferred contact time</p>
                    <p className="text-sm font-medium text-stone-800">{lead.preferred_contact_time}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Property */}
          <div className="p-5 border border-ink-900/15 bg-white space-y-3">
            <h2 className="panel-title">Property Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-stone-400">City</p>
                <p className="text-sm font-medium text-stone-800">{lead.city}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Locality</p>
                <p className="text-sm font-medium text-stone-800">{lead.locality}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Property Type</p>
                <p className="text-sm font-medium text-stone-800">{lead.property_type}</p>
              </div>
              {lead.approximate_area && (
                <div>
                  <p className="text-xs text-stone-400">Approximate Area</p>
                  <p className="text-sm font-medium text-stone-800">{lead.approximate_area}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-stone-400">Property Status</p>
                <p className="text-sm font-medium text-stone-800">{lead.is_new_property ? 'New / Under Construction' : 'Existing'}</p>
              </div>
            </div>
          </div>

          {/* Size the customer gave us */}
          <SizeSummary
            title="Size (as told by customer)"
            areaSqft={lead.carpet_area_sqft ? Number(lead.carpet_area_sqft) : null}
            mode={lead.size_input_mode}
            rooms={(lead.rooms_detail ?? []) as RoomDetail[]}
          />
          {lead.estimate_low && lead.estimate_high && (
            <p className="border border-ink-900/15 bg-white px-5 py-3 text-xs text-stone-500">
              Indicative range the customer saw in the estimator:{' '}
              <strong className="text-stone-800">₹{Math.round(Number(lead.estimate_low)).toLocaleString('en-IN')} – ₹{Math.round(Number(lead.estimate_high)).toLocaleString('en-IN')}</strong>
            </p>
          )}

          {/* Scope */}
          <div className="p-5 border border-ink-900/15 bg-white space-y-3">
            <h2 className="panel-title">Scope of Work</h2>
            <div className="flex flex-wrap gap-2">
              {scope.map((s) => (
                <span key={s} className="text-xs bg-cobalt-50 text-cobalt-700 px-2.5 py-1 border border-cobalt-100">
                  {SCOPE_LABELS[s] ?? s}
                </span>
              ))}
            </div>
            {lead.scope_other && <p className="text-sm text-stone-600">{lead.scope_other}</p>}
            {lead.inspiration_theme && (
              <div className="mt-2 pt-2 border-t border-stone-100">
                <p className="text-xs text-stone-400 mb-1">Saved design inspiration</p>
                <p className="text-sm text-stone-700">{lead.inspiration_theme}</p>
              </div>
            )}
            {lead.notes && (
              <div className="mt-2 pt-2 border-t border-stone-100">
                <p className="text-xs text-stone-400 mb-1">Customer notes</p>
                <p className="text-sm text-stone-700">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Budget & Timeline */}
          <div className="p-5 border border-ink-900/15 bg-white">
            <h2 className="panel-title mb-3">Budget &amp; Timeline</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-stone-400">Budget Range</p>
                <p className="text-sm font-medium text-stone-800">
                  {lead.budget_range ? BUDGET_LABELS[lead.budget_range] ?? lead.budget_range : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Timeline</p>
                <p className="text-sm font-medium text-stone-800">
                  {lead.timeline_preference ? TIMELINE_LABELS[lead.timeline_preference] ?? lead.timeline_preference : 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Site Visits */}
          <div className="p-5 border border-ink-900/15 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="panel-title">Site Visits</h2>
              <Link href={`/admin/site-visits/new?request=${id}`} className="coarse:min-h-11 inline-flex items-center text-xs font-medium text-cobalt-500 hover:text-cobalt-700">
                + Schedule visit
              </Link>
            </div>
            {(siteVisits ?? []).length === 0 ? (
              <p className="text-sm text-stone-400">No site visits yet.</p>
            ) : (
              <div className="space-y-2">
                {(siteVisits ?? []).map((v) => (
                  <div key={v.id} className="py-2 border-b border-stone-100 last:border-0">
                   <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-stone-700">
                        {v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}
                        {v.scheduled_time ? ` at ${v.scheduled_time}` : ''}
                      </p>
                      {v.site_notes && <p className="text-xs text-stone-400 mt-0.5">{v.site_notes.slice(0, 80)}…</p>}
                    </div>
                    <Badge variant={v.status === 'completed' ? 'success' : v.status === 'cancelled' ? 'danger' : 'accent'} size="sm">
                      {v.status}
                    </Badge>
                   </div>
                   {v.measured_area_sqft && (
                     <SizeSummary
                       className="mt-3"
                       title="Measured on site"
                       areaSqft={Number(v.measured_area_sqft)}
                       mode={(v.measured_rooms ?? []).length ? 'room_wise' : 'total_area'}
                       rooms={(v.measured_rooms ?? []) as RoomDetail[]}
                       compareTo={lead.carpet_area_sqft ? Number(lead.carpet_area_sqft) : null}
                     />
                   )}
                   {v.status !== 'cancelled' && (
                     <MeasurementsForm
                       visitId={v.id}
                       initialArea={v.measured_area_sqft ? Number(v.measured_area_sqft) : null}
                       initialRooms={v.measured_rooms}
                       statedArea={lead.carpet_area_sqft ? Number(lead.carpet_area_sqft) : null}
                       alreadyCompleted={v.status === 'completed'}
                     />
                   )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quotations */}
          <div className="p-5 border border-ink-900/15 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="panel-title">Quotations</h2>
              <Link href={`/admin/quotations/new?request=${id}`} className="coarse:min-h-11 inline-flex items-center text-xs font-medium text-cobalt-500 hover:text-cobalt-700">
                + New quotation
              </Link>
            </div>
            {(quotations ?? []).length === 0 ? (
              <p className="text-sm text-stone-400">No quotations yet.</p>
            ) : (
              <div className="space-y-2">
                {(quotations ?? []).map((q) => (
                  <Link key={q.id} href={`/admin/quotations/${q.id}`}
                    className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0 hover:text-cobalt-600"
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-700">{q.quotation_number ?? q.id.slice(0, 8)}</p>
                      <p className="text-xs text-stone-400">{new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {q.total_amount && <span className="text-sm font-semibold text-stone-800">₹{q.total_amount.toLocaleString()}</span>}
                      <Badge variant={q.status === 'accepted' ? 'success' : q.status === 'sent' ? 'accent' : 'default'} size="sm">
                        {q.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: status management */}
        <div className="space-y-4">
          <div className="p-5 border border-ink-900/15 bg-white">
            <h2 className="panel-title mb-4">Update Status</h2>
            <LeadStatusForm leadId={id} currentStatus={lead.status} adminNotes={lead.admin_notes ?? ''} />
          </div>

          <div className="p-5 border border-ink-900/15 bg-stone-50 space-y-2">
            <p className="panel-title">Submitted</p>
            <p className="text-sm text-stone-700">
              {new Date(lead.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
