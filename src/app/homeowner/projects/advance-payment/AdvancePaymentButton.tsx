'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { CreditCard, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  bookingId: string
  milestoneNumber: number
  amount: number
  label: string
  projectTitle: string
}

export default function AdvancePaymentButton({
  bookingId, milestoneNumber, amount, label, projectTitle,
}: Props) {
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    if (!loaded) { setError('Payment gateway still loading, please wait a moment'); return }
    setLoading(true)
    setError('')
    try {
      // Create Razorpay order for milestone 1 (advance)
      const res = await fetch('/api/payments/milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, milestone_number: milestoneNumber }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create payment order')

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency,
        name: 'HomeServe',
        description: `${label} — ${projectTitle}`,
        order_id: data.razorpay.order_id,
        handler: async (response: Record<string, string>) => {
          const verifyRes = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          const result = await verifyRes.json()
          if (result.success) {
            setPaid(true)
            router.refresh()
            setTimeout(() => router.push(`/homeowner/projects/${bookingId}`), 1500)
          } else {
            setError('Payment verification failed. Please contact support.')
          }
        },
        prefill: {},
        theme: { color: '#1d4ed8' },
        modal: {
          ondismiss: () => setLoading(false),
        },
      })
      rzp.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (paid) {
    return (
      <div className="flex items-center gap-3 p-5 bg-sage-50 border border-sage-200">
        <CheckCircle size={20} className="text-sage-700 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-sage-900">Payment successful</p>
          <p className="text-xs text-sage-700 mt-0.5">Taking you to your project dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setLoaded(true)}
      />
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 text-sm text-rose-700">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        <button
          onClick={handlePay}
          disabled={loading}
          className="coarse:min-h-11 w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-ink-900 text-white text-sm font-semibold hover:bg-cobalt-600 disabled:opacity-60 transition-colors"
        >
          <CreditCard size={16} />
          {loading ? 'Opening payment…' : `Pay ₹${Number(amount).toLocaleString('en-IN')} — ${label}`}
        </button>
        <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
          <ShieldCheck size={13} />
          Secured by Razorpay · 256-bit SSL
        </div>
      </div>
    </>
  )
}
