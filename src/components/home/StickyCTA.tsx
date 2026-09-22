'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Phone } from 'lucide-react'

/** Mobile-only bottom bar that appears once the hero has scrolled away. */
export function StickyCTA() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.85)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-3 bottom-3 z-50 flex items-stretch gap-1 border-2 border-ink-900 bg-ink-900 shadow-hard-orange md:hidden"
        >
          <Link href="/get-started" className="flex h-12 flex-1 items-center justify-center gap-2 text-sm font-semibold text-white">
            Free site visit <ArrowRight size={15} />
          </Link>
          <a href="tel:+911234567890" aria-label="Call HomeServe" className="flex h-12 w-12 items-center justify-center bg-cobalt-400 text-white">
            <Phone size={17} />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
