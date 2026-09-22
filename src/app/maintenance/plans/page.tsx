import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Minus, Info } from 'lucide-react'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { getActivePlans } from '@/lib/maintenance/data'
import {
  coveredCategoriesText, describePlanBenefits, describePlanLimits, planPriceText, planPurchasable,
} from '@/lib/maintenance/format'
import { WARRANTY_VS_MAINTENANCE } from '@/lib/maintenance/config'

export const metadata: Metadata = {
  title: 'Membership plans — Home maintenance in Delhi NCR',
  description: 'Optional HomeServe home-care memberships: regular inspections, member benefits and priority support for your home in Delhi NCR.',
  alternates: { canonical: '/maintenance/plans' },
  openGraph: { title: 'Home-care membership plans', description: 'Optional HomeServe memberships: regular inspections and member benefits for your home in Delhi NCR.', url: '/maintenance/plans' },
}

export default async function PlansPage() {
  const plans = await getActivePlans()

  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-paper-100 pt-20">
        <section className="section-sm bg-blueprint border-b-2 border-ink-900">
          <div className="container-site max-w-3xl">
            <SheetTag code="M-03" title="Membership" />
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-ink-900 lg:text-[3.4rem]">HomeServe home-care membership</h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              A membership is optional. It gives you regular check-ups and member benefits on eligible services. Every service can still be booked one at a time without one.
            </p>
          </div>
        </section>

        <section className="py-14 lg:py-20">
          <div className="container-site">
            {plans.length === 0 ? (
              <div className="mx-auto max-w-2xl border-2 border-ink-900 bg-white p-8 text-center">
                <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink-900">Membership plans are being finalised</h2>
                <p className="mt-3 text-stone-600">We are still setting the terms and pricing for HomeServe memberships. In the meantime you can book any maintenance service on its own.</p>
                <Link href="/maintenance" className="mt-6 inline-flex h-11 items-center bg-ink-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-cobalt-500">Browse maintenance services</Link>
              </div>
            ) : (
              <div className={`grid gap-5 ${plans.length >= 3 ? 'lg:grid-cols-3' : plans.length === 2 ? 'lg:grid-cols-2' : 'mx-auto max-w-xl'}`}>
                {plans.map((p) => {
                  const benefits = describePlanBenefits(p)
                  const limits = describePlanLimits(p)
                  const buyable = planPurchasable(p)
                  return (
                    <article key={p.id} className="flex flex-col border-2 border-ink-900 bg-white p-6">
                      <h2 className="font-mono text-[0.6875rem] font-normal uppercase tracking-[0.16em] text-cobalt-600">{p.name}</h2>
                      <p className="mt-1 text-sm text-stone-500">{p.tagline}</p>
                      <p className="mt-5 font-display text-3xl font-bold tracking-[-0.03em] text-ink-900">{planPriceText(p)}</p>
                      <p className="mt-1 text-xs text-stone-500">{p.term_months}-month term, paid up front. Does not renew automatically.</p>
                      {p.description && <p className="mt-4 text-sm leading-snug text-stone-600">{p.description}</p>}

                      <h3 className="mt-6 font-semibold text-ink-900">What you get</h3>
                      <ul className="mt-2 space-y-2 text-sm text-stone-700">
                        {benefits.length === 0
                          ? <li className="flex gap-2 text-stone-500"><Minus size={15} className="mt-0.5 shrink-0" />Benefit details are being finalised</li>
                          : benefits.map((b) => <li key={b} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-sage-700" />{b}</li>)}
                      </ul>

                      <h3 className="mt-6 font-semibold text-ink-900">Limits and exclusions</h3>
                      <ul className="mt-2 space-y-2 text-sm text-stone-600">
                        {limits.map((b) => <li key={b} className="flex gap-2"><Minus size={15} className="mt-0.5 shrink-0 text-stone-400" />{b}</li>)}
                      </ul>

                      <h3 className="mt-6 font-semibold text-ink-900">Applies to</h3>
                      <p className="mt-2 text-sm text-stone-600">{coveredCategoriesText(p)}</p>
                      {p.eligibility_notes && <p className="mt-2 text-xs text-stone-500">{p.eligibility_notes}</p>}

                      <div className="mt-auto pt-6">
                        {buyable ? (
                          <Link href={`/homeowner/membership/join?plan=${p.code}`} className="inline-flex h-12 w-full items-center justify-center bg-ink-900 text-sm font-semibold text-white transition-colors hover:bg-cobalt-500">
                            Choose {p.name}
                          </Link>
                        ) : (
                          <span className="inline-flex h-12 w-full items-center justify-center border-2 border-dashed border-ink-900/30 text-sm font-medium text-stone-500">Not available to buy yet</span>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            <div className="mx-auto mt-10 max-w-3xl space-y-3 text-sm text-stone-600">
              <p className="flex gap-2"><Info size={16} className="mt-0.5 shrink-0" />{WARRANTY_VS_MAINTENANCE.membership} {WARRANTY_VS_MAINTENANCE.warranty}</p>
              <p className="flex gap-2"><Info size={16} className="mt-0.5 shrink-0" />Membership benefits apply only to the services and limits listed on each plan. Anything outside them is charged as a normal service.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
