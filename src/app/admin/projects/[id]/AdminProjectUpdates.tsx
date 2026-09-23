'use client'

import { useState, useEffect, useRef } from 'react'
import { ImagePlus, Loader2, CheckCircle, AlertCircle, ChevronUp, Upload } from 'lucide-react'

interface ProjectUpdate {
  id: string
  category: string
  title: string | null
  description: string | null
  photo_urls: string[]   // legacy field — kept for backwards-compat display
  is_public: boolean
  created_at: string
}

interface ProjectPhoto {
  id: string
  storage_path: string
  kind: string
  caption: string | null
  signed_url: string | null
  created_at: string
  update_id: string | null
}

const CATEGORIES = [
  { value: 'before',     label: 'Before' },
  { value: 'progress',   label: 'Progress' },
  { value: 'milestone',  label: 'Milestone' },
  { value: 'completion', label: 'Completion' },
  { value: 'general',    label: 'General' },
]

export default function AdminProjectUpdates({ bookingId }: { bookingId: string }) {
  const [updates, setUpdates]   = useState<ProjectUpdate[]>([])
  const [photos,  setPhotos]    = useState<ProjectPhoto[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,  setSaving]    = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [form, setForm] = useState({
    category:  'progress',
    title:     '',
    description: '',
    is_public: true,
  })
  const [files, setFiles] = useState<File[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function load() {
    setLoading(true)
    const [updRes, photoRes] = await Promise.all([
      fetch(`/api/project-updates?booking_id=${bookingId}`),
      fetch(`/api/admin/projects/photos?booking_id=${bookingId}`),
    ])
    if (updRes.ok) setUpdates(await updRes.json())
    if (photoRes.ok) {
      const d = await photoRes.json()
      setPhotos(d.photos ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [bookingId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    // 1. Post the text update
    const res = await fetch('/api/project-updates', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id:  bookingId,
        category:    form.category,
        title:       form.title || null,
        description: form.description || null,
        photo_urls:  [],   // no longer used; photos go through the secure upload
        is_public:   form.is_public,
      }),
    })

    if (!res.ok) {
      const d = await res.json()
      setMsg({ type: 'err', text: d.error ?? 'Failed to post update' })
      setSaving(false)
      timerRef.current = setTimeout(() => setMsg(null), 4000)
      return
    }

    const update = await res.json()
    const updateId: string | undefined = update?.id

    // 2. Upload photos if any
    if (files.length > 0) {
      const fd = new FormData()
      fd.append('booking_id', bookingId)
      if (updateId) fd.append('update_id', updateId)
      fd.append('kind', ['before', 'after', 'completion'].includes(form.category) ? form.category : 'progress')
      fd.append('visible', form.is_public ? 'true' : 'false')
      files.forEach((f) => fd.append('files', f))

      const photoRes = await fetch('/api/admin/projects/photos', { method: 'POST', body: fd })
      if (!photoRes.ok) {
        const d = await photoRes.json()
        setMsg({ type: 'err', text: `Update posted but photo upload failed: ${d.error ?? 'unknown'}` })
        setSaving(false)
        timerRef.current = setTimeout(() => setMsg(null), 6000)
        load()
        return
      }
    }

    setMsg({ type: 'ok', text: 'Update posted successfully' })
    setForm({ category: 'progress', title: '', description: '', is_public: true })
    setFiles([])
    setShowForm(false)
    setSaving(false)
    timerRef.current = setTimeout(() => setMsg(null), 4000)
    load()
  }

  // Group photos by update_id for display
  const photosByUpdate = new Map<string | null, ProjectPhoto[]>()
  for (const p of photos) {
    const key = p.update_id ?? null
    if (!photosByUpdate.has(key)) photosByUpdate.set(key, [])
    photosByUpdate.get(key)!.push(p)
  }

  return (
    <div className="p-5 bg-white border border-ink-900/15">
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
          msg.type === 'ok'
            ? 'bg-sage-50 text-sage-700 border border-sage-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
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
            <input aria-label="Title"
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Flooring complete"
              className="field w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 mb-1 block">Description (optional)</label>
            <textarea aria-label="Description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Brief note about this update…"
              className="field w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 mb-1 block">
              Photos (JPG / PNG / WebP · max 15 MB each · up to 10)
            </label>
            <label className="flex items-center gap-2 cursor-pointer border border-dashed border-stone-300 rounded p-3 bg-white hover:border-cobalt-400 transition-colors">
              <Upload size={14} className="text-stone-400" />
              <span className="text-xs text-stone-500">
                {files.length > 0
                  ? `${files.length} file${files.length !== 1 ? 's' : ''} selected`
                  : 'Click to select photos…'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={e => setFiles(Array.from(e.target.files ?? []).slice(0, 10))}
              />
            </label>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {files.map((f, i) => (
                  <span key={i} className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded truncate max-w-[150px]">
                    {f.name}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-stone-400 mt-1">
              Photos are stored in a private bucket and served via signed URLs — never public.
            </p>
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
      ) : updates.length === 0 && photos.length === 0 ? (
        <p className="text-xs text-stone-400 py-4 text-center">No updates posted yet</p>
      ) : (
        <div className="space-y-4">
          {updates.map(u => {
            const updatePhotos = photosByUpdate.get(u.id) ?? []
            return (
              <div key={u.id} className="border border-stone-100 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-stone-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-700 capitalize">{u.category}</span>
                    {u.title && <span className="text-xs text-stone-500">— {u.title}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!u.is_public && (
                      <span className="text-[11px] bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded">Internal</span>
                    )}
                    <span className="text-[11px] text-stone-400">
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
                {u.description && (
                  <p className="text-xs text-stone-600 px-3 py-2">{u.description}</p>
                )}

                {/* Secure project photos (new flow) */}
                {updatePhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3">
                    {updatePhotos.map((p) => p.signed_url && (
                      <a key={p.id} href={p.signed_url} target="_blank" rel="noreferrer"
                        className="relative block h-20 w-28 border border-stone-200 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.signed_url} alt={p.kind} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Legacy: manually-entered URLs (read-only, deprecated) */}
                {u.photo_urls.length > 0 && (
                  <div className="px-3 pb-3">
                    <p className="text-[11px] text-amber-600 mb-2 font-medium">
                      ⚠ These photos use legacy URLs. Please re-upload via the new secure upload
                      flow and remove these URLs from the database.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {u.photo_urls.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={url}
                          alt={`Legacy photo ${i + 1}`}
                          className="h-20 w-28 object-cover border border-amber-200 opacity-70"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
