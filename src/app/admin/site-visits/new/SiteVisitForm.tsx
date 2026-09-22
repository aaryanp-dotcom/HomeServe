'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Request {
  id: string
  request_number: string | null
  full_name: string
  city: string
  locality: string
}

interface Props {
  requests: Request[]
  defaultRequestId?: string
}

export default function SiteVisitForm({ requests, defaultRequestId }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    request_id: defaultRequestId ?? '',
    scheduled_date: '',
    scheduled_time: '',
    address: '',
    status: 'scheduled',
    site_notes: '',
  })

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.request_id) { setError('Please select a renovation request'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to create site visit')
      }
      router.push('/admin/site-visits')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-ink-900/15 p-6 space-y-5">
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Renovation Request *</label>
        <select aria-label="Renovation Request"
          value={form.request_id}
          onChange={(e) => set('request_id', e.target.value)}
          className="field w-full"
        >
          <option value="">Select a request…</option>
          {requests.map((r) => (
            <option key={r.id} value={r.id}>
              {r.full_name} — {r.locality}, {r.city} {r.request_number ? `(${r.request_number})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Date</label>
          <input aria-label="Date"
            type="date"
            value={form.scheduled_date}
            onChange={(e) => set('scheduled_date', e.target.value)}
            className="field w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Time</label>
          <input aria-label="Time"
            type="time"
            value={form.scheduled_time}
            onChange={(e) => set('scheduled_time', e.target.value)}
            className="field w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Property Address</label>
        <textarea aria-label="Property Address"
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          rows={2}
          placeholder="Full address for the site visit"
          className="field w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label>
        <select aria-label="Status"
          value={form.status}
          onChange={(e) => set('status', e.target.value)}
          className="field w-full"
        >
          <option value="requested">Requested</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label>
        <textarea aria-label="Notes"
          value={form.site_notes}
          onChange={(e) => set('site_notes', e.target.value)}
          rows={3}
          placeholder="Site visit notes, access instructions, or any special requirements…"
          className="field w-full"
        />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="coarse:min-h-11 w-full py-3 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Schedule Site Visit'}
      </button>
    </div>
  )
}
