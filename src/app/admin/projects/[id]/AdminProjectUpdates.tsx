'use client'

import { useState, useEffect, useRef } from 'react'
import { ImagePlus, Loader2, CheckCircle, AlertCircle, ChevronUp } from 'lucide-react'

interface ProjectUpdate {
  id: string
  category: string
  title: string | null
  description: string | null
  photo_urls: string[]
  is_public: boolean
  created_at: string
}

const CATEGORIES = [
  { value: 'before', label: 'Before' },
  { value: 'progress', label: 'Progress' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'completion', label: 'Completion' },
  { value: 'general', label: 'General' },
]

export default function AdminProjectUpdates({ bookingId }: { bookingId: string }) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [form, setForm] = useState({
    category: 'progress',
    title: '',
    description: '',
    photo_urls: '',
    is_public: true,
  })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/project-updates?booking_id=${bookingId}`)
    if (res.ok) setUpdates(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [bookingId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const urls = form.photo_urls
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean)
    const res = await fetch('/api/project-updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        category: form.category,
        title: form.title || null,
        description: form.description || null,
        photo_urls: urls,
        is_public: form.is_public,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setMsg({ type: 'ok', text: 'Update posted successfully' })
      setForm({ category: 'progress', title: '', description: '', photo_urls: '', is_public: true })
      setShowForm(false)
      load()
    } else {
      const d = await res.json()
      setMsg({ type: 'err', text: d.error ?? 'Failed to post update' })
    }
    timerRef.current = setTimeout(() => setMsg(null), 4000)
  }

  return (
    <div className="p-5 bg-white border border-ink-900/15 ">
      <div className="flex items-center justify-between mb-4">
        <h2 className="panel-title">Project Updates / Photos</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-cobalt-600 hover:text-cobalt-700"
        >
          {showForm ? <><ChevronUp size={13} /> Cancel</> : <><ImagePlus size={13} /> Add Update</>}
        </button>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 text-xs p-3 mb-4 ${
          msg.type === 'ok' ? 'bg-sage-50 text-sage-700 border border-sage-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {msg.type === 'ok' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
          {msg.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="space-y-3 mb-5 p-4 bg-stone-50 border border-stone-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 block">Category</label>
              <select aria-label="Category"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="field w-full"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                  className="rounded"
                />
                Visible to customer
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600 mb-1 block">Title (optional)</label>
            <input aria-label="Title (optional)"
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Flooring complete"
              className="field w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600 mb-1 block">Description (optional)</label>
            <textarea aria-label="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Brief note about this update…"
              className="field w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600 mb-1 block">Photo URLs (one per line)</label>
            <textarea aria-label="Photo URLs (one per line)"
              value={form.photo_urls}
              onChange={e => setForm(f => ({ ...f, photo_urls: e.target.value }))}
              rows={3}
              placeholder="https://..."
              className="field w-full font-mono"
            />
            <p className="text-[11px] text-stone-400 mt-1">Paste Supabase storage public URLs, one per line</p>
          </div>
          <button type="submit" disabled={saving}
            className="coarse:min-h-11 flex items-center gap-2 px-4 py-2 bg-ink-900 text-white text-xs font-semibold hover:bg-cobalt-600 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Post Update
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin text-stone-500" />
        </div>
      ) : updates.length === 0 ? (
        <p className="text-xs text-stone-400 py-4 text-center">No updates posted yet</p>
      ) : (
        <div className="space-y-4">
          {updates.map(u => (
            <div key={u.id} className="border border-stone-100 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-stone-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-700 capitalize">{u.category}</span>
                  {u.title && <span className="text-xs text-stone-500">— {u.title}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {!u.is_public && <span className="text-[11px] bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded">Internal</span>}
                  <span className="text-[11px] text-stone-400">
                    {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
              {u.description && (
                <p className="text-xs text-stone-600 px-3 py-2">{u.description}</p>
              )}
              {u.photo_urls.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3">
                  {u.photo_urls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`Update photo ${i + 1}`}
                      className="h-20 w-28 object-cover border border-stone-200"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
