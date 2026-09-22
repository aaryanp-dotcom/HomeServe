'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Pencil, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/shared'
import type { Property } from '@/lib/maintenance/types'

/** Rename, set as default, or remove saved homes. Homes with history are kept (the API explains why). */
export function HomesManager({ properties }: { properties: Property[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  async function call(id: string, method: 'PATCH' | 'DELETE', body?: Record<string, unknown>) {
    setBusy(id); setError('')
    try {
      const res = await fetch(`/api/properties/${id}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setError(data.error ?? 'That did not work.')
      else { setEditing(null); router.refresh() }
    } finally { setBusy('') }
  }

  if (properties.length === 0) return null
  return (
    <section aria-labelledby="homes-h">
      <h2 id="homes-h" className="mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60">My homes ({properties.length})</h2>
      <ul className="divide-y divide-ink-900/10 border border-ink-900/15 bg-white">
        {properties.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 p-3.5 text-sm">
            <Home size={16} className="shrink-0 text-ink-900/60" />
            <span className="min-w-0 flex-1">
              {editing === p.id ? (
                <span className="flex items-center gap-2">
                  <input aria-label="Home name" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} className="field w-44" autoFocus />
                  <Button size="xs" loading={busy === p.id} disabled={!label.trim()} onClick={() => call(p.id, 'PATCH', { label })}>Save</Button>
                  <Button size="xs" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                </span>
              ) : (
                <>
                  <span className="font-semibold text-ink-900">{p.label}</span>
                  {p.is_default && <span className="ml-2 inline-flex items-center gap-1 font-mono text-[0.6875rem] uppercase text-sage-700"><Check size={11} /> Default</span>}
                  <span className="block truncate text-xs text-stone-500">{p.address_line}, {p.city}</span>
                </>
              )}
            </span>
            {editing !== p.id && (
              <span className="flex items-center gap-1">
                {!p.is_default && <Button size="xs" variant="ghost" loading={busy === p.id} onClick={() => call(p.id, 'PATCH', { is_default: true })}>Make default</Button>}
                <button type="button" aria-label={`Rename ${p.label}`} onClick={() => { setEditing(p.id); setLabel(p.label) }} className="inline-flex items-center justify-center p-1.5 coarse:h-11 coarse:w-11 text-stone-500 hover:text-ink-900"><Pencil size={14} /></button>
                <button type="button" aria-label={`Delete ${p.label}`} onClick={() => { if (window.confirm(`Remove “${p.label}”?`)) void call(p.id, 'DELETE') }} className="inline-flex items-center justify-center p-1.5 coarse:h-11 coarse:w-11 text-stone-500 hover:text-rose-700"><Trash2 size={14} /></button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
    </section>
  )
}
