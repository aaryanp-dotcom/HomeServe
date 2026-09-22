'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

/** Thin reading-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-cobalt-500 via-cobalt-300 to-brass-400"
      style={{ scaleX }}
    />
  )
}
