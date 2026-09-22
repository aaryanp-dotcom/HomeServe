'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { Milestone } from '@/types'

interface Payment {
  id: string
  payment_type: string
  amount: number
  status: string
  razorpay_order_id: string
}

interface Props {
  bookingId: string
  milestones: Milestone[]
  payments: Payment[]
}

const MILESTONE_LABELS = ['Project Start (20%)', 'Mid Review (40%)', 'Completion (40%)']

export default function MilestonePanel({ bookingId, milestones, payments }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const triggerMilestonePayment = async (milestoneNumber: number) => {
    setError(null)
    setLoading(milestoneNumber)
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, milestone_number: milestoneNumber }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to trigger milestone')
        return
      }
      // Admin can optionally launch Razorpay to pay on behalf of customer
      // (or the customer will receive a notification to pay themselves)
      // Here we just show success and refresh
      router.refresh()
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(null)
    }
  }

  if (!milestones.length) {
    return (
      <Card>
        <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-stone-500">Milestones will appear here once the booking is confirmed.</p></CardContent>
      </Card>
    )
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Card>
        <CardHeader><CardTitle>Payment Milestones — 20 / 40 / 40</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-rose-700 mb-2">{error}</p>}
          {milestones
            .sort((a, b) => a.milestone_number - b.milestone_number)
            .map((m) => {
              const paymentForMilestone = payments.find(p => p.payment_type === `milestone_${m.milestone_number}`)
              const isPaid = paymentForMilestone?.status === 'captured'
              const canTrigger = m.milestone_number > 1 && m.status === 'pending' && !isPaid

              return (
                <div key={m.id} className={`border p-4 ${isPaid ? 'border-sage-200 bg-sage-50' : m.status === 'completed' ? 'border-cobalt-200 bg-cobalt-50' : 'border-ink-900/15 bg-white'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink-900">
                        Milestone {m.milestone_number}: {MILESTONE_LABELS[m.milestone_number - 1]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink-900">{formatCurrency(m.amount)}</span>
                      <Badge className={isPaid ? 'bg-sage-100 text-sage-800' : m.status === 'completed' ? 'bg-cobalt-100 text-cobalt-800' : 'bg-paper-100 text-stone-600'}>
                        {isPaid ? '✓ Paid' : m.status === 'completed' ? 'Awaiting Payment' : m.status}
                      </Badge>
                    </div>
                  </div>

                  {m.notes && <p className="text-xs text-stone-500 mb-2">{m.notes}</p>}
                  {m.completed_at && (
                    <p className="text-xs text-stone-500">Completed: {new Date(m.completed_at).toLocaleDateString('en-IN')}</p>
                  )}

                  {canTrigger && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-cobalt-600 border-cobalt-300"
                      onClick={() => triggerMilestonePayment(m.milestone_number)}
                      loading={loading === m.milestone_number}
                    >
                      Trigger Payment Request
                    </Button>
                  )}
                </div>
              )
            })}
        </CardContent>
      </Card>
    </>
  )
}
