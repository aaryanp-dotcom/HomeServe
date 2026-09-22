'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { CheckCircle, CreditCard, Clock, AlertCircle } from 'lucide-react'
import type { Milestone, Payment } from '@/types'

interface Props {
  bookingId: string
  milestones: Milestone[]
  payments: Payment[]
  projectTitle: string
}

export default function MilestonePaymentPanel({ bookingId, milestones, payments, projectTitle }: Props) {
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)
  const [paying, setPaying] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function payMilestone(m: Milestone) {
    if (!loaded) { setError('Payment gateway loading, please wait'); return }
    setPaying(m.milestone_number)
    setError('')
    try {
      const res = await fetch('/api/payments/milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, milestone_number: m.milestone_number }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create payment order')

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency,
        name: 'HomeServe',
        description: `${m.title ?? `Milestone ${m.milestone_number}`} — ${projectTitle}`,
        order_id: data.razorpay.order_id,
        handler: async (response: Record<string, string>) => {
          const verifyRes = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          const result = await verifyRes.json()
          if (result.success) {
            router.refresh()
          } else {
            setError('Payment verification failed. Please contact support.')
          }
        },
        theme: { color: '#1d4ed8' },
        modal: { ondismiss: () => setPaying(null) },
      })
      rzp.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setPaying(null)
    }
  }

  if (milestones.length === 0) {
    return <p className="text-sm text-stone-400">No milestones found.</p>
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setLoaded(true)} />

      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 text-sm text-rose-700 mb-3">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        {milestones.map(m => {
          const paid = payments.some(
            p => p.payment_type === `milestone_${m.milestone_number}` && p.status === 'captured',
          )
          const isPayable = m.status === 'completed' && !paid
          const isPending = m.status === 'pending' && !paid

          return (
            <div key={m.id} className={`border p-4 transition-all ${
              paid      ? 'bg-sage-50 border-sage-200' :
              isPayable ? 'bg-cobalt-50 border-cobalt-200' :
                          'bg-stone-50 border-ink-900/15'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    paid      ? 'bg-sage-500 text-white' :
                    isPayable ? 'bg-cobalt-500 text-white' :
                                'bg-stone-200 text-stone-400'
                  }`}>
                    {paid
                      ? <CheckCircle size={13} />
                      : isPayable
                      ? <CreditCard size={12} />
                      : <Clock size={12} />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${paid ? 'text-sage-800' : isPayable ? 'text-cobalt-800' : 'text-stone-600'}`}>
                      {m.title ?? `Milestone ${m.milestone_number}`}
                    </p>
                    {m.notes && <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{m.notes}</p>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${paid ? 'text-sage-700' : isPayable ? 'text-cobalt-700' : 'text-stone-500'}`}>
                    ₹{Number(m.amount).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-stone-400">{m.percentage}%</p>
                </div>
              </div>

              {isPayable && (
                <button
                  onClick={() => payMilestone(m)}
                  disabled={paying === m.milestone_number}
                  className="coarse:min-h-11 mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 disabled:opacity-60 transition-colors"
                >
                  <CreditCard size={14} />
                  {paying === m.milestone_number
                    ? 'Opening payment…'
                    : `Pay ₹${Number(m.amount).toLocaleString('en-IN')}`}
                </button>
              )}

              {isPending && (
                <p className="mt-2 text-xs text-stone-400 italic">
                  This milestone will become payable after the work stage is marked complete by our team.
                </p>
              )}

              {paid && (
                <p className="mt-2 text-xs text-sage-700 font-medium">✓ Payment received</p>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
