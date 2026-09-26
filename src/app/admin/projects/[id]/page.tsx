import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ArrowLeft, CheckCircle, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/shared'
import AdminProjectUpdates from './AdminProjectUpdates'
import AdminProjectMessages from './AdminProjectMessages'
import { AdminWarrantyForm } from '@/components/maintenance/AdminWarrantyForm'

export const metadata: Metadata = { title: 'Project Detail — Admin' }

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

const ALL_STATUSES = [
  'payment_pending','confirmed','assigned','in_progress',
  'milestone_1_done','milestone_2_done','completed','cancelled',
]

const STATUS_STEP: Record<string, number> = {
  payment_pending: 0, confirmed: 1, assigned: 2, in_progress: 3,
  milestone_1_done: 4, milestone_2_done: 5, completed: 6,
}
const TIMELINE_STEPS = [
  'Advance Paid','Project Confirmed','Team Assigned','Work in Progress',
  'Milestone 1 Done','Milestone 2 Done','Handover & Completion',
]

interface Props { params: Promise<{ id: string }> }

export default async function AdminProjectDetailPage({ params }: Props) {
  const { id } = await params

  const cookieStore = await cookies()
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

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, milestones(*), payments(*)')
    .eq('id', id)
    .single()

  if (!booking) notFound()

  const milestones = ((booking.milestones ?? []) as { id: string; milestone_number: number; title: string; amount: number; status: string }[])
    .sort((a, b) => a.milestone_number - b.milestone_number)
  const payments = ((booking.payments ?? []) as { id: string; payment_type: string; amount: number; status: string; created_at: string }[])
  const cfg = STATUS_CFG[booking.status] ?? { label: booking.status, variant: 'default' as const }
  const currentStep = STATUS_STEP[booking.status] ?? 0
  const outstanding = Number(booking.total_amount) - Number(booking.paid_amount)

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/projects"
            aria-label="Back" className="inline-flex items-center justify-center p-2 coarse:min-h-11 coarse:min-w-11 hover:bg-stone-100 transition-colors"
          >
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

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left col */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status update */}
          <div className="p-5 bg-white border border-ink-900/15 ">
            <h2 className="panel-title mb-3">Update Project Status</h2>
            <form action={`/api/bookings/${id}`} method="POST" className="flex items-center gap-3">
              <select name="status" aria-label="Project status" defaultValue={booking.status}
                className="field flex-1"
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_CFG[s]?.label ?? s}</option>
                ))}
              </select>
              {/* This is a quick hint — actual update goes through API */}
              <p className="text-xs text-stone-400">Use the API or project edit for full updates</p>
            </form>
            <AdminProjectStatusUpdater bookingId={id} currentStatus={booking.status} />
          </div>

          {/* Timeline */}
          <div className="p-5 bg-white border border-ink-900/15 ">
            <h2 className="panel-title mb-5">Project Timeline</h2>
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-stone-100" />
              <div className="space-y-4">
                {TIMELINE_STEPS.map((label, i) => {
                  const done   = i < currentStep
                  const active = i === currentStep
                  return (
                    <div key={label} className="flex items-start gap-4 relative">
                      <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
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
                      <p className={`text-sm font-medium pt-0.5 ${done ? 'text-sage-700' : active ? 'text-cobalt-700' : 'text-stone-400'}`}>
                        {label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="p-5 bg-white border border-ink-900/15 ">
            <h2 className="panel-title mb-4">Milestones</h2>
            {milestones.length === 0 ? (
              <p className="text-xs text-stone-400">No milestones defined</p>
            ) : (
              <div className="space-y-2">
                {milestones.map(m => {
                  const paid = payments.some(p => p.payment_type === `milestone_${m.milestone_number}` && p.status === 'captured')
                  return (
                    <div key={m.id} className="flex items-center justify-between text-sm p-3 bg-stone-50 ">
                      <span className="text-stone-700 font-medium">{m.title ?? `Milestone ${m.milestone_number}`}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-stone-600">₹{Number(m.amount).toLocaleString('en-IN')}</span>
                        <Badge variant={paid ? 'success' : 'warning'} dot>{paid ? 'Paid' : 'Pending'}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Progress updates (photos) */}
          <AdminProjectUpdates bookingId={id} />

          {/* Handover & warranty facts */}
          <AdminWarrantyForm bookingId={id} handoverDate={booking.handover_date} warrantyMonths={booking.warranty_months} warrantyTerms={booking.warranty_terms} />

          {/* Messages */}
          <AdminProjectMessages bookingId={id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Financials */}
          <div className="p-5 bg-white border border-ink-900/15 ">
            <h2 className="panel-title mb-3">Financials</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Total</span>
                <span className="font-bold">₹{Number(booking.total_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Paid</span>
                <span className="font-semibold text-sage-700">₹{Number(booking.paid_amount).toLocaleString('en-IN')}</span>
              </div>
              {outstanding > 0 && (
                <div className="flex justify-between pt-2 border-t border-stone-100">
                  <span className="text-stone-500">Outstanding</span>
                  <span className="font-semibold text-amber-700">₹{outstanding.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            {/* Payment history */}
            {payments.filter(p => p.status === 'captured').length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="panel-title mb-2">Received</p>
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

          {/* Project details */}
          <div className="p-4 bg-stone-50 border border-ink-900/15 ">
            <p className="panel-title mb-3">Details</p>
            <div className="space-y-2 text-xs">
              {booking.address && (
                <div>
                  <p className="text-stone-400">Address</p>
                  <p className="font-medium text-stone-700">{booking.address}</p>
                </div>
              )}
              {booking.description && (
                <div>
                  <p className="text-stone-400">Scope</p>
                  <p className="font-medium text-stone-700">{booking.description}</p>
                </div>
              )}
              <div>
                <p className="text-stone-400">Created</p>
                <p className="font-medium text-stone-700">
                  {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="p-4 bg-white border border-ink-900/15 ">
            <p className="panel-title mb-3">Quick Links</p>
            <div className="space-y-1.5 text-xs">
              {booking.quotation_id && (
                <Link href={`/admin/quotations/${booking.quotation_id}`}
                  className="block text-cobalt-600 hover:underline"
                >
                  View Quotation →
                </Link>
              )}
              <Link href="/admin/payments" className="block text-cobalt-600 hover:underline">
                All Payments →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inline status updater component (server action)
async function AdminProjectStatusUpdater({
  bookingId, currentStatus,
}: {
  bookingId: string
  currentStatus: string
}) {
  async function updateStatus(formData: FormData) {
    'use server'
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const status = formData.get('status') as string
    if (!status) return
    const admin = createAdminClient()
    await admin.from('bookings').update({ status }).eq('id', bookingId)
    const { redirect: r } = await import('next/navigation')
    r(`/admin/projects/${bookingId}`)
  }

  const ALL_STATUSES = [
    'payment_pending','confirmed','assigned','in_progress',
    'milestone_1_done','milestone_2_done','completed','cancelled',
  ]
  const STATUS_LABELS: Record<string, string> = {
    payment_pending: 'Awaiting Advance', confirmed: 'Confirmed',
    assigned: 'Team Assigned', in_progress: 'In Progress',
    milestone_1_done: 'Milestone 1 Done', milestone_2_done: 'Milestone 2 Done',
    completed: 'Completed', cancelled: 'Cancelled',
  }

  return (
    <form action={updateStatus} className="flex items-center gap-3 mt-3">
      <select name="status" aria-label="Milestone status" defaultValue={currentStatus}
        className="field flex-1"
      >
        {ALL_STATUSES.map(s => (
          <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
        ))}
      </select>
      <button type="submit"
        className="coarse:min-h-11 px-4 py-2 bg-ink-900 text-white text-xs font-semibold hover:bg-cobalt-600 transition-colors"
      >
        Update
      </button>
    </form>
  )
}
