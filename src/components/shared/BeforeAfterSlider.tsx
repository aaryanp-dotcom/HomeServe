'use client'

import { useState, useRef } from 'react'
import { MoveHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  beforeAlt?: string
  afterAlt?: string
  aspectRatio?: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
  initialPosition?: number
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeAlt = 'Existing space before renovation',
  afterAlt = 'Completed space after turnkey renovation',
  aspectRatio = 'aspect-[16/10]',
  beforeLabel = 'Existing',
  afterLabel = 'Renovated',
  className = '',
  initialPosition = 50,
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(initialPosition)
  const [isInteracting, setIsInteracting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const rawPos = ((clientX - rect.left) / rect.width) * 100
    const clampedPos = Math.max(0, Math.min(100, rawPos))
    setPos(clampedPos)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative select-none overflow-hidden border-2 border-ink-900 bg-ink-900 shadow-sm',
        aspectRatio,
        className
      )}
      onMouseMove={(e) => {
        if (isInteracting) handleSliderMove(e.clientX)
      }}
      onMouseDown={() => setIsInteracting(true)}
      onMouseUp={() => setIsInteracting(false)}
      onMouseLeave={() => setIsInteracting(false)}
      onTouchMove={handleTouchMove}
    >
      {/* Proposed / After Image (Full background) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterImage}
        alt={afterAlt}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
        loading="lazy"
      />

      {/* Existing / Before Image (Clipped overlay) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeImage}
          alt={beforeAlt}
          className="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.05]"
          draggable={false}
          loading="lazy"
        />
      </div>

      {/* Badges */}
      <span className="absolute left-3 top-3 z-10 bg-ink-900/90 px-2.5 py-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider text-white shadow-sm backdrop-blur-xs">
        {beforeLabel}
      </span>
      <span className="absolute right-3 top-3 z-10 bg-cobalt-400 px-2.5 py-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-900 shadow-sm">
        {afterLabel}
      </span>

      {/* Divider Bar & Handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-10 w-10 sm:h-11 sm:w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-ink-900 bg-cobalt-400 text-ink-900 shadow-md">
          <MoveHorizontal size={18} strokeWidth={2.5} />
        </div>
      </div>

      {/* Invisible accessibility range input for mouse & keyboard */}
      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={pos}
        aria-label="Compare before and after renovation"
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 z-30"
        style={{ touchAction: 'pan-y' }}
      />
    </div>
  )
}
