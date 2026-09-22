import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import type { Milestone } from '@/types'
import AdvancePaymentButton from './AdvancePaymentButton'

export const metadata: Metadata = { title: 'Advance Payment' }

interface Props {
  searchParams: Promise<{ booking: string }>
}

export default async function AdvancePaymentPage({ searchParams }: Props) {
  const { booking: bookingId } = await searchParams
  if (!bookingId) redirect('/homeowner/requests')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/homeowner/projects/advance-payment?booking=${bookingId}`)

  const admin = createAdminClient()
  const { data: booking } = await admin
    .from('bookings')
    .select('*, milestones(*)')
    .eq('id', bookingId)
    .eq('homeowner_id', user.id)
    .single()

  if (!booking) notFound()

  const milestones = ((booking.milestones as Milestone[]) ?? [])
    .sort((a, b) => a.milestone_number - b.milestone_number)

  const advance = milestones[0]

  // Already paid — redirect straight to project
  if (booking.paid_amount >= (advance?.amount ?? 0) && booking.paid_amount > 0) {
    redirect(`/homeowner/projects/${bookingId}`)
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl space-y-6">

      <div className="flex items-center gap-3">
        <Link href="/homeowner/requests" aria-label="Back" className="inline-flex items-center justify-center coarse:min-h-11 coarse:min-w-11 p-2 hover:bg-stone-100 transition-colors">
          <ArrowLeft size={16} className="text-stone-500" />
        </Link>
        <div>
          <h1 className="page-title">Advance Payment</h1>
          <p className="text-sm text-stone-500">{booking.project_title ?? booking.booking_number}</p>
        </div>
      </div>

      {/* Project summary */}
      <div className="p-5 border border-ink-900/15 bg-white space-y-3">
        <p className="panel-title">Project Summary</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-stone-400">Project</p>
            <p className="font-medium text-stone-800">{booking.project_title ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Total Amount</p>
            <p className="font-medium text-stone-800">₹{Number(booking.total_amount).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Address</p>
            <p className="font-medium text-stone-800 truncate">{booking.address}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Reference</p>
            <p className="font-medium text-stone-800 font-mono text-xs">{booking.booking_number}</p>
          </div>
        </div>
      </div>

      {/* Payment schedule */}
      <div className="p-5 border border-ink-900/15 bg-white">
        <p className="panel-title mb-3">Payment Schedule</p>
        <div className="space-y-2">
          {milestones.map((m, idx) => {
            const isPaid = booking.paid_amount >= m.amount && idx === 0 && booking.paid_amount > 0
            const isNext = idx === 0 && !isPaid
            return (
              <div key={m.id} className={`flex items-center justify-between p-3 border ${
                isPaid ? 'bg-sage-50 border-sage-200' :
                isNext ? 'bg-cobalt-50 border-cobalt-200' :
                'bg-stone-50 border-stone-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isPaid ? 'bg-sage-500 text-white' :
                    isNext ? 'bg-cobalt-500 text-white' :
                    'bg-stone-200 text-stone-500'
                  }`}>
                    {isPaid ? '✓' : m.milestone_number}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isNext ? 'text-cobalt-800' : 'text-stone-700'}`}>{m.title}</p>
                    {m.notes && <p className="text-xs text-stone-400 mt-0.5">{m.notes}</p>}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`text-sm font-semibold ${isPaid ? 'text-sage-700' : isNext ? 'text-cobalt-700' : 'text-stone-500'}`}>
                    ₹{Number(m.amount).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-stone-400">{m.percentage}%</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pay now */}
      {advance && (
        <div className="p-5 border border-cobalt-200 bg-cobalt-50">
          <p className="text-sm font-semibold text-cobalt-900 mb-1">Pay advance to start your project</p>
          <p className="text-xs text-cobalt-700 mb-4">
            Once the advance is received, our team will confirm the project start date and assign a site supervisor.
          </p>
          <AdvancePaymentButton
            bookingId={bookingId}
            milestoneNumber={advance.milestone_number}
            amount={advance.amount}
            label={advance.title ?? 'Advance Payment'}
            projectTitle={booking.project_title ?? ''}
          />
        </div>
      )}

      {/* What happens next */}
      <div className="p-4 border border-ink-900/15 bg-stone-50">
        <p className="panel-title mb-3">What happens next</p>
        <div className="space-y-2">
          {[
            'Advance payment confirms the project',
            'Our team contacts you to confirm the start date',
            'A site supervisor is assigned to your project',
            'Work begins as per the agreed schedule',
            'You receive progress updates throughout',
            'Remaining payments are due at agreed milestones',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
              <CheckCircle size={12} className="text-sage-500 shrink-0 mt-0.5" />
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
