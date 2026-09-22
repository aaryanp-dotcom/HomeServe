'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/components/motion/useReducedMotion'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  /** Fraction of the element that must be visible before it animates in. */
  amount?: number
}

/** Fades + lifts content into view once as it scrolls on screen. */
export function Reveal({ children, className, delay = 0, y = 28, amount = 0.2 }: RevealProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Headline that rises word by word. Wrap italic/serif emphasis in <em>. */
export function SplitWords({
  text,
  className,
  delay = 0,
  emphasisFrom,
}: {
  text: string
  className?: string
  delay?: number
  /** Index of the first word that should render in the italic serif accent. */
  emphasisFrom?: number
}) {
  const reduce = useReducedMotion()
  const words = text.split(' ')

  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]" aria-hidden>
          <motion.span
            className={
              'inline-block ' +
              (emphasisFrom !== undefined && i >= emphasisFrom ? 'italic text-cream-200' : '')
            }
            initial={reduce ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : delay + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
