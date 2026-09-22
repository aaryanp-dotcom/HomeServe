'use client'

import { useState, useEffect } from 'react'
import { Loader2, ImageIcon } from 'lucide-react'

interface ProjectUpdate {
  id: string
  category: string
  title: string | null
  description: string | null
  photo_urls: string[]
  created_at: string
}

const CATEGORY_LABEL: Record<string, string> = {
  before: 'Before', progress: 'Progress', milestone: 'Milestone',
  completion: 'Completion', general: 'Update',
}

export default function ProjectUpdatesSection({ bookingId }: { bookingId: string }) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/project-updates?booking_id=${bookingId}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setUpdates(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [bookingId])

  if (loading) {
    return (
      <div className="p-5 bg-white border border-ink-900/15 ">
        <h2 className="panel-title mb-4">Project Photos</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin text-stone-500" />
        </div>
      </div>
    )
  }

  if (updates.length === 0) {
    return (
      <div className="p-5 bg-white border border-ink-900/15 ">
        <h2 className="panel-title mb-4">Project Photos</h2>
        <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
          <ImageIcon size={24} />
          <p className="text-xs">No photos posted yet. Check back once work begins.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 bg-white border border-ink-900/15 ">
      <h2 className="panel-title mb-4">Project Photos</h2>
      <div className="space-y-5">
        {updates.map(u => (
          <div key={u.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-cobalt-600 bg-cobalt-50 px-2 py-0.5">
                {CATEGORY_LABEL[u.category] ?? u.category}
              </span>
              {u.title && <span className="text-xs text-stone-600 font-medium">{u.title}</span>}
              <span className="ml-auto text-[11px] text-stone-400">
                {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            {u.description && <p className="text-xs text-stone-500 mb-2">{u.description}</p>}
            {u.photo_urls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {u.photo_urls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="aspect-square object-cover border border-stone-100 w-full"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
