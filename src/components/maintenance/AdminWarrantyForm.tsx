'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Textarea } from '@/components/ui/shared'

/** Handover + warranty facts for a renovation project. Blank = "terms are in the project agreement". */
export function AdminWarrantyForm({ bookingId, handoverDate, warrantyMonths, warrantyTerms }: {
  bookingId: string; handoverDate: string | null; warrantyMonths: number | null; warrantyTerms: string | null
}) {
  const router = useRouter()
  const [date, setDate] = useState(handoverDate ?? '')
  const [months, setMonths] = useState(warrantyMonths?.toString() ?? '')
  const [terms, setTerms] = useState(warrantyTerms ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  async function save() {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch(`/api/admin/projects/${bookingId}/warranty`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handover_date: date, warranty_months: months, warranty_terms: terms }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setMsg({ ok: false, t: data.error ?? 'Could not save' })
      else { setMsg({ ok: true, t: 'Saved. The customer is notified when handover or the warranty period changes.' }); router.refresh() }
    } finally { setBusy(false) }
  }

  return (
    <div className="p-5 border border-ink-900/15 bg-white space-y-4">
      <div>
        <h2 className="panel-title">Handover &amp; warranty</h2>
        <p className="text-xs text-stone-500 mt-1">Record only what the project agreement says. Leave the period blank to tell the customer the terms are in their agreement.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input type="date" label="Handover date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input type="number" min={1} label="Warranty period (months)" value={months} onChange={(e) => setMonths(e.target.value)} />
      </div>
      <Textarea label="Warranty terms shown to the customer (optional)" rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} />
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" loading={busy} onClick={save}>Save handover details</Button>
        {msg && <span role="status" className={`text-xs ${msg.ok ? 'text-sage-700' : 'text-rose-700'}`}>{msg.t}</span>}
      </div>
    </div>
  )
}
