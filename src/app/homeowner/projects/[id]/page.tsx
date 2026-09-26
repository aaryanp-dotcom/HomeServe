import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ArrowLeft, CheckCircle, TrendingUp,
  CreditCard, FileText, ShieldCheck, ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/shared'
import { CircularProgress } from '@/components/ui/CircularProgress'
import type { Milestone, Payment } from '@/types'
import MilestonePaymentPanel from './MilestonePaymentPanel'
import ProjectUpdatesSection from './ProjectUpdatesSection'
import ProjectMessagesSection from './ProjectMessagesSection'
import { MessageFab } from './MessageFab'
import { ProjectCare } from '@/components/maintenance/ProjectCare'

export const metadata: Metadata = { title: 'My Project' }

const BOOKING_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'accent' | 'default' | 'danger' }> = {
  payment_pending: { label: 'Awaiting Advance',   variant: 'warning' },
  confirmed:       { label: 'Confirmed',           variant: 'accent' },
  assigned:        { label: 'Team Assigned',        variant: 'accent' },
  in_progress:     { label: 'In Progress',          variant: 'accent' },
  milestone_1_done:{ label: 'Milestone 1 Done',     variant: 'accent' },
  milestone_2_done:{ label: 'Milestone 2 Done',     variant: 'accent' },
  completed:       { label: 'Completed',            variant: 'success' },
  cancelled:       { label: 'Cancelled',            variant: 'danger' },
}

// Maps booking status to a step index (0-based) in the project timeline
const STATUS_STEP: Record<string, number> = {
  payment_pending:  0,
  confirmed:        1,
  assigned:         2,
  in_progress:      3,
  milestone_1_done: 4,
  milestone_2_done: 5,
  completed:        6,
}

const TIMELINE_STEPS = [
  'Advance Paid',
  'Project Confirmed',
  'Team Assigned',
  'Work in Progress',
  'Milestone 1 Done',
  'Milestone 2 Done',
  'Handover',
]

interface Props { params: Promise<{ id: string }> }

export default async function CustomerProjectPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/homeowner/projects/${id}`)

  const admin = createAdminClient()
  const { data: booking } = await admin
    .from('bookings')
    .select('*, milestones(*), payments(*)')
    .eq('id', id)
    .eq('homeowner_id', user.id)
    .single()

  if (!booking) notFound()

  const milestones = ((booking.milestones as Milestone[]) ?? [])
    .sort((a, b) => a.milestone_number - b.milestone_number)
  const payments = (booking.payments as Payment[]) ?? []

  const outstanding = Number(booking.total_amount) - Number(booking.paid_amount)
  const cfg = BOOKING_STATUS[booking.status] ?? { label: booking.status, variant: 'default' as const }
  const currentStep = STATUS_STEP[booking.status] ?? 0

  // Find advance milestone
  const advanceMilestone = milestones[0]
  const advancePaid = advanceMilestone
    ? payments.some(p => p.payment_type === 'milestone_1' && p.status === 'captured')
    : false

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/homeowner/requests" aria-label="Back" className="inline-flex items-center justify-center coarse:min-h-11 coarse:min-w-11 p-2 hover:bg-stone-100 transition-colors">
            <ArrowLeft size={16} className="text-stone-500" />
          </Link>
          <div>
            <h1 className="page-title">
              {booking.project_title ?? booking.booking_number}
            </h1>
            <p className="text-xs text-stone-400 font-mono mt-0.5">{booking.booking_number}</p>
          </div>
        </div>
        <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
      </div>

      {/* Advance payment CTA — shown until paid */}
      {booking.status === 'payment_pending' && !advancePaid && advanceMilestone && (
        <div className="p-5 bg-amber-50 border border-amber-200 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-900 mb-1">Advance payment required to start</p>
            <p className="text-xs text-amber-700">
              Pay the advance of{' '}
              <span className="font-semibold">₹{Number(advanceMilestone.amount).toLocaleString('en-IN')}</span>{' '}
              to confirm your project and get a start date.
            </p>
          </div>
          <Link
            href={`/homeowner/projects/advance-payment?booking=${id}`}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
          >
            Pay Now <ChevronRight size={13} />
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Main col */}
        <div className="lg:col-span-2 space-y-5">

          {/* Project timeline */}
          <div className="p-5 border border-ink-900/15 bg-white">
            <h2 className="panel-title mb-5">Project Timeline</h2>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-stone-100" />
              <div className="space-y-4">
                {TIMELINE_STEPS.map((label, i) => {
                  const done = i < currentStep
                  const active = i === currentStep
                  return (
                    <div key={label} className="flex items-start gap-4 relative">
                      <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all ${
                        done   ? 'bg-sage-500 border-sage-500 text-white' :
                        active ? 'bg-cobalt-500 border-cobalt-500 text-white' :
                                 'bg-white border-stone-200'
                      }`}>
                        {done
                          ? <CheckCircle size={13} />
                          : active
                          ? <TrendingUp size={12} />
                          : <span className="text-[0.6875rem] font-bold text-stone-400">{i + 1}</span>}
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-sm font-medium ${done ? 'text-sage-700' : active ? 'text-cobalt-700' : 'text-stone-400'}`}>
                          {label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Milestones & payments */}
          <div className="p-5 border border-ink-900/15 bg-white">
            <h2 className="panel-title mb-4">Milestone Payments</h2>
            <MilestonePaymentPanel
              bookingId={id}
              milestones={milestones}
              payments={payments}
              projectTitle={booking.project_title ?? ''}
            />
          </div>

          {/* Progress photos */}
          <ProjectUpdatesSection bookingId={id} />

          {/* Warranty, and (separately) optional upkeep — shown from handover */}
          <ProjectCare booking={{ id, status: booking.status, handover_date: booking.handover_date, warranty_months: booking.warranty_months, warranty_terms: booking.warranty_terms }} />

          {/* Communication */}
          <ProjectMessagesSection bookingId={id} />

          {/* Project details */}
          <div className="p-5 border border-ink-900/15 bg-white">
            <h2 className="panel-title mb-3">Project Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-stone-400">Address</p>
                <p className="font-medium text-stone-800">{booking.address}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Reference</p>
                <p className="font-medium text-stone-800 font-mono text-xs">{booking.booking_number}</p>
              </div>
              {booking.description && (
                <div className="col-span-2">
                  <p className="text-xs text-stone-400">Scope</p>
                  <p className="font-medium text-stone-800">{booking.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Payment summary */}
          <div className="p-5 border border-ink-900/15 bg-white">
            <h2 className="panel-title mb-3">Payments</h2>
            {Number(booking.total_amount) > 0 && (
              <div className="mb-4 flex justify-center">
                <CircularProgress
                  percent={(Number(booking.paid_amount) / Number(booking.total_amount)) * 100}
                  colorClassName={outstanding === 0 ? 'text-sage-500' : 'text-cobalt-500'}
                >
                  <span className="text-lg font-bold text-stone-900">
                    {Math.round((Number(booking.paid_amount) / Number(booking.total_amount)) * 100)}%
                  </span>
                </CircularProgress>
              </div>
            )}
            <div className="space-y-2 text-sm">
              {booking.area_sqft && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Project area</span>
                  <span className="font-medium text-stone-800">{Math.round(Number(booking.area_sqft)).toLocaleString('en-IN')} sq ft</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">Total</span>
                <span className="font-bold text-stone-900">₹{Number(booking.total_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Paid</span>
                <span className="font-semibold text-sage-700">₹{Number(booking.paid_amount).toLocaleString('en-IN')}</span>
              </div>
              {outstanding > 0 && (
                <div className="flex justify-between border-t border-stone-100 pt-2">
                  <span className="text-stone-500">Outstanding</span>
                  <span className="font-semibold text-amber-700">₹{outstanding.toLocaleString('en-IN')}</span>
                </div>
              )}
              {outstanding === 0 && booking.total_amount > 0 && (
                <div className="flex items-center gap-2 mt-2 text-xs text-sage-700 bg-sage-50 border border-sage-100 p-2.5">
                  <CheckCircle size={12} /> Fully paid
                </div>
              )}
            </div>

            {/* Transaction history */}
            {payments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="panel-title mb-2">History</p>
                <div className="space-y-1.5">
                  {payments.filter(p => p.status === 'captured').map(p => (
                    <div key={p.id} className="flex justify-between text-xs">
                      <span className="text-stone-500 capitalize">{p.payment_type.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-stone-700">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="p-4 border border-ink-900/15 bg-stone-50">
            <p className="panel-title mb-3">Links</p>
            <div className="space-y-1.5">
              {[
                { icon: <FileText size={13} />, label: 'View Quotation', href: booking.quotation_id ? `/homeowner/quotations/${booking.quotation_id}` : null },
                { icon: <CreditCard size={13} />, label: 'Payment history', href: '/homeowner/payments' },
                { icon: <ShieldCheck size={13} />, label: 'Warranty & Support', href: '/homeowner/warranty' },
                { icon: <FileText size={13} />, label: 'Home maintenance', href: '/homeowner/maintenance' },
              ].filter(l => l.href).map(({ icon, label, href }) => (
                <Link key={label} href={href!}
                  className="flex items-center gap-2.5 text-xs text-stone-600 hover:text-cobalt-600 transition-colors py-1"
                >
                  {icon} {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Need help */}
          <div className="p-4 border border-ink-900/15 bg-white">
            <p className="panel-title mb-2">Need help?</p>
            <p className="text-xs text-stone-500 mb-3">Contact your HomeServe project manager for any queries.</p>
            <Link
              href="/homeowner/warranty/new"
              className="coarse:min-h-11 block text-center text-xs font-semibold py-2 px-3 border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white transition-colors"
            >
              Raise a Service Request
            </Link>
          </div>
        </div>
      </div>

      <MessageFab />
    </div>
  )
}
