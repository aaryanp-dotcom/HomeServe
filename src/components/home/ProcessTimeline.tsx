'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { useReducedMotion } from '@/components/motion/useReducedMotion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionHeading } from './SectionHeading'
import { Hl } from './Hl'

const STEPS = [
  { title: 'Tell us what you need', desc: 'Share your property details, scope, budget and timeline online. It takes about three minutes.', tag: 'You · 3 min' },
  { title: 'Free site visit', desc: 'Our team visits, takes measurements and understands the space — at no charge and no obligation.', tag: 'Us · Free' },
  { title: 'Transparent quotation', desc: 'An itemised BOQ with material specifications. No hidden costs, no vague lump sums.', tag: 'Itemised BOQ' },
  { title: 'You approve the plan', desc: 'Review at your own pace. Ask questions or request changes before you commit to anything.', tag: 'Your call' },
  { title: 'We execute', desc: 'A supervised crew handles procurement, labour and quality control, with progress updates as work moves.', tag: 'Supervised' },
  { title: 'Handover & support', desc: 'Final walkthrough, snag resolution, documentation and warranty support after we hand over the keys.', tag: 'Warranty' },
]

export function ProcessTimeline() {
  const listRef = useRef<HTMLOListElement>(null)
  const [active, setActive] = useState(0)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 65%', 'end 55%'] })
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 })

  useEffect(() => {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-step]') ?? [])
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.step))),
      { rootMargin: '-45% 0px -45% 0px' },
    )
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section className="bg-blueprint-dark border-b-2 border-ink-900 py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,28rem)_1fr] lg:gap-24">
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <SectionHeading
            tone="dark"
            index="A-03"
            eyebrow="Construction sequence"
            title={<>From enquiry to <Hl>handover.</Hl></>}
            body="You tell us what you want. We handle everything between the first conversation and the final walkthrough."
          />
          <div className="mt-10 hidden items-end gap-4 lg:flex" aria-hidden>
            <div className="relative h-[6rem] w-[8rem] overflow-hidden">
              {STEPS.map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute inset-0 font-display text-[6.5rem] font-bold leading-none tracking-[-0.03em] text-cobalt-400"
                  animate={{ y: `${(i - active) * 100}%`, opacity: i === active ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  {String(i + 1).padStart(2, '0')}
                </motion.span>
              ))}
            </div>
            <span className="mb-3 font-mono text-sm uppercase tracking-widest text-paper-100/60">/ 06</span>
          </div>
          <Link
            href="/get-started"
            className="group mt-10 inline-flex items-center gap-3 bg-paper-100 py-4 pl-6 pr-4 text-sm font-semibold text-ink-900 transition-colors hover:bg-white"
          >
            Start your renovation
            <span className="flex h-8 w-8 items-center justify-center bg-cobalt-400 text-white transition-transform group-hover:translate-x-1">
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>

        <ol ref={listRef} className="relative pl-9 sm:pl-14">
          <span aria-hidden className="absolute bottom-0 left-[0.55rem] top-0 w-px bg-paper-100/20 sm:left-[1.1rem]" />
          <motion.span
            aria-hidden
            className="absolute bottom-0 left-[0.55rem] top-0 w-[3px] origin-top -translate-x-[1px] bg-cobalt-400 sm:left-[1.1rem]"
            style={{ scaleY: line }}
          />
          {STEPS.map((s, i) => {
            const on = i <= active
            return (
              <li key={s.title} data-step={i} className="relative">
                <span
                  aria-hidden
                  className={cn(
                    'absolute -left-9 top-8 flex h-6 w-6 items-center justify-center border-2 font-mono text-[0.6875rem] font-semibold transition-all duration-500 sm:-left-14 sm:h-8 sm:w-8 sm:text-xs',
                    on ? 'border-cobalt-400 bg-cobalt-400 text-white' : 'border-paper-100/25 bg-ink-950 text-paper-100/60',
                  )}
                >
                  {i + 1}
                </span>
                <div
                  className={cn(
                    'border-t border-paper-100/20 py-8 transition-opacity duration-500 sm:py-10',
                    i === active ? 'opacity-100' : 'opacity-35',
                  )}
                >
                  <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-cobalt-300">Stage {String(i + 1).padStart(2, '0')} · {s.tag}</span>
                  <h3
                    className="mt-2 font-display text-[clamp(1.5rem,2.4vw,2.1rem)] font-bold leading-[1.08] tracking-[-0.02em] text-paper-100"
                    
                  >
                    {s.title}
                  </h3>
                  <p className="mt-3 max-w-md text-base leading-snug text-paper-100/60">{s.desc}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
