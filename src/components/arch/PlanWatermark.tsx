'use client'

import { FloorPlan } from './FloorPlan'

/** Faint, static floor plan used as background art in interior page heroes. */
export function PlanWatermark({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={className ?? 'pointer-events-none absolute -right-10 top-1/2 hidden w-[44rem] -translate-y-1/2 opacity-[0.08] lg:block'}
    >
      <FloorPlan still className="h-auto w-full" />
    </div>
  )
}
