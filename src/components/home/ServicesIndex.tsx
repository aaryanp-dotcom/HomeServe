'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeading } from './SectionHeading'
import { Hl } from './Hl'

const SERVICES = [
  { label: 'Full Home Renovation', tag: 'Turnkey', desc: 'End-to-end planning, design and execution under one roof.', href: '/services/full-home-renovation', img: 'photo-1682662046457-74fd5b199b92' },
  { label: 'Kitchen', tag: 'Modular · Civil', desc: 'Modular kitchens, cabinetry and the civil work behind them.', href: '/services/kitchen-renovation', img: 'photo-1755771984341-546c2a04f236' },
  { label: 'Bathroom', tag: 'Wet area', desc: 'Tiles, fittings and waterproofing done in the right order.', href: '/services/bathroom-renovation', img: 'photo-1789121274502-84fe89234993' },
  { label: 'Painting', tag: 'Interior · Exterior', desc: 'Prep, primer and premium finishes, room by room.', href: '/services/painting', img: 'photo-1787383274118-19be2f542e2b' },
  { label: 'Flooring', tag: 'Tile · Marble · Wood', desc: 'Vitrified, marble, hardwood and vinyl, laid to level.', href: '/services/flooring', img: 'photo-1787390629829-abb32b3025c5' },
  { label: 'False Ceiling', tag: 'Gypsum · POP', desc: 'Gypsum, POP and wooden ceilings with concealed lighting.', href: '/services/false-ceiling', img: 'photo-1598928506311-c55ded91a20c' },
  { label: 'Carpentry & Wardrobes', tag: 'Custom', desc: 'Wardrobes, TV units and storage built to measure.', href: '/services/carpentry', img: 'photo-1753185234794-e3b41b94a352' },
  { label: 'Electrical', tag: 'Wiring · Panels', desc: 'Rewiring, panels, fixtures and safe upgrades.', href: '/services/electrical', img: 'photo-1621905252507-b35492cc74b4' },
]

/** "Schedule of works": an index of trades; hovering a row previews it. */
export function ServicesIndex() {
  const [active, setActive] = useState(0)
  const a = SERVICES[active]

  return (
    <section className="border-b-2 border-ink-900 bg-paper-100 py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            index="A-02"
            eyebrow="Schedule of works"
            title={<>Every room, <Hl>handled.</Hl></>}
            body="Pick a single trade or hand us the whole home. Either way: one team, one plan, one quote."
          />
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 border-2 border-ink-900 px-5 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-white"
          >
            All services
            <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div>
          <div className="grid grid-cols-[3rem_1fr_auto] gap-x-6 border-t-2 border-ink-900 pb-2 pt-3 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-900/60 sm:grid-cols-[3.5rem_1fr_9rem_1.5rem]">
            <span>Mark</span><span>Item</span><span className="hidden sm:block">Type</span><span />
          </div>
          <ol className="border-t border-ink-900/40" onMouseLeave={() => setActive(0)}>
            {SERVICES.map((s, i) => {
              const on = i === active
              return (
                <li key={s.label} className="border-b border-ink-900/25">
                  <Reveal delay={i * 0.03} y={14}>
                    <Link
                      href={s.href}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className={cn(
                        'group relative flex items-center gap-4 py-4 pl-1 pr-3 transition-all duration-300 sm:gap-6 sm:py-5',
                        on ? 'bg-ink-900 pl-4 text-paper-100 sm:pl-6' : 'text-ink-900',
                      )}
                    >
                      <span className={cn('w-10 shrink-0 font-mono text-xs', on ? 'text-cobalt-400' : 'text-ink-900/60')}>
                        W-{String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="flex-1 font-display text-[clamp(1.35rem,2.4vw,2.05rem)] font-bold leading-none tracking-[-0.02em]"
                        
                      >
                        {s.label}
                      </span>
                      <span className={cn('hidden font-mono text-[0.6875rem] uppercase tracking-[0.12em] sm:block', on ? 'text-paper-100/60' : 'text-ink-900/60')}>
                        {s.tag}
                      </span>
                      <ArrowUpRight
                        size={22}
                        className={cn('shrink-0 transition-all duration-300', on ? 'text-cobalt-400' : 'text-ink-900/60 group-hover:text-ink-900')}
                      />
                    </Link>
                  </Reveal>
                </li>
              )
            })}
          </ol>
          </div>

          {/* Preview panel */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <div className="relative aspect-[4/5] overflow-hidden border-2 border-ink-900 bg-ink-900">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={a.img}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://images.unsplash.com/${a.img}?w=900&q=80`} alt={a.label} className="h-full w-full object-cover" />
                  </motion.div>
                </AnimatePresence>
                <span className="absolute left-3 top-3 bg-cobalt-400 px-2 py-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-900">
                  {String(active + 1).padStart(2, '0')} / {String(SERVICES.length).padStart(2, '0')}
                </span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-snug text-ink-900/70">{a.desc}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
