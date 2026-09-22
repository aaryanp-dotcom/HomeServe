'use client'

import { useState } from 'react'
import { Home, Plus, Check } from 'lucide-react'
import { Button, Input } from '@/components/ui/shared'
import { cn } from '@/lib/utils'
import { NCR_CITY_LIST } from '@/lib/maintenance/schemas'
import type { Property } from '@/lib/maintenance/types'

/** Choose one of the customer's homes, or add a new one inline. */
export interface AddressSuggestion { label: string; address_line: string; city: string; booking_id: string }

export function PropertyPicker({
  properties, value, onChange, onAdded, suggestions = [],
}: {
  properties: Property[]
  value: string
  onChange: (id: string) => void
  onAdded: (p: Property) => void
  /** Addresses from the customer's renovation projects, offered as a one-click start. */
  suggestions?: AddressSuggestion[]
}) {
  const [adding, setAdding] = useState(properties.length === 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [f, setF] = useState({ label: 'My home', address_line: '', locality: '', city: 'Delhi', pincode: '' })

  async function add(e: React.FormEvent | null, body: Record<string, unknown> = f) {
    e?.preventDefault()
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/properties', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not save the address'); return }
      onAdded(data.property as Property)
      onChange((data.property as Property).id)
      setAdding(false)
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-3">
      {properties.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {properties.map((p) => {
            const on = p.id === value
            return (
              <button
                key={p.id} type="button" onClick={() => onChange(p.id)} aria-pressed={on}
                className={cn(
                  'flex items-start gap-3 border-2 p-3.5 text-left transition-colors',
                  on ? 'border-ink-900 bg-white shadow-hard' : 'border-ink-900/15 bg-white hover:border-ink-900/50',
                )}
              >
                <Home size={16} className="mt-0.5 shrink-0 text-ink-900/60" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink-900">{p.label}</span>
                  <span className="block truncate text-xs text-stone-500">{p.address_line}, {p.city}</span>
                </span>
                {on && <Check size={16} className="shrink-0 text-cobalt-500" />}
              </button>
            )
          })}
        </div>
      )}

      {suggestions
        .filter((s, i, all) => all.findIndex((x) => x.address_line === s.address_line && x.city === s.city) === i)
        .filter((s) => !properties.some((p) => p.booking_id === s.booking_id || (p.address_line === s.address_line && p.city === s.city)))
        .map((s) => (
        <button key={s.booking_id} type="button" disabled={busy}
          onClick={() => void add(null, { label: s.label, address_line: s.address_line, city: s.city, booking_id: s.booking_id })}
          className="flex w-full items-center gap-2 border border-cobalt-400/50 bg-cobalt-50 p-3 text-left text-sm text-ink-900 hover:border-cobalt-500">
          <Plus size={14} className="shrink-0 text-cobalt-600" />
          <span>Use the address from your renovation project: <strong>{s.label}</strong></span>
        </button>
      ))}

      {!adding && (
        <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-cobalt-600 hover:text-cobalt-700">
          <Plus size={14} /> Add another home
        </button>
      )}

      {adding && (
        <form onSubmit={(e) => void add(e)} className="space-y-3 border-2 border-dashed border-ink-900/25 bg-paper-100 p-4">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-900/60">New home</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Name" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="My home" required />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pp-city" className="text-sm font-medium text-stone-700">City</label>
              <select id="pp-city" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}
                className="field w-full">
                {NCR_CITY_LIST.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Input label="Address" value={f.address_line} onChange={(e) => setF({ ...f, address_line: e.target.value })} placeholder="Flat / house no., building, street" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Locality / sector" value={f.locality} onChange={(e) => setF({ ...f, locality: e.target.value })} />
            <Input label="Pincode" value={f.pincode} inputMode="numeric" maxLength={6} onChange={(e) => setF({ ...f, pincode: e.target.value.replace(/\D/g, '') })} />
          </div>
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={busy}>Save home</Button>
            {properties.length > 0 && <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>}
          </div>
        </form>
      )}
    </div>
  )
}
