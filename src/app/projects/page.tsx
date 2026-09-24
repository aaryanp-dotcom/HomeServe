import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, CheckCircle2, ShieldCheck, Ruler } from 'lucide-react'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { PlanWatermark } from '@/components/arch/PlanWatermark'
import { BeforeAfterSlider } from '@/components/shared/BeforeAfterSlider'

export const metadata: Metadata = {
  title: 'Our Projects & Case Studies — Delhi NCR Renovations',
  description: 'Interactive before and after renovation case studies across Delhi, Noida, and Gurugram. Transparent scopes, itemised pricing, and turnkey delivery.',
  alternates: { canonical: '/projects' },
  openGraph: {
    title: 'HomeServe Projects & Case Studies — Delhi NCR',
    description: 'Explore interactive before & after transformations delivered across Delhi NCR apartments and builder floors.',
    url: '/projects',
  },
}

const PROJECTS = [
  {
    id: 'full-home-south-delhi',
    title: '3BHK Turnkey Apartment Modernisation',
    location: 'Greater Kailash II, South Delhi',
    propertyType: '3BHK Builder Floor',
    area: '1,850 sq.ft.',
    scope: 'Complete civil demolition, Italian vitrified flooring, false ceiling with ambient cove lighting, custom modular kitchen, and 3 bathroom rebuilds.',
    themeStyle: 'Contemporary Indian',
    duration: '7 Weeks',
    budgetRange: '₹18–24L',
    before: 'https://images.unsplash.com/photo-1654028132164-a2ff2d88ea3e?w=900&q=75',
    after: 'https://images.unsplash.com/photo-1717140370275-7d847544b27b?w=900&q=80',
    keyHighlights: ['Custom pooja niche in brass & teak', 'Concealed CPVC plumbing overhaul', 'Anti-termite treated marine ply woodwork'],
  },
  {
    id: 'living-room-noida',
    title: 'Living & Dining Contemporary Revamp',
    location: 'Sector 50, Noida',
    propertyType: 'High-Rise Apartment',
    area: '480 sq.ft. (Living/Dining Zone)',
    scope: 'Acoustic TV feature wall with fluted louvres, concealed electrical wiring, designer false ceiling, and low-VOC Royale luxury emulsion.',
    themeStyle: 'Warm Minimalist',
    duration: '3.5 Weeks',
    budgetRange: '₹3.8–5.2L',
    before: 'https://images.unsplash.com/photo-1740989488591-55648f155236?w=900&q=75',
    after: 'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=900&q=80',
    keyHighlights: ['Automated dual-zone dimming', 'Concealed cabling ducts', 'PU finished console table'],
  },
  {
    id: 'modular-kitchen-gurgaon',
    title: 'Ergonomic Parallel Modular Kitchen Rebuild',
    location: 'DLF Phase 2, Gurugram',
    propertyType: '2BHK Apartment',
    area: '135 sq.ft.',
    scope: 'Complete removal of old granite slab, new dado anti-skid porcelain tiles, BWP marine plywood carcasses, Kaff chimney ducting, and soft-close Tandem boxes.',
    themeStyle: 'Modern Ergonomic',
    duration: '3 Weeks',
    budgetRange: '₹3.2–4.8L',
    before: 'https://images.unsplash.com/photo-1633536704679-de310869515b?w=900&q=75',
    after: 'https://images.unsplash.com/photo-1745429523635-ad375f836bf2?w=900&q=80',
    keyHighlights: ['Seamless quartz countertop', 'Under-cabinet task lights', 'Hafele hardware with 10-yr warranty'],
  },
]

export default function ProjectsPage() {
  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-paper-100 pt-20">

        {/* Hero Section */}
        <section className="section bg-blueprint border-b-2 border-ink-900 relative overflow-hidden">
          <PlanWatermark />
          <div className="container-site relative max-w-4xl">
            <SheetTag code="A-11" title="Real Transformations" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-ink-900 bg-white text-ink-900 font-mono text-[0.6875rem] uppercase tracking-[0.12em] font-medium mb-5">
              <MapPin size={12} /> Delhi NCR Verified Case Studies
            </div>
            <h1 className="font-display text-4xl lg:text-[3.6rem] font-bold text-ink-900 tracking-[-0.03em] leading-[1.05] animate-fade-up mb-4">
              Real Homes. Real Results.
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed max-w-2xl">
              Explore interactive split-screen transformations delivered across Delhi NCR apartments and builder floors. Drag the slider to compare existing conditions with our completed turnkey renovations.
            </p>
          </div>
        </section>

        {/* Interactive Case Studies Grid */}
        <section className="section bg-white border-b-2 border-ink-900">
          <div className="container-site">
            <div className="space-y-16">
              {PROJECTS.map((project, idx) => (
                <div
                  key={project.id}
                  className="grid lg:grid-cols-12 gap-8 items-start border-2 border-ink-900 bg-paper-50 p-6 sm:p-8"
                >
                  {/* Left Column: Interactive Before/After Slider */}
                  <div className="lg:col-span-7 space-y-3">
                    <BeforeAfterSlider
                      beforeImage={project.before}
                      afterImage={project.after}
                      beforeAlt={`${project.title} - existing condition`}
                      afterAlt={`${project.title} - finished renovation`}
                      aspectRatio="aspect-[16/10]"
                      beforeLabel="Existing"
                      afterLabel="Proposed / Completed"
                    />
                    <div className="flex items-center justify-between text-stone-500 font-mono text-[0.6875rem] uppercase tracking-wider px-1">
                      <span>Case Ref #{idx + 1}: {project.location}</span>
                      <span>Drag handle to compare</span>
                    </div>
                  </div>

                  {/* Right Column: Project Specifications & Scope */}
                  <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-ink-900 text-white font-mono text-xs font-semibold uppercase">
                          {project.propertyType}
                        </span>
                        <span className="px-2.5 py-1 bg-cobalt-100 text-cobalt-800 border border-cobalt-300 font-mono text-xs font-semibold">
                          {project.themeStyle}
                        </span>
                      </div>

                      <h2 className="font-display text-2xl font-bold text-ink-900 tracking-tight leading-snug mb-2">
                        {project.title}
                      </h2>
                      <p className="text-xs text-stone-500 font-mono mb-4 flex items-center gap-1.5">
                        <MapPin size={13} className="text-cobalt-600" /> {project.location} · {project.area}
                      </p>

                      <p className="text-sm text-stone-700 leading-relaxed mb-6">
                        {project.scope}
                      </p>

                      <div className="space-y-2 mb-6 border-t border-b border-stone-200 py-4">
                        <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-stone-500">
                          Key Deliverables
                        </p>
                        {project.keyHighlights.map((hl, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-stone-700">
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            <span>{hl}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between bg-white border border-ink-900/15 p-3">
                        <div>
                          <p className="font-mono text-[0.65rem] text-stone-400 uppercase">Indicative Budget</p>
                          <p className="text-base font-bold text-ink-900 font-mono">{project.budgetRange}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[0.65rem] text-stone-400 uppercase">Execution Time</p>
                          <p className="text-sm font-semibold text-stone-700 font-mono">{project.duration}</p>
                        </div>
                      </div>

                      <Link
                        href={`/get-started?source=project-${project.id}`}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-ink-900 text-white font-mono text-xs font-semibold uppercase tracking-wider hover:bg-cobalt-600 transition-colors"
                      >
                        Book Site Inspection for Similar Scope <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Callout banner */}
            <div className="mt-16 text-center p-8 border-2 border-ink-900 bg-blueprint relative overflow-hidden">
              <div className="max-w-2xl mx-auto space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-ink-900 text-xs font-mono font-semibold uppercase">
                  <ShieldCheck size={14} className="text-cobalt-600" /> Single-Point Turnkey Guarantee
                </div>
                <h3 className="font-display text-2xl font-bold text-ink-900">
                  Ready to transform your home with zero contractor hassle?
                </h3>
                <p className="text-sm text-stone-600">
                  Get a dedicated HomeServe project manager, transparent line-item BOQ, and milestone-linked execution across Delhi, Noida, Gurgaon, Ghaziabad, and Faridabad.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/get-started"
                    className="flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 transition-colors font-mono uppercase tracking-wider"
                  >
                    Start Your Renovation <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/estimate"
                    className="flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-white border-2 border-ink-900 text-ink-900 hover:bg-stone-50 transition-colors font-mono uppercase tracking-wider"
                  >
                    Calculate Renovation Cost <Ruler size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
