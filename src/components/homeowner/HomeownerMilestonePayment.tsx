'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { Milestone, Payment } from '@/types'

interface Props {
  bookingId: string
  bookingType: string
  milestones: Milestone[]
  payments: Payment[]
}

const MILESTONE_LABELS = ['Project Start (20%)', 'Mid Review (40%)', 'Completion (40%)']

export default function HomeownerMilestonePayment({ bookingId, bookingType, milestones, payments }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (bookingType !== 'project' || milestones.length === 0) return null

  const payMilestone = async (milestone: Milestone) => {
    setError(null)
    setLoading(milestone.milestone_number)
    try {
      // Create Razorpay order for this milestone
      const res = await fetch('/api/payments/milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, milestone_number: milestone.milestone_number }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to initiate payment')
        return
      }
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency,
        name: 'HomeServe AI',
        description: `Milestone ${milestone.milestone_number} — ${MILESTONE_LABELS[milestone.milestone_number - 1]}`,
        order_id: data.razorpay.order_id,
        handler: async (response) => {
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
        theme: { color: '#2563eb' },
      })
      rzp.open()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="space-y-3">
        <h3 className="font-semibold text-ink-900">Payment Milestones</h3>
        {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 p-3">{error}</p>}
        {milestones
          .sort((a, b) => a.milestone_number - b.milestone_number)
          .map((m) => {
            const paid = payments.find(
              (p) => p.payment_type === `milestone_${m.milestone_number}` && p.status === 'captured'
            )
            const isPayable = m.status === 'completed' && !paid

            return (
              <div
                key={m.id}
                className={`border p-4 ${paid ? 'border-sage-200 bg-sage-50' : isPayable ? 'border-cobalt-200 bg-cobalt-50' : 'border-ink-900/15 bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink-900">
                      Milestone {m.milestone_number}: {MILESTONE_LABELS[m.milestone_number - 1]}
                    </p>
                    {m.notes && <p className="text-xs text-stone-500 mt-0.5">{m.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-ink-900">{formatCurrency(m.amount)}</span>
                    <Badge className={paid ? 'bg-sage-100 text-sage-800' : isPayable ? 'bg-cobalt-100 text-cobalt-800' : 'bg-paper-100 text-stone-600'}>
                      {paid ? '✓ Paid' : isPayable ? 'Pay Now' : m.status === 'pending' ? 'Pending' : m.status}
                    </Badge>
                  </div>
                </div>
                {isPayable && (
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => payMilestone(m)}
                    loading={loading === m.milestone_number}
                  >
                    Pay {formatCurrency(m.amount)} for Milestone {m.milestone_number}
                  </Button>
                )}
              </div>
            )
          })}
      </div>
    </>
  )
}
