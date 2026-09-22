'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui/shared'
import { rupees, fmtDate } from '@/lib/maintenance/format'

interface Pay { id: string; amount: number; status: string; method: string; reference: string | null; created_at: string }

/** Payments on one request: history, refunds, and offline receipts. */
export function AdminPaymentPanel({ requestId, payments, amountDue, canRecord }: { requestId: string; payments: Pay[]; amountDue: number; canRecord: boolean }) {
  const router = useRouter()
  const [ref, setRef] = useState('')
  const [amt, setAmt] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  async function call(url: string, body: unknown, key: string, ok: string) {
    setBusy(key); setMsg(null)
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setMsg({ ok: false, t: data.error ?? 'Failed' })
      else { setMsg({ ok: true, t: data.needs_review ? `${ok} The amount differs from what was due; check the request.` : ok }); setRef(''); setAmt(''); router.refresh() }
    } finally { setBusy('') }
  }

  return (
    <section className="border-2 border-ink-900 bg-white p-5">
      <h2 className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">Payments</h2>
      {msg && <p role="status" className={`mb-3 border p-2.5 text-sm ${msg.ok ? 'border-sage-500/40 bg-sage-50 text-sage-900' : 'border-rose-300 bg-rose-50 text-rose-700'}`}>{msg.t}</p>}
      {payments.length === 0 ? <p className="text-sm text-stone-500">No payments yet.</p> : (
        <ul className="divide-y divide-ink-900/10 border border-ink-900/15 text-sm">
          {payments.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <span><strong>{rupees(p.amount)}</strong> <span className="text-stone-500">· {p.method}{p.reference ? ` · ${p.reference}` : ''} · {fmtDate(p.created_at)}</span></span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[0.6875rem] uppercase text-stone-500">{p.status === 'captured' ? 'paid' : p.status}</span>
                {p.status === 'captured' && (
                  <Button size="xs" variant="ghost" loading={busy === p.id}
                    onClick={() => { if (window.confirm(`Refund ${rupees(p.amount)}?${p.method === 'offline' ? ' Returning the money is done outside the system.' : ''}`)) void call(`/api/admin/maintenance/payments/${p.id}/refund`, {}, p.id, 'Refund recorded.') }}>Refund</Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canRecord && (
        <div className="mt-4 space-y-3 border-t border-ink-900/10 pt-4">
          <p className="text-sm font-medium text-ink-900">Record a payment received outside the website</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="number" min={0} step="0.01" label="Amount (₹)" placeholder={String(amountDue)} value={amt} onChange={(e) => setAmt(e.target.value)} hint="Blank = the full amount due" />
            <Input label="Reference" placeholder="UPI id, cheque no., receipt no." value={ref} onChange={(e) => setRef(e.target.value)} />
          </div>
          <Button size="sm" variant="secondary" disabled={ref.trim().length < 2} loading={busy === 'offline'}
            onClick={() => call(`/api/admin/maintenance/requests/${requestId}/payment`, { amount: amt ? Number(amt) : undefined, reference: ref }, 'offline', 'Payment recorded.')}>Record payment</Button>
        </div>
      )}
    </section>
  )
}
