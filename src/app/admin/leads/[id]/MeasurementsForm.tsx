'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ruler } from 'lucide-react'
import { SizeInput } from '@/components/size/SizeInput'
import { DEFAULT_SIZE, computeSize, sizeFromSaved, type SizeValue } from '@/lib/size'

/** Record (or correct) what the surveyor measured on a site visit. */
export default function MeasurementsForm({
  visitId, initialArea, initialRooms, statedArea, alreadyCompleted,
}: {
  visitId: string
  initialArea?: number | null
  initialRooms?: unknown
  /** Customer's own figure — used to pre-seed the entry so the surveyor edits rather than retypes. */
  statedArea?: number | null
  alreadyCompleted: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [size, setSize] = useState<SizeValue>(() =>
    initialArea || (Array.isArray(initialRooms) && initialRooms.length)
      ? sizeFromSaved({ carpet_area_sqft: initialArea, rooms_detail: initialRooms })
      : { ...DEFAULT_SIZE, mode: 'room_wise', area: statedArea ? String(statedArea) : '' },
  )
  const [markCompleted, setMarkCompleted] = useState(!alreadyCompleted)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const res = computeSize(size)

  async function save() {
    setError('')
    if (res.errors.length || res.areaSqft <= 0) return setError(res.errors[0] ?? 'Enter the measured size first')
    setSaving(true)
    try {
      const r = await fetch(`/api/site-visits/${visitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sizeMode: size.mode === 'room_wise' ? 'room_wise' : 'total_area',
          areaSqft: res.areaSqft,
          rooms: res.rooms.map(({ name, length_ft, width_ft }) => ({ name, length_ft, width_ft })),
          markCompleted,
        }),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'Could not save')
      setOpen(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1.5 border-2 border-ink-900 px-3 py-1.5 text-xs font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-white">
        <Ruler size={13} /> {initialArea ? 'Edit measurements' : 'Record measurements'}
      </button>
    )
  }

  return (
    <div className="mt-3 space-y-3 border-2 border-ink-900 p-4">
      <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-900">Measured on site</p>
      <SizeInput value={size} onChange={setSize} modes={['room_wise', 'total_area']} />
      {!alreadyCompleted && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={markCompleted} onChange={(e) => setMarkCompleted(e.target.checked)} className="h-4 w-4 accent-cobalt-500" />
          Mark this site visit as completed
        </label>
      )}
      {error && <p className="text-xs font-medium text-cobalt-700">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cobalt-500 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save measurements'}
        </button>
        <button onClick={() => setOpen(false)} className="px-3 py-2 text-sm font-medium text-stone-500 hover:text-stone-800">Cancel</button>
      </div>
    </div>
  )
}
