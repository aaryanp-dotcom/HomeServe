'use client'

import { useEffect, useState } from 'react'
import { animate, useMotionValue, useMotionValueEvent } from 'framer-motion'
import { useReducedMotion } from '@/components/motion/useReducedMotion'

/** Tweens between numeric values whenever `value` changes. */
export function CountUp({
  value,
  format,
  duration = 0.8,
  className,
}: {
  value: number
  format: (n: number) => string
  duration?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const [text, setText] = useState(() => format(value))

  useMotionValueEvent(mv, 'change', (v) => setText(format(v)))

  useEffect(() => {
    if (reduce) {
      mv.set(value)
      setText(format(value))
      return
    }
    const controls = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, reduce])

  return <span className={className}>{text}</span>
}
