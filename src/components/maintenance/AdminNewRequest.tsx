'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button, Input, Textarea } from '@/components/ui/shared'
import { cn } from '@/lib/utils'
import { TIME_SLOTS, CATEGORY_META, type MaintenanceCategory } from '@/lib/maintenance/config'
import { NCR_CITY_LIST } from '@/lib/maintenance/schemas'

interface Cust { user_id: string; full_name: string; phone: string | null; email: string | null; properties: { id: string; label: string; address_line: string; city: string }[] }
interface Svc { id: string; name: string; category: MaintenanceCategory }

/** Raise a request for a customer who called or messaged. */
export function AdminNewRequest({ services }: { services: Svc[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Cust[]>([])
  const [cust, setCust] = useState<Cust | null>(null)
  const [propertyId, setPropertyId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [description, setDescription] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('any')
  const [confirm, setConfirm] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [addr, setAddr] = useState({ address_line: '', city: 'Delhi', pincode: '' })

  async function search() {
    setError('')
    const res = await fetch(`/api/admin/maintenance/customers?q=${encodeURIComponent(q)}`)
    const data = await res.json().catch(() => ({}))
    setResults(data.customers ?? [])
    if (!(data.customers ?? []).length) setError('No customer matches that. Customers must have an account first.')
  }
  function pick(c: Cust) { setCust(c); setPropertyId(c.properties[0]?.id ?? ''); setResults([]) }

  async function addHome() {
    if (!cust) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/maintenance/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: cust.user_id, label: 'Home', ...addr }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not add the home'); return }
      const p = data.property
      setCust({ ...cust, properties: [...cust.properties, { id: p.id, label: p.label, address_line: p.address_line, city: p.city }] }); setPropertyId(p.id)
      setAddr({ address_line: '', city: 'Delhi', pincode: '' })
    } finally { setBusy(false) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!cust || !propertyId || !serviceId) { setError('Choose a customer, a home and a service.'); return }
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/maintenance/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: cust.user_id, property_id: propertyId, service_id: serviceId, description, urgency: urgent ? 'urgent' : 'routine', preferred_date: date || null, preferred_slot: slot, confirm }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not create the request'); return }
      router.push(`/admin/maintenance/${data.id}`)
    } finally { setBusy(false) }
  }

  const lab = 'mb-2 block font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-900/60'
  return (
    <form onSubmit={submit} className="space-y-8">
      <section>
        <label className={lab} htmlFor="cq">1 · Customer</label>
        {cust ? (
          <div className="flex items-center justify-between border-2 border-ink-900 bg-white p-3 text-sm">
            <span><strong>{cust.full_name}</strong><span className="ml-2 text-stone-500">{cust.phone ?? cust.email}</span></span>
            <button type="button" className="text-xs font-medium text-cobalt-600" onClick={() => { setCust(null); setPropertyId('') }}>Change</button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Input id="cq" placeholder="Name, phone or email" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void search() } }} iconLeft={<Search size={14} />} />
              <Button type="button" variant="secondary" onClick={search}>Search</Button>
            </div>
            {results.length > 0 && (
              <ul className="mt-2 divide-y divide-ink-900/10 border border-ink-900/15 bg-white text-sm">
                {results.map((c) => <li key={c.user_id}><button type="button" onClick={() => pick(c)} className="flex w-full items-center justify-between p-3 text-left hover:bg-paper-100"><span>{c.full_name}</span><span className="text-xs text-stone-500">{c.phone ?? c.email}</span></button></li>)}
              </ul>
            )}
          </>
        )}
      </section>

      {cust && (
        <>
          <section>
            <p className={lab}>2 · Home</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {cust.properties.map((p) => (
                <button key={p.id} type="button" onClick={() => setPropertyId(p.id)} aria-pressed={p.id === propertyId}
                  className={cn('border-2 p-3 text-left text-sm', p.id === propertyId ? 'border-ink-900 bg-white shadow-hard' : 'border-ink-900/15 bg-white hover:border-ink-900/50')}>
                  <span className="block font-semibold">{p.label}</span><span className="block truncate text-xs text-stone-500">{p.address_line}, {p.city}</span>
                </button>
              ))}
            </div>
            <details className="mt-3 border border-dashed border-ink-900/25 p-3" open={cust.properties.length === 0}>
              <summary className="cursor-pointer text-sm font-medium text-cobalt-600">Add a home for this customer</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-3"><Input label="Address" value={addr.address_line} onChange={(e) => setAddr({ ...addr, address_line: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="ac" className="text-sm font-medium text-stone-700">City</label>
                  <select id="ac" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className="field">{NCR_CITY_LIST.map((c) => <option key={c}>{c}</option>)}</select></div>
                <Input label="Pincode" value={addr.pincode} maxLength={6} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, '') })} />
                <div className="flex items-end"><Button type="button" size="sm" loading={busy} onClick={addHome}>Save home</Button></div>
              </div>
            </details>
          </section>

          <section className="space-y-3">
            <p className={lab}>3 · Service and details</p>
            <div className="flex flex-col gap-1.5"><label htmlFor="sv" className="text-sm font-medium text-stone-700">Service</label>
              <select id="sv" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="field">
                <option value="">Choose a service…</option>{services.map((s) => <option key={s.id} value={s.id}>{CATEGORY_META[s.category].short} — {s.name}</option>)}
              </select></div>
            <Textarea label="What the customer described" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="date" label="Preferred date (optional)" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
              <div className="flex flex-col gap-1.5"><label htmlFor="sl" className="text-sm font-medium text-stone-700">Preferred time</label>
                <select id="sl" value={slot} onChange={(e) => setSlot(e.target.value)} className="field">{TIME_SLOTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="h-4 w-4 accent-[#FF4D17]" /> Urgent</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="h-4 w-4 accent-[#FF4D17]" /> Confirm immediately (skip the “requested” step)</label>
          </section>
        </>
      )}

      {error && <p role="alert" className="border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {cust && <Button type="submit" size="lg" loading={busy}>Create request</Button>}
    </form>
  )
}
