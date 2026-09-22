'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/components/motion/useReducedMotion'

/** Fades + lifts portal page content in on every navigation. */
export function PageEnter({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
