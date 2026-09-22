'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button, Input } from '@/components/ui/shared'

interface Cust { user_id: string; full_name: string; phone: string | null; email: string | null; properties: { id: string; label: string; address_line: string; city: string }[] }

/** Sell a membership over the phone / at the office, or grant one free of charge. */
export function AdminAddMembership({ plans }: { plans: { id: string; name: string; annual_price: number | null }[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Cust[]>([])
  const [cust, setCust] = useState<Cust | null>(null)
  const [propertyId, setPropertyId] = useState('')
  const [planId, setPlanId] = useState(plans[0]?.id ?? '')
  const [mode, setMode] = useState<'offline' | 'complimentary'>('offline')
  const [amount, setAmount] = useState('')
  const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  async function search() {
    const res = await fetch(`/api/admin/maintenance/customers?q=${encodeURIComponent(q)}`)
    const data = await res.json().catch(() => ({})); setResults(data.customers ?? [])
    setMsg((data.customers ?? []).length ? null : { ok: false, t: 'No customer matches that.' })
  }
  async function save() {
    if (!cust || !propertyId || !planId) return
    setBusy(true); setMsg(null)
    try {
      const res = await fetch('/api/admin/maintenance/memberships', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: cust.user_id, property_id: propertyId, plan_id: planId, mode, amount: amount || undefined, reference: ref || undefined }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setMsg({ ok: false, t: data.error ?? 'Failed' })
      else { setMsg({ ok: true, t: 'Membership created.' }); setCust(null); setQ(''); setAmount(''); setRef(''); router.refresh() }
    } finally { setBusy(false) }
  }

  return (
    <details className="border-2 border-ink-900 bg-white">
      <summary className="cursor-pointer p-4 text-sm font-semibold text-ink-900">Add a membership for a customer</summary>
      <div className="space-y-4 border-t border-ink-900/10 p-5">
        {msg && <p role="status" className={`border p-2.5 text-sm ${msg.ok ? 'border-sage-500/40 bg-sage-50 text-sage-900' : 'border-rose-300 bg-rose-50 text-rose-700'}`}>{msg.t}</p>}
        {cust ? (
          <div className="flex items-center justify-between border border-ink-900/20 p-3 text-sm"><span><strong>{cust.full_name}</strong> <span className="text-stone-500">{cust.phone ?? cust.email}</span></span><button type="button" className="text-xs text-cobalt-600" onClick={() => setCust(null)}>Change</button></div>
        ) : (
          <>
            <div className="flex gap-2"><Input placeholder="Search name, phone or email" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void search() } }} iconLeft={<Search size={14} />} aria-label="Search customer" /><Button type="button" variant="secondary" onClick={search}>Search</Button></div>
            {results.length > 0 && <ul className="divide-y divide-ink-900/10 border border-ink-900/15 text-sm">{results.map((c) => <li key={c.user_id}><button type="button" className="flex w-full justify-between p-3 text-left hover:bg-paper-100" onClick={() => { setCust(c); setPropertyId(c.properties[0]?.id ?? ''); setResults([]) }}><span>{c.full_name}</span><span className="text-xs text-stone-500">{c.phone ?? c.email}</span></button></li>)}</ul>}
          </>
        )}
        {cust && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5"><label htmlFor="am-home" className="text-sm font-medium text-stone-700">Home</label>
              <select id="am-home" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="field">
                {cust.properties.length === 0 && <option value="">This customer has no saved home</option>}
                {cust.properties.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.address_line}, {p.city}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="am-plan" className="text-sm font-medium text-stone-700">Plan</label>
              <select id="am-plan" value={planId} onChange={(e) => setPlanId(e.target.value)} className="field">{plans.map((p) => <option key={p.id} value={p.id}>{p.name}{p.annual_price ? ` — ₹${p.annual_price}` : ' (no price set)'}</option>)}</select></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><span className="text-sm font-medium text-stone-700">How was it paid?</span>
              <div className="flex gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="mode" checked={mode === 'offline'} onChange={() => setMode('offline')} className="accent-[#FF4D17]" /> Paid outside the website (UPI, cash, cheque)</label><label className="flex items-center gap-2"><input type="radio" name="mode" checked={mode === 'complimentary'} onChange={() => setMode('complimentary')} className="accent-[#FF4D17]" /> Free of charge</label></div></div>
            {mode === 'offline' && (<><Input type="number" min={0} label="Amount received (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} /><Input label="Payment reference" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UPI id, cheque no., receipt no." /></>)}
            <div className="sm:col-span-2"><Button size="sm" loading={busy} disabled={!propertyId || !planId || (mode === 'offline' && (!amount || ref.trim().length < 2))} onClick={save}>Create membership</Button></div>
          </div>
        )}
      </div>
    </details>
  )
}
