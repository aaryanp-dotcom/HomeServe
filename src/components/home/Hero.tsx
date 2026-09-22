'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/components/motion/useReducedMotion'
import { ArrowRight } from 'lucide-react'
import { FloorPlan } from '@/components/arch/FloorPlan'

const EASE = [0.16, 1, 0.3, 1] as const

const SPECS = [
  ['01', 'Free site visit'],
  ['02', 'Itemised BOQ'],
  ['03', 'Milestone pay'],
  ['04', 'Site supervisor'],
]

/** A headline line that rises out of a mask. */
function Line({ children, delay }: { children: React.ReactNode; delay: number }) {
  const reduce = useReducedMotion()
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block"
        initial={reduce ? false : { y: '105%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  )
}

export function Hero() {
  const reduce = useReducedMotion()
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  })

  return (
    <section className="bg-blueprint relative overflow-hidden border-b-2 border-ink-900 pt-24 lg:pt-28">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-14 sm:px-8 lg:grid-cols-[0.92fr_1.13fr] lg:gap-12">
        {/* Copy */}
        <div className="flex flex-col justify-between">
          <div>
            <motion.p
              {...fade(0.1)}
              className="mb-6 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-900/60"
            >
              [ Delhi NCR · Architecture &amp; turnkey renovation ]
            </motion.p>

            <h1 className="font-display font-bold leading-[0.98] tracking-[-0.03em] text-ink-900" style={{ fontSize: 'clamp(2.5rem, 5.6vw, 5rem)' }}>
              <Line delay={0.2}>Renovation,</Line>
              <span className="block pb-[0.08em]">
                <Line delay={0.3}>
                  done{' '}
                  <span className="relative inline-block overflow-hidden align-bottom">
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 origin-left bg-cobalt-400"
                      initial={reduce ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.85, ease: EASE }}
                    />
                    <span className="relative block px-[0.14em] text-white">properly.</span>
                  </span>
                </Line>
              </span>
            </h1>

            <motion.p {...fade(0.95)} className="mt-7 max-w-md text-lg leading-snug text-ink-900/70">
              One team from first sketch to final snag. Measured drawings, itemised quotes, milestone
              payments and a supervisor on your site every day.
            </motion.p>
          </div>

          <div>
            <motion.div {...fade(1.05)} className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/get-started"
                className="group inline-flex items-center gap-3 bg-ink-900 py-4 pl-6 pr-4 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
              >
                Start your renovation
                <span className="flex h-8 w-8 items-center justify-center bg-cobalt-400 text-white transition-transform group-hover:translate-x-1">
                  <ArrowRight size={16} />
                </span>
              </Link>
              <a
                href="#estimate"
                className="border-2 border-ink-900 px-6 py-[0.85rem] text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-white"
              >
                See the cost first
              </a>
            </motion.div>

            <motion.dl
              {...fade(1.2)}
              className="mt-12 grid grid-cols-2 border-t-2 border-ink-900 font-mono text-[0.6875rem] uppercase tracking-[0.12em] md:grid-cols-4"
            >
              {SPECS.map(([n, t]) => (
                <div key={n} className="border-b border-r border-ink-900/25 py-4 pr-3 md:last:border-r-0">
                  <dt className="text-cobalt-500">{n}</dt>
                  <dd className="mt-1 font-semibold text-ink-900">{t}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </div>

        {/* Drawing sheet */}
        <motion.figure
          {...fade(0.3)}
          className="relative mx-auto w-full max-w-[46rem] self-center border-2 border-ink-900 bg-white shadow-hard"
        >
          <div className="flex items-center justify-between border-b-2 border-ink-900 bg-ink-900 px-4 py-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-paper-100">
            <span>Sheet A-01 · Ground floor plan</span>
            <span className="text-paper-100/60">Existing → Proposed</span>
          </div>

          <div className="relative p-3 sm:p-5">
            <FloorPlan className="h-auto w-full" />

            {/* inset photographic view */}
            <div className="absolute bottom-3 right-3 hidden w-[10rem] border-2 border-ink-900 bg-ink-900 sm:block lg:bottom-5 lg:right-5 lg:w-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=500&q=80"
                alt="Completed living room"
                className="aspect-[4/3] w-full object-cover"
              />
              <span className="absolute -top-2.5 left-2 bg-cobalt-400 px-1.5 py-0.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-900">
                View A
              </span>
            </div>
          </div>

          <figcaption className="grid grid-cols-3 border-t-2 border-ink-900 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-900/70 sm:text-[0.6875rem]">
            {[['Project', '3 BHK · Noida'], ['Scale', '1 : 50'], ['Status', 'Sample drawing']].map(([k, v], i) => (
              <div key={k} className={i < 2 ? 'border-r border-ink-900/30 px-3 py-2' : 'px-3 py-2'}>
                <span className="block text-cobalt-500">{k}</span>
                <span className="font-semibold text-ink-900">{v}</span>
              </div>
            ))}
          </figcaption>
        </motion.figure>
      </div>

      {/* structural grid markers */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[3.7rem] hidden lg:block">
        {[['A', '3%'], ['B', '52%'], ['C', '97%']].map(([l, x]) => (
          <span
            key={l}
            className="absolute flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-ink-900/50 bg-paper-100 font-mono text-[0.6875rem] font-semibold text-ink-900/70"
            style={{ left: x }}
          >
            {l}
          </span>
        ))}
      </div>
    </section>
  )
}
