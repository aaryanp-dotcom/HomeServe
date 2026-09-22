'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { id: 'new',                  label: 'New' },
  { id: 'contacted',            label: 'Contacted' },
  { id: 'qualified',            label: 'Qualified' },
  { id: 'site_visit_scheduled', label: 'Site Visit Scheduled' },
  { id: 'site_visit_completed', label: 'Site Visit Completed' },
  { id: 'quote_preparation',    label: 'Quote Preparation' },
  { id: 'quote_sent',           label: 'Quote Sent' },
  { id: 'negotiation',          label: 'Negotiation' },
  { id: 'won',                  label: 'Won' },
  { id: 'lost',                 label: 'Lost' },
]

interface Props {
  leadId: string
  currentStatus: string
  adminNotes: string
}

export default function LeadStatusForm({ leadId, currentStatus, adminNotes }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState(adminNotes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/renovation-requests/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: notes }),
      })
      if (res.ok) {
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1.5">Status</label>
        <select aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="field w-full"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1.5">Admin Notes</label>
        <textarea aria-label="Admin Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Internal notes about this lead…"
          className="field w-full"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="coarse:min-h-11 w-full py-2.5 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Update Lead'}
      </button>
    </div>
  )
}
