'use client'

import { useState, useEffect } from 'react'
import { ImageIcon } from 'lucide-react'
import { PhotoLightbox, type LightboxPhoto } from '@/components/ui/PhotoLightbox'

interface ProjectUpdate {
  id: string
  category: string
  title: string | null
  description: string | null
  photo_urls: string[]   // legacy — older updates may still carry photos this way
  created_at: string
}

interface ProjectPhoto {
  id: string
  storage_path: string
  signed_url: string | null
  update_id: string | null
}

const CATEGORY_LABEL: Record<string, string> = {
  before: 'Before', progress: 'Progress', milestone: 'Milestone',
  completion: 'Completion', general: 'Update',
}

function UpdatesSkeleton() {
  return (
    <div className="p-5 bg-white border border-ink-900/15 animate-pulse">
      <div className="mb-4 h-3 w-28 bg-stone-150" />
      {[0, 1].map((row) => (
        <div key={row} className="mb-5 last:mb-0">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-4 w-16 bg-stone-150" />
            <div className="ml-auto h-3 w-20 bg-stone-100" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((cell) => (
              <div key={cell} className="aspect-square bg-stone-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProjectUpdatesSection({ bookingId }: { bookingId: string }) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([])
  const [photos, setPhotos] = useState<ProjectPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/project-updates?booking_id=${bookingId}`).then(r => r.ok ? r.json() : []),
      // Signed URLs (1hr) for photos uploaded through the private project-media bucket —
      // photo_urls on the update itself only ever holds older, directly-pasted links.
      fetch(`/api/project-photos?booking_id=${bookingId}`).then(r => r.ok ? r.json() : { photos: [] }),
    ])
      .then(([u, p]) => { setUpdates(u); setPhotos(p.photos ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [bookingId])

  const photosFor = (updateId: string) => photos.filter(p => p.update_id === updateId && p.signed_url)

  // Flattened, ordered gallery across every update — lets the lightbox swipe through the
  // whole project history in one continuous strip, not just one update's photos at a time.
  const gallery: LightboxPhoto[] = updates.flatMap((u) => {
    const linked = photosFor(u.id)
    if (linked.length > 0) return linked.map((p) => ({ id: p.id, url: p.signed_url!, caption: u.title ?? CATEGORY_LABEL[u.category] }))
    return u.photo_urls.map((url, i) => ({ id: `${u.id}-legacy-${i}`, url, caption: u.title ?? CATEGORY_LABEL[u.category] }))
  })

  if (loading) return <UpdatesSkeleton />

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
        {updates.map(u => {
          const linked = photosFor(u.id)
          const photosToShow = linked.length > 0
            ? linked.map((p) => ({ url: p.signed_url!, key: p.id }))
            : u.photo_urls.map((url, i) => ({ url, key: `${u.id}-legacy-${i}` }))
          return (
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
              {photosToShow.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photosToShow.map((p) => {
                    const galleryIndex = gallery.findIndex((g) => g.url === p.url)
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.key}
                        src={p.url}
                        alt="Project photo"
                        role="button"
                        tabIndex={0}
                        onClick={() => galleryIndex >= 0 && setLightboxIndex(galleryIndex)}
                        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && galleryIndex >= 0) setLightboxIndex(galleryIndex) }}
                        className="aspect-square cursor-zoom-in object-cover border border-stone-100 w-full transition-opacity hover:opacity-90"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={gallery}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  )
}
