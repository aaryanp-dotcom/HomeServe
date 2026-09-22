'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'
import { useReducedMotion } from '@/components/motion/useReducedMotion'
import { ArrowUpRight, MoveHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionHeading } from './SectionHeading'
import { Hl } from './Hl'

const PROJECTS = [
  {
    label: 'Kitchen renovation', short: 'Kitchen', area: 'Sector 62, Noida', budget: '₹4–6L', duration: '3 weeks',
    before: 'https://images.unsplash.com/photo-1633536704679-de310869515b?w=1400&q=75',
    after: 'https://images.unsplash.com/photo-1755771984341-546c2a04f236?w=1400&q=80',
  },
  {
    label: 'Living room renovation', short: 'Living room', area: 'South Delhi', budget: '₹6–9L', duration: '4 weeks',
    before: 'https://images.unsplash.com/photo-1740989488591-55648f155236?w=1400&q=75',
    after: 'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=1400&q=80',
  },
]

export function BeforeAfter() {
  const [idx, setIdx] = useState(0)
  const [pos, setPos] = useState(50)
  const touched = useRef(false)
  const stage = useRef<HTMLDivElement>(null)
  const inView = useInView(stage, { once: true, amount: 0.5 })
  const reduce = useReducedMotion()
  const p = PROJECTS[idx]

  // One gentle sweep hints that the image is draggable; abandoned on first touch.
  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(0, 1, {
      duration: 2.6, ease: 'easeInOut', delay: 0.4,
      onUpdate: (t) => !touched.current && setPos(50 + 28 * Math.sin(t * Math.PI * 2)),
    })
    return () => c.stop()
  }, [inView, reduce])

  return (
    <section className="bg-blueprint border-b-2 border-ink-900 py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            index="A-04"
            eyebrow="Our work"
            title={<>See the <Hl>difference.</Hl></>}
            body="Drag the handle to compare each space — existing on the left, proposed on the right."
          />
          <div className="flex border-2 border-ink-900 bg-white">
            {PROJECTS.map((pr, i) => (
              <button
                key={pr.label}
                onClick={() => { setIdx(i); setPos(50); touched.current = true }}
                className={cn(
                  'px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors',
                  i === idx ? 'bg-ink-900 text-white' : 'text-ink-900 hover:bg-paper-100',
                )}
              >
                {pr.short}
              </button>
            ))}
          </div>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_19rem]">
          <div>
            <div ref={stage} className="relative aspect-[16/10] select-none overflow-hidden border-2 border-ink-900 bg-ink-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.after} alt={`${p.label} — proposed`} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
              <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.before} alt={`${p.label} — existing`} className="absolute inset-0 h-full w-full object-cover grayscale" draggable={false} />
              </div>

              <span className="absolute left-3 top-3 bg-ink-900 px-2.5 py-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider text-white">Existing</span>
              <span className="absolute right-3 top-3 bg-cobalt-400 px-2.5 py-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-900">Proposed</span>

              <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white" style={{ left: `${pos}%` }}>
                <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-ink-900 bg-cobalt-400 text-white">
                  <MoveHorizontal size={18} />
                </div>
              </div>

              <input
                type="range" min={0} max={100} step={0.1} value={pos}
                aria-label={`Compare existing and proposed: ${p.label}`}
                onChange={(e) => { touched.current = true; setPos(Number(e.target.value)) }}
                className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
                style={{ touchAction: 'pan-y' }}
              />
            </div>
            <p className="mt-3 font-mono text-[0.6875rem] uppercase tracking-widest text-ink-900/60">
              Fig. 2 — {p.label}, {p.area} (sample imagery)
            </p>
          </div>

          <div className="flex flex-col justify-between border-2 border-ink-900 bg-white p-6">
            <div>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-900/60">Project</p>
              <h3 className="mt-2 font-display text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-ink-900">{p.label}</h3>
              <p className="mt-1 text-sm text-ink-900/60">{p.area}</p>
            </div>
            <dl className="my-8 grid grid-cols-2 border-y-2 border-ink-900 py-5">
              <div>
                <dt className="font-mono text-[0.6875rem] uppercase tracking-widest text-ink-900/60">Budget</dt>
                <dd className="mt-1 font-display text-2xl font-bold tracking-[-0.02em] text-ink-900">{p.budget}</dd>
              </div>
              <div>
                <dt className="font-mono text-[0.6875rem] uppercase tracking-widest text-ink-900/60">Duration</dt>
                <dd className="mt-1 font-display text-2xl font-bold tracking-[-0.02em] text-ink-900">{p.duration}</dd>
              </div>
            </dl>
            <Link href="/projects" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 hover:text-cobalt-600">
              See all projects
              <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
