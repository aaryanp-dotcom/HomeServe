'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/components/motion/useReducedMotion'

/**
 * Fades + lifts portal page content in on every navigation. Kept short on purpose: with a
 * loading.tsx boundary the new route commits immediately (showing the skeleton), so a long fade
 * from fully transparent would delay the very feedback the skeleton exists to give.
 */
export function PageEnter({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
