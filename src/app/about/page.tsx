import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { PlanWatermark } from '@/components/arch/PlanWatermark'
import { ArrowRight, CheckCircle, MapPin, Users, ShieldCheck, Wrench } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About HomeServe — Home Renovation Company in Delhi NCR',
  description: 'HomeServe is a trusted home renovation company in Delhi NCR. We manage your entire renovation — from consultation and design to execution and handover.',
  alternates: { canonical: '/about' },
  openGraph: { title: 'About HomeServe', description: 'A single accountable team managing your renovation from consultation to handover across Delhi NCR.', url: '/about' },
}

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Accountability',
    desc: 'One team is responsible for your project from start to finish. No subcontracting blame. No passing the buck.',
  },
  {
    icon: CheckCircle,
    title: 'Transparency',
    desc: 'Detailed, itemised quotations before work begins. You know exactly what you are getting and what you are paying for.',
  },
  {
    icon: Users,
    title: 'Customer-first',
    desc: 'Your home is important to you, so it is important to us. We work to your timeline, budget and quality expectations.',
  },
  {
    icon: Wrench,
    title: 'Craftsmanship',
    desc: 'Skilled labour, quality materials and proper site supervision at every stage of the project.',
  },
]

const NCR_AREAS = ['Delhi', 'Noida', 'Greater Noida', 'Ghaziabad', 'Gurugram', 'Faridabad']

export default function AboutPage() {
  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-paper-100 pt-20">

        {/* Hero */}
        <section className="py-20 lg:py-28 border-b-2 border-ink-900 bg-blueprint relative overflow-hidden">
          <PlanWatermark />
          <div className="container-site relative max-w-3xl">
            <SheetTag code="A-09" title="About" />
            <p className="text-xs font-semibold text-cobalt-600 uppercase tracking-wider mb-3">About HomeServe</p>
            <h1 className="font-display text-4xl lg:text-[3.6rem] font-bold text-ink-900 tracking-[-0.03em] leading-[1.05] animate-fade-up mb-5">
              A trusted home renovation<br />partner for Delhi NCR
            </h1>
            <p className="text-lg text-stone-500 leading-relaxed">
              HomeServe is a turnkey home renovation company. We manage your entire renovation — from initial consultation and design inspiration to project execution, final handover and after-sales support. One team, one point of contact, one accountability.
            </p>
          </div>
        </section>

        {/* What we do */}
        <section className="py-16 lg:py-20">
          <div className="container-site max-w-4xl">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-xs font-semibold text-cobalt-600 uppercase tracking-wider mb-2">What we do</p>
                <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-4">Full-service renovation management</h2>
                <p className="text-stone-600 leading-relaxed mb-4">
                  We are not a marketplace or a contractor directory. There is no comparison shopping or bidding. HomeServe is the company that does the work.
                </p>
                <p className="text-stone-600 leading-relaxed mb-4">
                  Our team visits your home, understands your requirements, prepares a transparent quotation, procures materials and executes the renovation under direct supervision. We handle every aspect of the project so you do not have to.
                </p>
                <p className="text-stone-600 leading-relaxed">
                  From a single room renovation to a complete home transformation, we approach every project with the same care and rigour.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  'Free site visit and consultation',
                  'Detailed, line-item quotations',
                  'Material procurement and quality control',
                  'Dedicated site supervision',
                  'Milestone-based payment structure',
                  'Regular progress updates',
                  'Final walkthrough and handover',
                  'Warranty and after-sales support',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle size={15} className="text-sage-500 shrink-0" />
                    <span className="text-sm text-stone-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-paper-100 border-y border-ink-900/20">
          <div className="container-site max-w-4xl">
            <p className="text-xs font-semibold text-cobalt-600 uppercase tracking-wider mb-2">Our principles</p>
            <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-10">What we stand for</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {VALUES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="h-10 w-10 bg-cobalt-50 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-cobalt-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 mb-1">{title}</h3>
                    <p className="text-sm text-stone-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service area */}
        <section className="py-16 lg:py-20">
          <div className="container-site max-w-4xl">
            <div className="flex items-start gap-3 mb-6">
              <MapPin size={20} className="text-cobalt-500 shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-2">Currently serving Delhi NCR</h2>
                <p className="text-stone-500">We currently operate across the following areas. More locations coming soon.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {NCR_AREAS.map((area) => (
                <Link
                  key={area}
                  href={`/locations/${area.toLowerCase().replace(/ /g, '-')}`}
                  className="px-4 py-2 border border-stone-200 text-sm text-stone-700 hover:border-cobalt-400 hover:text-cobalt-600 transition-all"
                >
                  {area}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-stone-900">
          <div className="container-site text-center max-w-2xl">
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-3">Planning a renovation in Delhi NCR?</h2>
            <p className="text-stone-300 mb-6">Tell us about your project and our team will be in touch within 24 hours.</p>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-cobalt-500 text-white text-sm font-semibold hover:bg-cobalt-400 transition-colors"
            >
              Start Your Renovation
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
