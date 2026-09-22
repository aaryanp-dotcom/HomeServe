'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Button } from '@/components/ui/shared'

/**
 * Opens the same Razorpay checkout used for renovation milestones, for a maintenance order.
 * The amount always comes from the server; this component only carries the order id through.
 */
export function PayButton({
  createUrl,
  createBody,
  label,
  description,
  variant = 'primary',
  size = 'md',
  fullWidth,
}: {
  createUrl: string
  createBody?: Record<string, unknown>
  label: string
  description: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function pay() {
    setError('')
    setBusy(true)
    try {
      const res = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createBody ?? {}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not start the payment'); return }
      if (typeof window === 'undefined' || !window.Razorpay) { setError('The payment window could not load. Please refresh and try again.'); return }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency,
        name: 'HomeServe',
        description,
        order_id: data.razorpay.order_id,
        handler: async (response) => {
          const v = await fetch('/api/maintenance/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          const out = await v.json().catch(() => ({}))
          if (out.success) router.refresh()
          else setError('We could not confirm the payment yet. If money was deducted it will be reflected shortly; please contact HomeServe if it is not.')
        },
        theme: { color: '#111111' },
        modal: { ondismiss: () => setBusy(false) },
      })
      rzp.open()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={fullWidth ? 'w-full' : undefined}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Button onClick={pay} loading={busy} variant={variant} size={size} fullWidth={fullWidth}>{label}</Button>
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
    </div>
  )
}
