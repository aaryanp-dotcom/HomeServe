'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/shared'
import { PayButton } from './PayButton'

/** Renew / cancel / undo cancellation for one membership. */
export function MembershipActions({
  id, status, cancelAtPeriodEnd, canRenew, renewPrice, planName, endDate,
}: {
  id: string
  status: 'pending_payment' | 'active' | 'upcoming' | 'expired' | 'cancelled'
  cancelAtPeriodEnd: boolean
  canRenew: boolean
  renewPrice?: string
  planName: string
  endDate?: string | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function act(action: 'cancel' | 'undo_cancel') {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/maintenance/memberships/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setError(data.error ?? 'That did not work.')
      else router.refresh()
    } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {canRenew && (
        <PayButton createUrl={`/api/maintenance/memberships/${id}`} createBody={{ action: 'renew' }}
          label={renewPrice ? `Renew for ${renewPrice}` : 'Renew'} description={`${planName} membership renewal`} />
      )}
      {status === 'active' && !cancelAtPeriodEnd && (
        <Button variant="ghost" size="sm" loading={busy}
          onClick={() => { if (window.confirm(`Stop this membership from renewing? Your benefits continue until ${endDate ?? 'the end date'}.`)) void act('cancel') }}>
          Cancel membership
        </Button>
      )}
      {status === 'active' && cancelAtPeriodEnd && (
        <Button variant="secondary" size="sm" loading={busy} onClick={() => void act('undo_cancel')}>Keep my membership</Button>
      )}
      {status === 'pending_payment' && (
        <Button variant="ghost" size="sm" loading={busy} onClick={() => void act('cancel')}>Abandon this purchase</Button>
      )}
      {error && <p role="alert" className="w-full text-sm text-rose-700">{error}</p>}
    </div>
  )
}
