'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

/**
 * framer-motion reads the OS "reduce motion" setting only in the browser, so on the very first
 * client render it disagrees with the server HTML and React logs a hydration mismatch (and can flash
 * content) for anyone who has reduced motion turned on. This reports `false` until the component has
 * mounted, then the real preference, so server and first client render always match.
 */
export function useReducedMotion(): boolean {
  const pref = useFramerReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && !!pref
}
