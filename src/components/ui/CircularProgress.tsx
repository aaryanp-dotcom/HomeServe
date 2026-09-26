'use client'

import { useEffect, useState } from 'react'

interface Props {
  /** 0–100. Values outside that range are clamped. */
  percent: number
  size?: number
  strokeWidth?: number
  /** Tailwind color class for the filled arc, e.g. 'text-cobalt-500'. */
  colorClassName?: string
  trackClassName?: string
  children?: React.ReactNode
  className?: string
}

/**
 * A circular "amount paid of total" ring — the standard fintech/booking-app way to show a
 * single proportion at a glance (vs. a horizontal bar, which reads worse in a compact card).
 * Animates from 0 on mount so it draws in rather than appearing static.
 */
export function CircularProgress({
  percent, size = 96, strokeWidth = 8, colorClassName = 'text-cobalt-500', trackClassName = 'text-stone-150', children, className,
}: Props) {
  const clamped = Math.max(0, Math.min(100, percent))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Animate in on mount/update rather than snapping straight to the target percentage.
  const [drawn, setDrawn] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(clamped))
    return () => cancelAnimationFrame(id)
  }, [clamped])

  const offset = circumference * (1 - drawn / 100)

  return (
    <div className={`relative inline-flex items-center justify-center ${className ?? ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className={trackClassName} stroke="currentColor" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
          className={colorClassName} stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
