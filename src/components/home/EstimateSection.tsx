import { Reveal } from '@/components/motion/Reveal'
import { EstimateWidget } from './EstimateWidget'
import { SectionHeading } from './SectionHeading'
import { Hl } from './Hl'

export function EstimateSection() {
  return (
    <section id="estimate" className="bg-blueprint border-b-2 border-ink-900 py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(0,32rem)] lg:gap-24">
        <Reveal className="min-w-0">
          <SectionHeading
            index="A-01"
            eyebrow="Instant estimate"
            title={<>What will it <Hl>cost?</Hl></>}
            body="Pick a scope, a property size and a finish level. You get an indicative Delhi NCR range in a second — no phone number needed."
          />
          <ul className="mt-10 max-w-md divide-y divide-ink-900/20 border-y border-ink-900/20 font-mono text-xs uppercase tracking-[0.1em] text-ink-900">
            {['Based on Delhi NCR market bands', 'Final price only after a site visit', 'Itemised BOQ, no lump sums'].map((t, i) => (
              <li key={t} className="flex items-center gap-4 py-3.5">
                <span className="text-cobalt-500">0{i + 1}</span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="min-w-0">
          <EstimateWidget />
        </Reveal>
      </div>
    </section>
  )
}
