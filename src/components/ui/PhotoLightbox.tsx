'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export interface LightboxPhoto {
  id: string
  url: string
  caption?: string
}

interface Props {
  photos: LightboxPhoto[]
  index: number
  onClose: () => void
  onIndexChange: (i: number) => void
}

const SWIPE_THRESHOLD = 60 // px of drag before it counts as a swipe rather than a tap-drag

/**
 * Full-screen, swipeable photo viewer — the standard way a progress-photo timeline is
 * browsed (Airbnb/Uber-style), rather than only ever seeing photos cropped small in a grid.
 * Swipe or arrow keys to move between photos; Escape or the backdrop to close.
 */
export function PhotoLightbox({ photos, index, onClose, onIndexChange }: Props) {
  const [dragDirection, setDragDirection] = useState(0)
  const photo = photos[index]

  const go = (delta: number) => {
    const next = index + delta
    if (next < 0 || next >= photos.length) return
    setDragDirection(delta)
    onIndexChange(next)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) go(1)
    else if (info.offset.x > SWIPE_THRESHOLD) go(-1)
  }

  if (!photo) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col bg-black/95"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="flex items-center justify-between px-4 py-3 text-white/80" onClick={(e) => e.stopPropagation()}>
          <span className="font-mono text-xs">{index + 1} / {photos.length}</span>
          <button onClick={onClose} aria-label="Close" className="coarse:min-h-11 coarse:min-w-11 flex items-center justify-center hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-4">
          {index > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); go(-1) }}
              aria-label="Previous photo"
              className="coarse:min-h-11 coarse:min-w-11 absolute left-2 z-10 hidden items-center justify-center text-white/70 hover:text-white sm:flex"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <AnimatePresence initial={false} mode="wait" custom={dragDirection}>
            <motion.div
              key={photo.id}
              custom={dragDirection}
              initial={{ opacity: 0, x: dragDirection >= 0 ? 60 : -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dragDirection >= 0 ? -60 : 60 }}
              transition={{ duration: 0.2 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={handleDragEnd}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-full max-w-full cursor-grab flex-col items-center active:cursor-grabbing"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.caption ?? 'Project photo'} className="max-h-[75dvh] max-w-full touch-none select-none object-contain" draggable={false} />
              {photo.caption && <p className="mt-3 max-w-md text-center text-sm text-white/80">{photo.caption}</p>}
            </motion.div>
          </AnimatePresence>

          {index < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); go(1) }}
              aria-label="Next photo"
              className="coarse:min-h-11 coarse:min-w-11 absolute right-2 z-10 hidden items-center justify-center text-white/70 hover:text-white sm:flex"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>

        {/* Dot strip — small galleries only, to avoid an unreadable wall of dots */}
        {photos.length > 1 && photos.length <= 12 && (
          <div className="flex justify-center gap-1.5 pb-5" onClick={(e) => e.stopPropagation()}>
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setDragDirection(i >= index ? 1 : -1); onIndexChange(i) }}
                aria-label={`Go to photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/30'}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
