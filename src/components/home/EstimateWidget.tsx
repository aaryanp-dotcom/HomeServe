'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CountUp } from '@/components/motion/CountUp'
import { ESTIMATOR_SCOPE_TO_LEAD, QUALITY_TIERS, SERVICE_BASE, calcEstimate, formatINR, type QualityTier } from '@/lib/estimate'
import { SizeInput } from '@/components/size/SizeInput'
import { DEFAULT_SIZE, computeSize, encodeSize, formatSqft, type SizeValue } from '@/lib/size'

const SCOPES = [
  { key: 'Full Home Renovation', label: 'Full home' },
  { key: 'Modular Kitchen', label: 'Kitchen' },
  { key: 'Bathroom Renovation', label: 'Bathroom' },
  { key: 'Painting', label: 'Painting' },
  { key: 'Flooring', label: 'Flooring' },
] as const

/** Square segmented control; the ink block glides between options. Shared with EstimateCalculator
 *  (the full /estimate page) so the two calculators don't visually drift apart from each other. */
export function Segmented<T extends string>({
  id, value, options, onChange, disabled, render,
}: {
  id: string
  value: T
  options: readonly T[]
  onChange: (v: T) => void
  disabled?: boolean
  render?: (v: T) => string
}) {
  return (
    <div
      role="radiogroup"
      className={cn('flex flex-wrap border-2 border-ink-900 bg-white transition-opacity', disabled && 'pointer-events-none opacity-35')}
    >
      {options.map((o) => {
        const active = o === value
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o)}
            className={cn(
              'relative min-h-11 flex-1 basis-[4.75rem] px-2 py-2.5 text-xs font-semibold transition-colors',
              active ? 'text-white' : 'text-ink-900 hover:bg-paper-100',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 bg-ink-900"
                transition={{ type: 'spring', stiffness: 480, damping: 38 }}
              />
            )}
            <span className="relative z-10">{render ? render(o) : o}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Instant estimate, styled as a drawing title block / spec sheet. */
export function EstimateWidget({ className }: { className?: string }) {
  const [scope, setScope] = useState<(typeof SCOPES)[number]['key']>('Full Home Renovation')
  const [size, setSize] = useState<SizeValue>(DEFAULT_SIZE)
  const [quality, setQuality] = useState<QualityTier>('Standard')

  const perUnit = SERVICE_BASE[scope].unit === 'fixed'
  const sizeRes = computeSize(size)
  const { low, high } = calcEstimate(scope, sizeRes.areaSqft, quality)
  const scopeLabel = SCOPES.find((s) => s.key === scope)!.label
  const hasSize = perUnit || sizeRes.areaSqft > 0
  const q = `quality=${quality}&lo=${low}&hi=${high}&scope=${ESTIMATOR_SCOPE_TO_LEAD[scope]}`
  const sizeQ = encodeSize(size)

  return (
    <div className={cn('w-full border-2 border-ink-900 bg-white shadow-hard-orange', className)}>
      <div className="flex items-center justify-between bg-ink-900 px-5 py-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-paper-100">
        <span>Cost plan · Indicative BOQ</span>
        <span className="flex items-center gap-2 text-paper-100/60">
          <span className="h-2 w-2 animate-pulse bg-cobalt-400" /> Delhi NCR rates
        </span>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-900/60">01 · Scope</p>
          <Segmented id="scope" value={scope} options={SCOPES.map((s) => s.key)} onChange={setScope}
            render={(k) => SCOPES.find((s) => s.key === k)!.label} />
        </div>
        <div className={cn('transition-opacity', perUnit && 'pointer-events-none opacity-35')}>
          <p className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-900/60">
            02 · Property size {perUnit && <span className="normal-case tracking-normal text-ink-900/60">— priced per unit</span>}
          </p>
          <SizeInput value={size} onChange={setSize} modes={['bhk_preset', 'total_area']} compact />
        </div>
        <div>
          <p className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-900/60">03 · Finish</p>
          <Segmented id="quality" value={quality} options={QUALITY_TIERS} onChange={setQuality} />
        </div>
      </div>

      <div className="border-t-2 border-ink-900 bg-paper-100 p-5 sm:p-6">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-900/60">
          {scopeLabel}{perUnit ? '' : hasSize ? ` · ${formatSqft(sizeRes.areaSqft)}` : ''} · {quality}
        </p>
        {hasSize ? (
          <p className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] font-bold leading-none tracking-[-0.03em] text-ink-900">
            <CountUp value={low} format={(n) => formatINR(Math.round(n))} />
            <span className="mx-2 text-cobalt-400">–</span>
            <CountUp value={high} format={(n) => formatINR(Math.round(n))} />
          </p>
        ) : (
          <p className="mt-2 font-display text-xl font-bold leading-tight text-ink-900/60">Enter your area to see a range</p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-ink-900/60">
          Indicative range. Your exact quote follows a free site visit and an itemised BOQ.
        </p>
        <Link
          href={`/get-started?${sizeQ}&${q}`}
          className="group mt-5 flex items-center justify-between bg-ink-900 py-3.5 pl-5 pr-3 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
        >
          Book a free site visit
          <span className="flex h-8 w-8 items-center justify-center bg-cobalt-400 transition-transform group-hover:translate-x-1">
            <ArrowRight size={16} />
          </span>
        </Link>
        <Link href={`/estimate?${sizeQ}&quality=${quality}&svc=${encodeURIComponent(scope)}`} className="mt-3 block text-center font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-900/60 transition-colors hover:text-ink-900">
          Room-by-room sizes & full calculator →
        </Link>
      </div>
    </div>
  )
}
