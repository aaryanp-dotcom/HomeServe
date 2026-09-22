import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { PlanWatermark } from '@/components/arch/PlanWatermark'

export const metadata: Metadata = {
  title: 'Our Projects — Delhi NCR',
  description: 'Completed home renovation projects by HomeServe across Delhi NCR. Before and after photos of kitchens, bathrooms, living rooms and full home renovations.',
  alternates: { canonical: '/projects' },
  openGraph: { title: 'HomeServe projects — Delhi NCR', description: 'Completed home renovation projects across Delhi NCR.', url: '/projects' },
}

const PROJECTS = [
  {
    id: '1',
    title: 'Full Home Renovation',
    location: 'South Delhi',
    type: '3BHK Apartment',
    scope: 'Full home renovation including kitchen, bathrooms, flooring and painting',
    before: 'https://images.unsplash.com/photo-1654028132164-a2ff2d88ea3e?w=700&q=75',
    after: 'https://images.unsplash.com/photo-1717140370275-7d847544b27b?w=700&q=80',
    budgetRange: '₹22–28L',
  },
  {
    id: '2',
    title: 'Living Room Renovation',
    location: 'Sector 50, Noida',
    type: '3BHK Apartment',
    scope: 'Living room — false ceiling, flooring, painting and TV wall unit',
    before: 'https://images.unsplash.com/photo-1740989488591-55648f155236?w=700&q=75',
    after: 'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=700&q=80',
    budgetRange: '₹3–5L',
  },
  {
    id: '3',
    title: 'Kitchen Renovation',
    location: 'DLF Phase 2, Gurugram',
    type: '2BHK Apartment',
    scope: 'Complete kitchen renovation — modular cabinets, quartz countertop, tiling, electrical',
    before: 'https://images.unsplash.com/photo-1633536704679-de310869515b?w=700&q=75',
    after: 'https://images.unsplash.com/photo-1745429523635-ad375f836bf2?w=700&q=80',
    budgetRange: '₹3.5–5L',
  },
]

export default function ProjectsPage() {
  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-paper-100 pt-20">

        <section className="section bg-blueprint border-b-2 border-ink-900 relative overflow-hidden">
          <PlanWatermark />
          <div className="container-site relative max-w-3xl">
            <SheetTag code="A-11" title="Projects" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-ink-900 bg-white text-ink-900 font-mono text-[0.6875rem] uppercase tracking-[0.12em] font-medium mb-5">
              <MapPin size={12} /> Delhi NCR
            </div>
            <h1 className="font-display text-4xl lg:text-[3.6rem] font-bold text-ink-900 tracking-[-0.03em] leading-[1.05] animate-fade-up mb-4">Our Projects</h1>
            <p className="text-lg text-stone-500 leading-relaxed">
              Before and after examples from renovation projects we have completed across Delhi NCR.
            </p>
          </div>
        </section>

        <section className="section bg-white">
          <div className="container-site">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PROJECTS.map((project) => (
                <div key={project.id} className="overflow-hidden border border-ink-900/15 bg-white">
                  <div className="grid grid-cols-2">
                    <div className="relative aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={project.before} alt="Before" className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 text-xs font-semibold text-white bg-black/60 px-2 py-0.5 rounded-md">Before</span>
                    </div>
                    <div className="relative aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={project.after} alt="After" className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 text-xs font-semibold text-white bg-cobalt-500/90 px-2 py-0.5 rounded-md">After</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="font-semibold text-stone-800">{project.title}</p>
                    <p className="text-xs text-stone-400">{project.location} · {project.type}</p>
                    <p className="text-xs text-stone-600">{project.scope}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-semibold text-cobalt-600">{project.budgetRange}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center p-8 border border-ink-900/15 bg-stone-50">
              <p className="text-stone-500 text-sm mb-4">More project case studies coming soon. Submit your renovation requirement and see what we can do for your home.</p>
              <Link href="/get-started">
                <button className="coarse:min-h-11 flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 transition-colors mx-auto">
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
