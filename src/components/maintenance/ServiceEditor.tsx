'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Textarea } from '@/components/ui/shared'
import type { MaintenanceService } from '@/lib/maintenance/types'

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)

export function ServiceEditor({ service }: { service: MaintenanceService }) {
  const router = useRouter()
  const [f, setF] = useState({
    name: service.name, summary: service.summary, description: service.description,
    inclusions: service.inclusions.join('\n'), exclusions: service.exclusions.join('\n'),
    from: service.indicative_price_from?.toString() ?? '', to: service.indicative_price_to?.toString() ?? '',
    unit: service.price_unit, note: service.price_note ?? '',
    photos: service.photos_helpful, member: service.membership_eligible, active: service.is_active,
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  async function save() {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch(`/api/admin/maintenance/services/${service.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.name, summary: f.summary, description: f.description,
          inclusions: lines(f.inclusions), exclusions: lines(f.exclusions),
          indicative_price_from: f.from, indicative_price_to: f.to, price_unit: f.unit, price_note: f.note,
          photos_helpful: f.photos, membership_eligible: f.member, is_active: f.active,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setMsg({ ok: false, t: data.error ?? 'Could not save' })
      else { setMsg({ ok: true, t: 'Saved' }); router.refresh() }
    } finally { setBusy(false) }
  }

  const chk = 'flex items-center gap-2 text-sm text-stone-700'
  return (
    <div className="space-y-4 border-t border-ink-900/10 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input label="One-line summary" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} />
      </div>
      <Textarea label="Description" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Textarea label="Included (one per line)" rows={4} value={f.inclusions} onChange={(e) => setF({ ...f, inclusions: e.target.value })} />
        <Textarea label="Not included (one per line)" rows={4} value={f.exclusions} onChange={(e) => setF({ ...f, exclusions: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Input type="number" min={0} label="Indicative price from (₹)" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} hint="Leave both blank to show “Quoted after inspection”" />
        <Input type="number" min={0} label="Up to (₹, optional)" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`u-${service.id}`} className="text-sm font-medium text-stone-700">Price is</label>
          <select id={`u-${service.id}`} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value as typeof f.unit })} className="field">
            <option value="per_visit">per visit</option><option value="per_unit">per unit</option><option value="per_sqft">per sq ft</option><option value="on_inspection">quoted after inspection</option>
          </select>
        </div>
        <Input label="Price note (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      </div>
      <div className="flex flex-wrap gap-6">
        <label className={chk}><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="h-4 w-4 accent-[#FF4D17]" /> Available to customers</label>
        <label className={chk}><input type="checkbox" checked={f.member} onChange={(e) => setF({ ...f, member: e.target.checked })} className="h-4 w-4 accent-[#FF4D17]" /> Membership benefits may apply</label>
        <label className={chk}><input type="checkbox" checked={f.photos} onChange={(e) => setF({ ...f, photos: e.target.checked })} className="h-4 w-4 accent-[#FF4D17]" /> Photos are helpful</label>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" loading={busy} onClick={save}>Save service</Button>
        {msg && <span role="status" className={`text-sm ${msg.ok ? 'text-sage-700' : 'text-rose-700'}`}>{msg.t}</span>}
      </div>
    </div>
  )
}
