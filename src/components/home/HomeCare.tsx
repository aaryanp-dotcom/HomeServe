import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeading } from './SectionHeading'
import { Hl } from './Hl'
import { CategoryIcon } from '@/components/maintenance/CategoryIcon'
import { CATEGORY_META, type MaintenanceCategory } from '@/lib/maintenance/config'

// Categories only — no counts, prices or coverage claims. What is actually bookable is
// decided by the maintenance catalogue in Admin.
const SHOWN: MaintenanceCategory[] = ['plumbing', 'electrical', 'ac_servicing', 'waterproofing_inspection', 'pest_control', 'home_inspection']

export function HomeCare() {
  return (
    <section className="border-b-2 border-ink-900 bg-white py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] items-start gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
        <Reveal>
          <SectionHeading
            index="05"
            eyebrow="Home maintenance"
            title={<>Your home, looked after <Hl>beyond</Hl> renovation.</>}
            body="Repairs, servicing and check-ups for homes across Delhi NCR, booked directly with HomeServe. Book one service at a time, whether or not we renovated your home."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/maintenance" className="inline-flex h-12 items-center gap-2 bg-ink-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-cobalt-500">
              Explore home maintenance <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="grid grid-cols-2 gap-px border-2 border-ink-900 bg-ink-900 sm:grid-cols-3">
            {SHOWN.map((c) => (
              <li key={c} className="bg-paper-100">
                <Link href={`/homeowner/maintenance/new?category=${c}`} className="group flex h-full flex-col gap-3 p-5 transition-colors hover:bg-white">
                  <CategoryIcon category={c} size={22} className="text-cobalt-500" />
                  <span className="font-display text-base font-bold leading-tight tracking-[-0.02em] text-ink-900">{CATEGORY_META[c].label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-mono text-[0.6875rem] uppercase tracking-wider text-ink-900/60">And more · Prices confirmed after inspection</p>
        </Reveal>
      </div>
    </section>
  )
}
