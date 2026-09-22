'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X, Info, BadgeCheck } from 'lucide-react'
import { Button, Textarea, Input } from '@/components/ui/shared'
import { cn } from '@/lib/utils'
import { PropertyPicker, type AddressSuggestion } from './PropertyPicker'
import { CATEGORY_META, TIME_SLOTS, INDICATIVE_PRICE_NOTE, type MaintenanceCategory } from '@/lib/maintenance/config'
import type { Property } from '@/lib/maintenance/types'

export interface FormService {
  id: string
  slug: string
  name: string
  category: MaintenanceCategory
  summary: string
  inclusions: string[]
  exclusions: string[]
  photos_helpful: boolean
  priceText: string
  hasPrice: boolean
}

/** membership per property id → plan name + categories it applies to */
export type MemberMap = Record<string, { plan: string; categories: MaintenanceCategory[] }>

const MAX_PHOTOS = 6

export function RequestForm({
  services, initialServiceId, properties: initialProps, members, projectId, suggestions,
}: {
  services: FormService[]
  initialServiceId?: string
  properties: Property[]
  members: MemberMap
  projectId?: string
  suggestions?: AddressSuggestion[]
}) {
  const router = useRouter()
  const [serviceId, setServiceId] = useState(initialServiceId ?? '')
  const [properties, setProperties] = useState(initialProps)
  const [propertyId, setPropertyId] = useState(initialProps.find((p) => p.is_default)?.id ?? initialProps[0]?.id ?? '')
  const [urgency, setUrgency] = useState<'routine' | 'urgent'>('routine')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('any')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const svc = services.find((s) => s.id === serviceId)
  const member = members[propertyId]
  const memberCovers = !!(member && svc && member.categories.includes(svc.category))
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos])

  function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const next = [...photos, ...Array.from(e.target.files ?? [])].slice(0, MAX_PHOTOS)
    const bad = next.find((f) => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 5 * 1024 * 1024)
    if (bad) { setError('Photos must be JPG, PNG or WebP and under 5 MB each.'); return }
    setError(''); setPhotos(next)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!svc) { setError('Choose the service you need.'); return }
    if (!propertyId) { setError('Choose or add the home this is for.'); return }
    if (description.trim().length < 10) { setError('Tell us a little about the problem (at least 10 characters).'); return }
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/maintenance/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: svc.id, property_id: propertyId, description, urgency,
          preferred_date: date || null, preferred_slot: slot, booking_id: projectId ?? null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not submit your request'); return }

      let photoNote = ''
      if (photos.length) {
        const fd = new FormData()
        photos.forEach((f) => fd.append('files', f))
        const up = await fetch(`/api/maintenance/requests/${data.id}/media`, { method: 'POST', body: fd })
        if (!up.ok) photoNote = '&photos=failed'
      }
      router.push(`/homeowner/maintenance/${data.id}?created=1${photoNote}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally { setBusy(false) }
  }

  const label = 'block font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-900/60'

  return (
    <form onSubmit={submit} className="space-y-9">
      {/* 1 — service */}
      <section className="space-y-2">
        <p className={label}>1 · What do you need?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((s) => {
            const on = s.id === serviceId
            return (
              <button key={s.id} type="button" onClick={() => setServiceId(s.id)} aria-pressed={on}
                className={cn('border-2 p-3.5 text-left transition-colors', on ? 'border-ink-900 bg-white shadow-hard' : 'border-ink-900/15 bg-white hover:border-ink-900/50')}>
                <span className="block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-cobalt-600">{CATEGORY_META[s.category].short}</span>
                <span className="mt-0.5 block text-sm font-semibold text-ink-900">{s.name}</span>
                <span className="mt-1 block text-xs leading-snug text-stone-500">{s.summary}</span>
              </button>
            )
          })}
        </div>

        {svc && (
          <div className="mt-3 grid gap-4 border border-ink-900/15 bg-white p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold text-ink-900">Included</p>
              <ul className="mt-1.5 space-y-1 text-stone-600">{svc.inclusions.map((i) => <li key={i}>• {i}</li>)}</ul>
            </div>
            <div>
              <p className="font-semibold text-ink-900">Not included</p>
              <ul className="mt-1.5 space-y-1 text-stone-600">{svc.exclusions.map((i) => <li key={i}>• {i}</li>)}</ul>
            </div>
            <div className="border-t border-ink-900/10 pt-3 sm:col-span-2">
              <p className="font-semibold text-ink-900">{svc.priceText}</p>
              <p className="mt-1 flex gap-1.5 text-xs text-stone-500"><Info size={13} className="mt-0.5 shrink-0" />{INDICATIVE_PRICE_NOTE}</p>
            </div>
          </div>
        )}
      </section>

      {/* 2 — property */}
      <section className="space-y-2">
        <p className={label}>2 · Which home?</p>
        <PropertyPicker
          properties={properties} value={propertyId} onChange={setPropertyId}
          onAdded={(p) => setProperties((prev) => [...prev, p])} suggestions={suggestions}
        />
        {member && (
          <p className={cn('flex gap-2 border p-3 text-sm', memberCovers ? 'border-sage-500/40 bg-sage-50 text-sage-800' : 'border-ink-900/15 bg-white text-stone-600')}>
            <BadgeCheck size={16} className="mt-0.5 shrink-0" />
            {memberCovers
              ? `This home has a ${member.plan} membership. Member benefits are applied to eligible charges when your charges are finalised.`
              : `This home has a ${member.plan} membership, but it does not apply to ${svc ? CATEGORY_META[svc.category].label.toLowerCase() : 'this service'}.`}
          </p>
        )}
      </section>

      {/* 3 — problem */}
      <section className="space-y-2">
        <p className={label}>3 · Tell us what is wrong</p>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={1500}
          placeholder="What is happening, where in the home, and since when? Anything that helps our team come prepared." aria-label="Describe the problem" />
        <div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={addFiles} />
          <div className="flex flex-wrap items-center gap-2">
            {previews.map((src, i) => (
              <div key={src} className="group relative h-16 w-16 overflow-hidden border border-ink-900/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button type="button" aria-label="Remove photo" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                  <X size={14} className="text-white" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex h-16 items-center gap-2 border-2 border-dashed border-ink-900/25 px-4 text-sm text-stone-500 hover:border-ink-900/60">
                <Camera size={15} /> {photos.length ? 'Add more' : 'Add photos'}
              </button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-stone-500">
            {svc?.photos_helpful ? 'Photos help our team understand the problem. ' : 'Photos are optional for this service. '}Up to {MAX_PHOTOS}, JPG/PNG/WebP, 5 MB each.
          </p>
        </div>
      </section>

      {/* 4 — timing */}
      <section className="space-y-2">
        <p className={label}>4 · When suits you?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input type="date" label="Preferred date (optional)" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="slot" className="text-sm font-medium text-stone-700">Preferred time</label>
            <select id="slot" value={slot} onChange={(e) => setSlot(e.target.value)} className="field w-full">
              {TIME_SLOTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <label className="mt-1 flex cursor-pointer items-start gap-2.5 text-sm text-stone-700">
          <input type="checkbox" checked={urgency === 'urgent'} onChange={(e) => setUrgency(e.target.checked ? 'urgent' : 'routine')} className="mt-1 h-4 w-4 accent-[#FF4D17]" />
          <span>This is urgent. <span className="text-stone-500">We flag it for our team; the visit date still depends on availability.</span></span>
        </label>
      </section>

      {error && <p role="alert" className="border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" loading={busy}>Submit request</Button>
        <p className="text-xs text-stone-500">No payment now. We confirm the request first, and tell you the charges before anything beyond the visit proceeds.</p>
      </div>
    </form>
  )
}
