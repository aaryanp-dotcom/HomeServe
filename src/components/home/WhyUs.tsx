'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeading } from './SectionHeading'
import { Hl } from './Hl'

const TRUST = [
  { icon: ShieldCheck, title: 'One accountable team', desc: 'A single point of contact from consultation to completion. No sub-contractor surprises.' },
  { icon: CheckCircle2, title: 'Transparent quotation', desc: 'A line-item BOQ, so you know exactly what you are paying for before work begins.' },
  { icon: Clock, title: 'Milestone payments', desc: 'You pay in stages tied to real progress — never the full amount upfront.' },
  { icon: Wrench, title: 'Supervised execution', desc: 'A dedicated site supervisor on every project, checking quality at every stage.' },
]

const STAGES = [
  { label: 'Advance', pct: 30, note: 'Released when you approve the quotation and we mobilise.', bg: 'bg-ink-900 text-white' },
  { label: 'Mid-project', pct: 40, note: 'Due when civil and carpentry reach the agreed mid-stage.', bg: 'bg-cobalt-500 text-white' },
  { label: 'Handover', pct: 30, note: 'Paid only after the final walkthrough and snag resolution.', bg: 'bg-paper-200 bg-hatch text-ink-900' },
]

function MilestoneVisual() {
  const [hover, setHover] = useState(0)
  return (
    <div className="border-2 border-ink-900 bg-white p-6 shadow-hard sm:p-8">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-900/60">How you pay</p>
      <p className="mt-2 font-display text-[1.6rem] font-bold leading-tight tracking-[-0.02em] text-ink-900">Money follows progress.</p>

      <div className="mt-7 flex h-14 border-2 border-ink-900" onMouseLeave={() => setHover(0)}>
        {STAGES.map((s, i) => (
          <motion.button
            key={s.label}
            type="button"
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ flexGrow: s.pct, originX: 0 }}
            className={cn(
              'flex items-center justify-center border-r-2 border-ink-900 font-mono text-sm font-bold last:border-r-0 transition-opacity duration-300',
              s.bg,
              hover === i ? 'opacity-100' : 'opacity-75',
            )}
          >
            {s.pct}%
          </motion.button>
        ))}
      </div>

      <div className="mt-6 min-h-[5.5rem] border-l-4 border-cobalt-400 bg-paper-100 p-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-900">{STAGES[hover].label}</p>
        <p className="mt-1.5 text-sm leading-snug text-ink-900/65">{STAGES[hover].note}</p>
      </div>
      <p className="mt-4 font-mono text-[0.6875rem] uppercase tracking-wider text-ink-900/60">Typical split · exact schedule is in your quotation</p>
    </div>
  )
}

export function WhyUs() {
  return (
    <section className="border-b-2 border-ink-900 bg-paper-100 py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:gap-24">
        <Reveal className="order-last lg:order-first">
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden border-2 border-ink-900 bg-ink-900 sm:aspect-[4/3] lg:aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1577199001468-44c049e7603f?w=1100&q=80"
                alt="A finished home by HomeServe"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="mt-6 lg:relative lg:z-10 lg:-mt-28 lg:ml-10 lg:mr-[-3rem]">
              <MilestoneVisual />
            </div>
          </div>
        </Reveal>

        <div>
          <SectionHeading
            index="A-05"
            eyebrow="Why HomeServe"
            title={<>One team. <Hl>Full accountability.</Hl></>}
            body="No fragmented contractors and no coordination headaches. We manage your renovation under one roof, from the first sketch to the last snag."
          />
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {TRUST.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div className="group border-t-2 border-ink-900 pt-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center bg-ink-900 text-white transition-colors duration-300 group-hover:bg-cobalt-400">
                      <Icon size={20} />
                    </span>
                    <span className="font-mono text-xs text-ink-900/60">0{i + 1}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold tracking-[-0.03em] text-ink-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-snug text-ink-900/65">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Link
            href="/get-started"
            className="group mt-12 inline-flex items-center gap-3 bg-ink-900 py-4 pl-6 pr-4 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
          >
            Start your renovation
            <span className="flex h-8 w-8 items-center justify-center bg-cobalt-400 transition-transform group-hover:translate-x-1">
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
