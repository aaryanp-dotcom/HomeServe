'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Upload, X } from 'lucide-react'

const ISSUE_CATEGORIES = [
  'Painting — touch-up or peeling',
  'Tile — cracked or loose',
  'Carpentry — door/wardrobe issue',
  'Electrical — switch or fitting',
  'Plumbing — leakage or fitting',
  'Civil — crack or seepage',
  'Flooring — damage or loose',
  'False ceiling — damage',
  'Other',
]

const CONTACT_TIMES = [
  'Morning (9am–12pm)',
  'Afternoon (12pm–4pm)',
  'Evening (4pm–7pm)',
  'Any time',
]

export default function WarrantyRequestForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [issueCategory, setIssueCategory] = useState('')
  const [description, setDescription] = useState('')
  const [preferredVisitTime, setPreferredVisitTime] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5)
    setPhotos(prev => [...prev, ...files].slice(0, 5))
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!issueCategory) { setError('Please select an issue category'); return }
    if (!description.trim()) { setError('Please describe the issue'); return }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/warranty-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          issue_category: issueCategory,
          description,
          preferred_visit_time: preferredVisitTime,
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Submission failed')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="h-16 w-16 bg-sage-50 flex items-center justify-center mx-auto">
          <ShieldCheck size={28} className="text-sage-500" />
        </div>
        <h2 className="text-xl font-semibold text-stone-900">Request Submitted</h2>
        <p className="text-stone-500 text-sm max-w-sm mx-auto">
          Our team will review your request and contact you within 24 hours to schedule a visit.
        </p>
        <button
          onClick={() => router.push('/homeowner/warranty')}
          className="coarse:min-h-11 mt-4 px-6 py-2.5 bg-ink-900 text-white text-sm font-semibold hover:bg-cobalt-600 transition-colors"
        >
          Back to Warranty
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Issue category */}
      <div>
        <label className="block text-sm font-medium text-stone-800 mb-2">Issue Category <span className="text-rose-700">*</span></label>
        <div className="grid sm:grid-cols-2 gap-2">
          {ISSUE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setIssueCategory(cat)}
              className={`text-left text-sm px-4 py-2.5 border transition-all ${
                issueCategory === cat
                  ? 'bg-cobalt-50 border-cobalt-400 text-cobalt-700 font-medium'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-stone-800 mb-2">Describe the Issue <span className="text-rose-700">*</span></label>
        <textarea aria-label="Describe the Issue"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          placeholder="Please describe the problem in detail — when it started, the affected area, and any relevant context..."
          className="field w-full"
        />
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-stone-800 mb-2">Photos (optional, up to 5)</label>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {photos.map((file, i) => (
              <div key={i} className="relative h-16 w-16 overflow-hidden border border-stone-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute inset-0 bg-black/40 [@media(hover:none)]:bg-black/30 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-stone-300 text-sm text-stone-500 hover:border-cobalt-400 hover:text-cobalt-600 transition-colors"
        >
          <Upload size={15} />
          {photos.length === 0 ? 'Upload photos' : `${photos.length} photo${photos.length !== 1 ? 's' : ''} added`}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      </div>

      {/* Preferred visit time */}
      <div>
        <label className="block text-sm font-medium text-stone-800 mb-2">Preferred Visit Time</label>
        <div className="flex flex-wrap gap-2">
          {CONTACT_TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPreferredVisitTime(t)}
              className={`text-sm px-4 py-2 border transition-all ${
                preferredVisitTime === t
                  ? 'bg-cobalt-500 border-cobalt-500 text-white'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="coarse:min-h-11 w-full py-3 bg-ink-900 text-white text-sm font-semibold hover:bg-cobalt-600 disabled:opacity-60 transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit Warranty Request'}
      </button>
    </form>
  )
}
