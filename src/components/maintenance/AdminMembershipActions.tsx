'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/shared'

export function AdminMembershipActions({ id, status, inspectionsLeft, payment }: { id: string; status: string; inspectionsLeft: number; payment?: { id: string; amount: number; method: string } | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  async function act(body: Record<string, unknown>, key: string) {
    setBusy(key); setErr('')
    try {
      const res = await fetch(`/api/admin/maintenance/subscriptions/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setErr(data.error ?? 'Failed'); else router.refresh()
    } finally { setBusy('') }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'active' && inspectionsLeft > 0 && (
        <Button size="xs" variant="secondary" loading={busy === 'insp'} onClick={() => act({ action: 'record_inspection' }, 'insp')}>Record inspection done</Button>
      )}
      {['active', 'upcoming', 'pending_payment'].includes(status) && (
        <Button size="xs" variant="ghost" loading={busy === 'cancel'} onClick={() => { if (window.confirm('Cancel this membership now? Refunds are handled separately.')) void act({ action: 'cancel', reason: 'Cancelled by HomeServe' }, 'cancel') }}>Cancel</Button>
      )}
      {payment && (
        <Button size="xs" variant="ghost" loading={busy === 'refund'}
          onClick={async () => { if (!window.confirm(`Refund ₹${payment.amount}? This cancels the membership.${payment.method === 'offline' ? ' Returning the money is done outside the system.' : ''}`)) return; setBusy('refund'); setErr(''); try { const res = await fetch(`/api/admin/maintenance/payments/${payment.id}/refund`, { method: 'POST' }); const d = await res.json().catch(() => ({})); if (!res.ok) setErr(d.error ?? 'Refund failed'); else router.refresh() } finally { setBusy('') } }}>Refund</Button>
      )}
      {err && <span role="alert" className="text-xs text-rose-700">{err}</span>}
    </div>
  )
}
