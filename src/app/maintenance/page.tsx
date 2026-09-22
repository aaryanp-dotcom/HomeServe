import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, MapPin, ShieldCheck, Wrench, BadgeCheck } from 'lucide-react'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { PlanWatermark } from '@/components/arch/PlanWatermark'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeading } from '@/components/home/SectionHeading'
import { CategoryIcon } from '@/components/maintenance/CategoryIcon'
import { getActiveServices, getActivePlans } from '@/lib/maintenance/data'
import { indicativePrice } from '@/lib/maintenance/format'
import { CATEGORY_META, WARRANTY_VS_MAINTENANCE } from '@/lib/maintenance/config'

export const metadata: Metadata = {
  title: 'Home Maintenance in Delhi NCR',
  description: 'Plumbing, electrical, carpentry, AC, pest control, cleaning, seepage inspection and more. Your home, looked after beyond renovation, across Delhi NCR.',
  alternates: { canonical: '/maintenance' },
  openGraph: { title: 'Home Maintenance in Delhi NCR', description: 'Book plumbing, electrical, carpentry, AC and other home maintenance services in Delhi NCR.', url: '/maintenance' },
}

const STEPS = [
  { t: 'Tell us what you need', b: 'Choose a service, pick your home, describe the problem and add photos if they help.' },
  { t: 'We confirm and schedule', b: 'HomeServe reviews your request, confirms it and books a visit at a time that works.' },
  { t: 'Our team visits', b: 'A HomeServe team member inspects, explains what is needed and does the work.' },
  { t: 'You confirm', b: 'You see the status at every step, and confirm when you are happy with the work.' },
]

export default async function MaintenancePage() {
  const [services, plans] = await Promise.all([getActiveServices(), getActivePlans()])

  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-paper-100 pt-20">
        <section className="section bg-blueprint relative overflow-hidden border-b-2 border-ink-900">
          <PlanWatermark />
          <div className="container-site relative max-w-3xl">
            <SheetTag code="M-01" title="Home maintenance" />
            <div className="mb-5 inline-flex items-center gap-2 border border-ink-900 bg-white px-3 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ink-900">
              <MapPin size={12} /> Delhi NCR
            </div>
            <h1 className="mb-4 font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-ink-900 lg:text-[3.6rem]">
              Your home, looked after beyond renovation.
            </h1>
            <p className="text-lg leading-relaxed text-stone-500">
              Repairs, servicing and check-ups for homes in Delhi, Noida, Greater Noida, Ghaziabad, Gurugram and Faridabad, booked directly with HomeServe. You do not need to have renovated with us.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/homeowner/maintenance/new" className="inline-flex h-12 items-center gap-2 bg-ink-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-cobalt-500">
                Request a service <ArrowRight size={15} />
              </Link>
              {plans.length > 0 && (
                <Link href="/maintenance/plans" className="inline-flex h-12 items-center gap-2 border-2 border-ink-900 px-6 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-white">
                  See membership plans
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container-site">
            <SectionHeading index="01" eyebrow="Services" title={<>Book what you need, <span className="text-cobalt-500">one visit at a time</span>.</>}
              body="Each service is booked on its own. Prices below are indicative and are confirmed after inspection." />
            {services.length === 0 ? (
              <p className="mt-10 border border-ink-900/15 bg-white p-6 text-stone-600">Our maintenance services are being set up. Please check back soon, or contact us.</p>
            ) : (
              <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s, i) => {
                  const price = indicativePrice(s)
                  return (
                    <Reveal key={s.id} delay={(i % 3) * 0.05} y={20}>
                      <Link href={`/maintenance/${s.slug}`} className="group flex h-full flex-col border-2 border-ink-900 bg-white p-5 transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard">
                        <div className="mb-4 flex items-start justify-between">
                          <span className="flex h-11 w-11 items-center justify-center bg-ink-900 text-white"><CategoryIcon category={s.category} size={20} /></span>
                          <ArrowUpRight size={18} className="text-ink-900/60 transition-colors group-hover:text-cobalt-500" />
                        </div>
                        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-cobalt-600">{CATEGORY_META[s.category].short}</p>
                        <h3 className="mt-1 font-display text-xl font-bold leading-tight tracking-[-0.02em] text-ink-900">{s.name}</h3>
                        <p className="mt-2 flex-1 text-sm leading-snug text-stone-500">{s.summary}</p>
                        <p className="mt-4 border-t border-ink-900/10 pt-3 text-sm font-medium text-ink-900">{price.text}</p>
                      </Link>
                    </Reveal>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section className="border-y-2 border-ink-900 bg-white py-16 lg:py-24">
          <div className="container-site">
            <SectionHeading index="02" eyebrow="How it works" title="From request to a job done." />
            <ol className="mt-12 grid gap-px border-2 border-ink-900 bg-ink-900 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.t} className="bg-paper-100 p-6">
                  <span className="font-mono text-xs text-cobalt-500">0{i + 1}</span>
                  <h3 className="mt-2 font-display text-lg font-bold tracking-[-0.02em] text-ink-900">{s.t}</h3>
                  <p className="mt-2 text-sm leading-snug text-stone-500">{s.b}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container-site">
            <SectionHeading index="03" eyebrow="Good to know" title="Warranty and maintenance are two different things." />
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                { icon: <ShieldCheck size={20} />, t: 'Renovation warranty', b: WARRANTY_VS_MAINTENANCE.warranty },
                { icon: <Wrench size={20} />, t: 'Home maintenance', b: WARRANTY_VS_MAINTENANCE.maintenance },
                { icon: <BadgeCheck size={20} />, t: 'Membership (optional)', b: WARRANTY_VS_MAINTENANCE.membership },
              ].map((c) => (
                <div key={c.t} className="border-2 border-ink-900 bg-white p-6">
                  <span className="flex h-10 w-10 items-center justify-center bg-cobalt-400 text-white">{c.icon}</span>
                  <h3 className="mt-4 font-display text-lg font-bold tracking-[-0.02em] text-ink-900">{c.t}</h3>
                  <p className="mt-2 text-sm leading-snug text-stone-600">{c.b}</p>
                </div>
              ))}
            </div>
            {plans.length > 0 && (
              <p className="mt-8 text-sm text-stone-600">
                Prefer regular care? <Link href="/maintenance/plans" className="font-medium text-cobalt-600 underline-offset-4 hover:underline">HomeServe memberships</Link> are optional and sit alongside one-off services.
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
