import Link from 'next/link'
import { ArrowRight, CheckCircle, Phone, MapPin } from 'lucide-react'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { JsonLd, breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from '@/lib/seo'

// ── Delhi NCR Service Page Template ──────────────────────────────────────────
// Used for /services/[slug] — each service gets its own data entry

export type ServiceData = {
  slug: string
  title: string
  metaDescription: string
  hero: {
    headline: string
    subheadline: string
    image: string
  }
  about: string
  includes: string[]
  process: { step: string; title: string; desc: string }[]
  pricing: {
    essential: string
    standard: string
    premium: string
    note: string
  }
  faq: { q: string; a: string }[]
  cities: string[]
}

interface Props {
  service: ServiceData
}

export function ServicePage({ service }: Props) {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: service.title, path: `/services/${service.slug}` }]),
          serviceJsonLd({ name: service.title, description: service.metaDescription, path: `/services/${service.slug}` }),
          faqJsonLd(service.faq),
        ]}
      />
      <MarketingNav />

      <main>
      {/* ── Hero ── */}
      <section className="relative min-h-[60vh] flex flex-col justify-end overflow-hidden bg-stone-950 pt-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={service.hero.image} alt={service.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-stone-950/10" />
        <div className="relative z-10 container-site pb-16 pt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/15 bg-white/8 text-white/75 text-xs font-medium mb-5 backdrop-blur-sm">
            <MapPin size={12} className="text-cobalt-400" />
            Delhi NCR Renovation Services
          </div>
          <h1 className="font-display text-4xl lg:text-[3.8rem] font-bold text-white tracking-[-0.03em] leading-[0.92] animate-fade-up mb-5 max-w-3xl">
            {service.hero.headline}
          </h1>
          <p className="text-lg text-stone-300 max-w-xl leading-relaxed mb-8">
            {service.hero.subheadline}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/get-started">
              <button className="coarse:min-h-11 flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 transition-colors">
                Start Your Renovation <ArrowRight size={16} />
              </button>
            </Link>
            <a href="tel:+911234567890" className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-white/80 border border-white/20 hover:border-white/40 transition-colors">
              <Phone size={15} /> Call Us
            </a>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="section bg-white">
        <div className="container-site max-w-3xl">
          <p className="label mb-3">{service.title}</p>
          <h2 className="text-3xl font-semibold text-stone-900 tracking-tight mb-5">What&apos;s included</h2>
          <p className="text-stone-600 leading-relaxed text-lg mb-8">{service.about}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {service.includes.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <CheckCircle size={16} className="text-cobalt-500 shrink-0 mt-0.5" />
                <span className="text-sm text-stone-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="section bg-stone-50">
        <div className="container-site">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="label mb-3">The process</p>
            <h2 className="text-3xl font-semibold text-stone-900 tracking-tight">How it works</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {service.process.map(({ step, title, desc }) => (
              <div key={step} className="p-6 border border-ink-900/15 bg-white">
                <div className="inline-flex items-center justify-center h-9 w-9 bg-cobalt-500 text-white text-sm font-bold mb-4">
                  {step}
                </div>
                <h3 className="text-sm font-semibold text-stone-900 mb-2">{title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="section bg-white">
        <div className="container-site max-w-3xl">
          <div className="mb-8">
            <p className="label mb-3">Delhi NCR indicative pricing</p>
            <h2 className="text-3xl font-semibold text-stone-900 tracking-tight mb-3">{service.title} cost in Delhi NCR</h2>
            <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-700">
              ⚠ These are indicative market ranges only. Final pricing is based on site inspection, measurements, scope and material selection.
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { tier: 'Essential', range: service.pricing.essential, desc: 'Basic materials, standard finish' },
              { tier: 'Standard', range: service.pricing.standard, desc: 'Mid-range materials, quality finish' },
              { tier: 'Premium', range: service.pricing.premium, desc: 'Premium materials, superior finish' },
            ].map(({ tier, range, desc }) => (
              <div key={tier} className="p-4 border border-ink-900/15 text-center">
                <p className="panel-title mb-2">{tier}</p>
                <p className="text-lg font-bold text-cobalt-600">{range}</p>
                <p className="text-xs text-stone-400 mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-stone-500">{service.pricing.note}</p>
        </div>
      </section>

      {/* ── Service areas ── */}
      <section className="section-sm bg-stone-50 border-y border-stone-100">
        <div className="container-site">
          <p className="label mb-3 text-center">Service areas</p>
          <h2 className="text-2xl font-semibold text-stone-900 tracking-tight text-center mb-6">
            {service.title} across Delhi NCR
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {service.cities.map((city) => (
              <div key={city} className="flex items-center gap-1.5 px-4 py-2 border border-stone-200 bg-white text-sm text-stone-600">
                <MapPin size={13} className="text-cobalt-500" />
                {city}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section bg-white">
        <div className="container-site max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="label mb-3">Common questions</p>
            <h2 className="text-3xl font-semibold text-stone-900 tracking-tight">FAQs</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {service.faq.map((item) => (
              <details key={item.q} className="group py-5 cursor-pointer">
                <summary className="flex items-center justify-between gap-4 text-stone-800 font-medium text-sm list-none select-none">
                  {item.q}
                  <ArrowRight size={14} className="shrink-0 text-stone-400 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-stone-500 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section-sm bg-cobalt-500">
        <div className="container-site">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                Ready to start your {service.title.toLowerCase()}?
              </h2>
              <p className="text-white/90 mt-1">
                Tell us about your project — we&apos;ll schedule a site visit and provide a detailed quotation.
              </p>
            </div>
            <Link href="/get-started">
              <button className="flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-white text-cobalt-600 hover:bg-cobalt-50 shadow-lg transition-colors whitespace-nowrap">
                Start Your Renovation <ArrowRight size={15} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </>
  )
}
