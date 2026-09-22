import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Check, X, Info } from 'lucide-react'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { CategoryIcon } from '@/components/maintenance/CategoryIcon'
import { getActivePlans, getActiveServices, getServiceBySlug } from '@/lib/maintenance/data'
import { indicativePrice } from '@/lib/maintenance/format'
import { CATEGORY_META, INDICATIVE_PRICE_NOTE, WARRANTY_VS_MAINTENANCE } from '@/lib/maintenance/config'
import { JsonLd, breadcrumbJsonLd, serviceJsonLd } from '@/lib/seo'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = await getServiceBySlug(params.slug)
  return s
    ? { title: `${s.name} in Delhi NCR`, description: s.summary, alternates: { canonical: `/maintenance/${params.slug}` }, openGraph: { title: `${s.name} — home maintenance in Delhi NCR`, description: s.summary, url: `/maintenance/${params.slug}` } }
    : { title: 'Home maintenance' }
}

export default async function MaintenanceServicePage({ params }: { params: { slug: string } }) {
  const [service, all, plans] = await Promise.all([getServiceBySlug(params.slug), getActiveServices(), getActivePlans()])
  if (!service) notFound()

  const price = indicativePrice(service)
  const memberPlans = plans.filter((p) => service.membership_eligible && p.eligible_categories.includes(service.category))
  const related = all.filter((s) => s.id !== service.id).slice(0, 3)

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Home maintenance', path: '/maintenance' }, { name: service.name, path: `/maintenance/${service.slug}` }]),
          serviceJsonLd({ name: service.name, description: service.summary, path: `/maintenance/${service.slug}` }),
        ]}
      />
      <MarketingNav />
      <main className="min-h-screen bg-paper-100 pt-20">
        <section className="section-sm bg-blueprint border-b-2 border-ink-900">
          <div className="container-site max-w-4xl">
            <SheetTag code="M-02" title={CATEGORY_META[service.category].label} />
            <div className="flex items-start gap-4">
              <span className="hidden h-14 w-14 shrink-0 items-center justify-center bg-ink-900 text-white sm:flex"><CategoryIcon category={service.category} size={26} /></span>
              <div>
                <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-ink-900 lg:text-5xl">{service.name}</h1>
                <p className="mt-3 max-w-2xl text-lg leading-relaxed text-stone-500">{service.summary}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 lg:py-20">
          <div className="container-site grid max-w-5xl gap-10 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-10">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink-900">What this involves</h2>
                <p className="mt-3 leading-relaxed text-stone-600">{service.description}</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="border-2 border-ink-900 bg-white p-5">
                  <h3 className="font-semibold text-ink-900">Included</h3>
                  <ul className="mt-3 space-y-2 text-sm text-stone-700">
                    {service.inclusions.map((i) => <li key={i} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-sage-700" />{i}</li>)}
                  </ul>
                </div>
                <div className="border-2 border-ink-900 bg-white p-5">
                  <h3 className="font-semibold text-ink-900">Not included</h3>
                  <ul className="mt-3 space-y-2 text-sm text-stone-700">
                    {service.exclusions.map((i) => <li key={i} className="flex gap-2"><X size={15} className="mt-0.5 shrink-0 text-rose-700" />{i}</li>)}
                  </ul>
                </div>
              </div>

              <p className="flex gap-2 border-l-4 border-cobalt-400 bg-white p-4 text-sm text-stone-600">
                <Info size={16} className="mt-0.5 shrink-0" />
                {WARRANTY_VS_MAINTENANCE.maintenance} Issues with work HomeServe did on your renovation are handled under <Link href="/homeowner/warranty" className="font-medium text-cobalt-600 underline-offset-4 hover:underline">warranty</Link> instead.
              </p>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="border-2 border-ink-900 bg-white p-6 shadow-hard">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-900/60">Indicative price</p>
                <p className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink-900">{price.text}</p>
                <p className="mt-2 text-xs leading-snug text-stone-500">{INDICATIVE_PRICE_NOTE}</p>
                {service.price_note && <p className="mt-2 text-xs text-stone-600">{service.price_note}</p>}
                <Link href={`/homeowner/maintenance/new?service=${service.slug}`} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 bg-ink-900 text-sm font-semibold text-white transition-colors hover:bg-cobalt-500">
                  Request this service <ArrowRight size={15} />
                </Link>
                <p className="mt-3 text-center text-xs text-stone-500">No payment to request. We confirm first.</p>
                {memberPlans.length > 0 && (
                  <p className="mt-4 border-t border-ink-900/10 pt-4 text-xs text-stone-600">
                    Members may get benefits on this service. <Link href="/maintenance/plans" className="font-medium text-cobalt-600 underline-offset-4 hover:underline">See plans</Link>. Booking without a membership is always possible.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </section>

        {related.length > 0 && (
          <section className="border-t-2 border-ink-900 bg-white py-12">
            <div className="container-site max-w-5xl">
              <h2 className="mb-5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-900/60">Other maintenance services</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.id} href={`/maintenance/${r.slug}`} className="flex items-center gap-3 border border-ink-900/15 p-4 transition-colors hover:border-ink-900">
                    <CategoryIcon category={r.category} size={18} className="text-cobalt-500" />
                    <span className="text-sm font-semibold text-ink-900">{r.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
