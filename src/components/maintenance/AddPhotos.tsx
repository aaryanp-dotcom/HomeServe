'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/shared'

/** Attach more photos to an existing request (customer, or admin with a kind). */
export function AddPhotos({ requestId, kind, visible = true, max = 6, label = 'Add photos' }: {
  requestId: string; kind?: 'before' | 'after' | 'completion'; visible?: boolean; max?: number; label?: string
}) {
  const router = useRouter()
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, max)
    if (!files.length) return
    setBusy(true); setError('')
    try {
      const fd = new FormData()
      files.forEach((f) => fd.append('files', f))
      if (kind) { fd.append('kind', kind); fd.append('visible', String(visible)) }
      const res = await fetch(`/api/maintenance/requests/${requestId}/media`, { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setError(data.error ?? 'Upload failed')
      else router.refresh()
    } finally { setBusy(false); if (ref.current) ref.current.value = '' }
  }

  return (
    <div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={onPick} />
      <Button type="button" size="sm" variant="secondary" loading={busy} icon={<Camera size={14} />} onClick={() => ref.current?.click()}>{label}</Button>
      {error && <p role="alert" className="mt-1.5 text-sm text-rose-700">{error}</p>}
    </div>
  )
}
