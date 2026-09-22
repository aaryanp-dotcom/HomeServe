'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from '@/components/motion/useReducedMotion'
import { cn } from '@/lib/utils'

/** Progress bar whose fill animates from 0 when it scrolls into view. */
export function ProgressFill({ percent, className, barClassName, label = 'Progress' }: { percent: number; className?: string; barClassName?: string; label?: string }) {
  const reduce = useReducedMotion()
  const pct = Math.max(0, Math.min(100, percent))
  return (
    <div className={cn('h-2 w-full overflow-hidden bg-stone-150', className)} role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className={cn('h-full bg-cobalt-500', barClassName)}
        initial={{ width: reduce ? `${pct}%` : 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      />
    </div>
  )
}
