'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionHeading } from './SectionHeading'
import { Hl } from './Hl'

const ITEMS = [
  { q: 'Which areas in Delhi NCR do you serve?', a: 'We currently serve Delhi, Noida, Greater Noida, Ghaziabad, Gurugram and Faridabad. Contact us if your location is not listed.' },
  { q: 'How does milestone-based payment work?', a: 'Payments are released in stages tied to project milestones — typically advance, mid-project and completion. You only pay the next instalment when work reaches the agreed milestone.' },
  { q: 'Do I need to find separate contractors?', a: 'No. HomeServe provides the entire team — project manager, skilled labour, material procurement and site supervision. You deal with one company throughout.' },
  { q: 'How accurate is the online cost estimate?', a: 'The online estimator gives an indicative range based on property type, scope and quality level. Final pricing is provided only after a site visit and measurement, via a detailed quotation.' },
  { q: 'What warranty do you provide?', a: 'We provide warranty coverage on completed work. The exact duration and scope depends on the nature of work and is specified in your project agreement.' },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="bg-blueprint border-b-2 border-ink-900 py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-24">
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <SectionHeading index="A-06" eyebrow="General notes" title={<>Good to <Hl>know.</Hl></>} />
          <Link href="/faqs" className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink-900 hover:text-cobalt-600">
            View all FAQs <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="border-t-2 border-ink-900">
          {ITEMS.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className="border-b border-ink-900/30">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-start gap-5 py-6 text-left"
                >
                  <span className={cn('mt-1.5 font-mono text-xs', isOpen ? 'text-cobalt-500' : 'text-ink-900/60')}>
                    N-{String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 font-display text-[clamp(1.1rem,1.7vw,1.4rem)] font-semibold leading-snug tracking-[-0.015em] text-ink-900">
                    {item.q}
                  </span>
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center border-2 border-ink-900 transition-all duration-300',
                      isOpen ? 'bg-ink-900 text-white' : 'bg-white text-ink-900',
                    )}
                  >
                    <Plus size={16} className={cn('transition-transform duration-300', isOpen && 'rotate-45')} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-xl pb-7 pl-[3.25rem] text-base leading-snug text-ink-900/65">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
