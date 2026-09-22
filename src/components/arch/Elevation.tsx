'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from '@/components/motion/useReducedMotion'

const D = [
  'M20 250H620',                                    // ground line
  'M70 250V110H430V250', 'M50 110H450',             // main block + parapet
  'M430 250V150H560V250',                           // wing
  'M100 150H160V190H100Z', 'M200 150H260V190H200Z', 'M300 150H360V190H300Z', // windows (upper)
  'M100 205H160V250', 'M300 205H360V250',           // windows (lower)
  'M200 205H260V250H200Z', 'M230 205V250',          // entrance
  'M470 185H520V250',                               // wing door
  'M70 110L250 60L430 110',                         // roof line
  'M470 130H520',
]

/** Line-art building elevation that draws itself when scrolled into view. */
export function Elevation({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 640 290" className={className} aria-hidden fill="none" stroke="#111" strokeWidth={2} strokeLinecap="square">
      {D.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          initial={reduce ? false : { pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.1, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      <path d="M40 274H600M40 268V280M600 268V280" strokeWidth={1} opacity={0.6} />
      <text x={320} y={289} fontSize={10} textAnchor="middle" fill="#111" stroke="none" opacity={0.7}
        style={{ fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.1em' }}>SOUTH ELEVATION · 1:100</text>
    </svg>
  )
}
