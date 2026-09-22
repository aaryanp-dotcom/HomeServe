'use client'

import { CountUp } from '@/components/motion/CountUp'

/**
 * Counts up to a numeric value. Non-numeric strings (e.g. "₹4.2L", "—") are
 * rendered as-is so callers can pass any pre-formatted value.
 */
export function AnimatedNumber({ value, className }: { value: string | number; className?: string }) {
  // Accepts numbers and strings like "126,000" or "₹1,26,000"; anything else is static.
  const m = typeof value === 'string' ? value.match(/^(\D*)(\d[\d,]*)(\D*)$/) : null
  const prefix = m?.[1] ?? ''
  const suffix = m?.[3] ?? ''
  const numeric = typeof value === 'number' ? value : m ? Number(m[2].replace(/,/g, '')) : null

  if (numeric === null) return <span className={className}>{value}</span>

  return (
    <CountUp
      className={className}
      value={numeric}
      duration={1}
      format={(n) => `${prefix}${Math.round(n).toLocaleString('en-IN')}${suffix}`}
    />
  )
}
