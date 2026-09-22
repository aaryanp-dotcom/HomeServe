import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, MapPin } from 'lucide-react'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { PlanWatermark } from '@/components/arch/PlanWatermark'
import { Reveal } from '@/components/motion/Reveal'

export const metadata: Metadata = {
  title: 'Home Renovation Services — Delhi NCR',
  description: 'Complete home renovation services in Delhi NCR — full home renovation, kitchen, bathroom, painting, flooring, false ceiling, electrical, plumbing and carpentry.',
  alternates: { canonical: '/services' },
  openGraph: { title: 'Home Renovation Services — Delhi NCR', description: 'Full home renovation, kitchen, bathroom, painting, flooring and more — one accountable team across Delhi NCR.', url: '/services' },
}

const SERVICES = [
  { slug: 'full-home-renovation', label: 'Full Home Renovation', desc: 'Complete renovation from planning to handover', image: 'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=400&q=80' },
  { slug: 'kitchen-renovation', label: 'Kitchen Renovation', desc: 'Complete kitchen remodelling and modular work', image: 'https://images.unsplash.com/photo-1755771984341-546c2a04f236?w=400&q=80' },
  { slug: 'bathroom-renovation', label: 'Bathroom Renovation', desc: 'Full bathroom remodelling including waterproofing', image: 'https://images.unsplash.com/photo-1789121274502-84fe89234993?w=400&q=80' },
  { slug: 'painting', label: 'Painting', desc: 'Interior and exterior painting', image: 'https://images.unsplash.com/photo-1787383274118-19be2f542e2b?w=400&q=80' },
  { slug: 'flooring', label: 'Flooring', desc: 'Tiles, marble and wooden flooring', image: 'https://images.unsplash.com/photo-1787390629829-abb32b3025c5?w=700&q=80' },
  { slug: 'false-ceiling', label: 'False Ceiling', desc: 'Gypsum, POP and wood false ceilings', image: 'https://images.unsplash.com/photo-1785232273548-4beae5334903?w=400&q=80' },
  { slug: 'electrical', label: 'Electrical Work', desc: 'Complete rewiring and electrical upgrades', image: 'https://images.unsplash.com/photo-1633604712918-6ab1173d0ecd?w=400&q=80' },
  { slug: 'plumbing', label: 'Plumbing', desc: 'Complete plumbing and sanitaryware', image: 'https://images.unsplash.com/photo-1789121274502-84fe89234993?w=400&q=80' },
  { slug: 'carpentry', label: 'Carpentry & Wardrobes', desc: 'Custom wardrobes, TV units and storage', image: 'https://images.unsplash.com/photo-1753185234794-e3b41b94a352?w=400&q=80' },
  { slug: 'modular-kitchen', label: 'Modular Kitchen', desc: 'Custom modular kitchen design and installation', image: 'https://images.unsplash.com/photo-1745429523635-ad375f836bf2?w=400&q=80' },
  { slug: 'living-room', label: 'Living Room', desc: 'Flooring, false ceiling, painting and furniture', image: 'https://images.unsplash.com/photo-1745429523637-60f5986cc1db?w=400&q=80' },
  { slug: 'bedroom', label: 'Bedroom', desc: 'Flooring, painting, wardrobes and lighting', image: 'https://images.unsplash.com/photo-1750420556288-d0e32a6f517b?w=400&q=80' },
  { slug: 'civil-work', label: 'Civil & Masonry Work', desc: 'Demolition, brick work and plastering', image: 'https://images.unsplash.com/photo-1577199001468-44c049e7603f?w=400&q=80' },
]

export default function ServicesPage() {
  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-paper-100 pt-20">

        <section className="section bg-blueprint border-b-2 border-ink-900 relative overflow-hidden">
          <PlanWatermark />
          <div className="container-site relative max-w-3xl">
            <SheetTag code="A-12" title="Services" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-ink-900 bg-white text-ink-900 font-mono text-[0.6875rem] uppercase tracking-[0.12em] font-medium mb-5">
              <MapPin size={12} /> Delhi NCR
            </div>
            <h1 className="font-display text-4xl lg:text-[3.6rem] font-bold text-ink-900 tracking-[-0.03em] leading-[1.05] animate-fade-up mb-4">
              Home Renovation Services in Delhi NCR
            </h1>
            <p className="text-lg text-stone-500 leading-relaxed">
              HomeServe manages your renovation from planning and design to execution and handover. One team, full accountability, across Delhi, Noida, Gurugram, Ghaziabad, Greater Noida and Faridabad.
            </p>
          </div>
        </section>

        <section className="bg-paper-100 py-16 lg:py-24">
          <div className="container-site">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {SERVICES.map(({ slug, label, desc, image }, i) => (
                <Reveal key={slug} delay={(i % 4) * 0.06} y={30}>
                  <Link
                    href={`/services/${slug}`}
                    className="group relative block aspect-[4/5] overflow-hidden border-2 border-ink-900 bg-ink-900"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.replace('w=400', 'w=800')}
                      alt={label}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-spring group-hover:scale-[1.07]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-transparent" />
                    <span className="absolute left-5 top-5 font-mono text-[0.6875rem] tracking-widest text-white/70">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center bg-cobalt-400 text-white transition-transform duration-300 group-hover:rotate-45">
                      <ArrowUpRight size={17} />
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h2 className="font-display text-[1.55rem] font-bold leading-[1.02] tracking-[-0.03em] text-white">{label}</h2>
                      <p className="mt-2 text-sm leading-snug text-white/70 sm:max-h-0 sm:translate-y-2 sm:opacity-0 sm:transition-all sm:duration-500 sm:ease-spring sm:group-hover:max-h-20 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                        {desc}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section-sm bg-cobalt-500">
          <div className="container-site text-center">
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-3">
              Not sure which service you need?
            </h2>
            <p className="text-white/90 mb-6">Tell us about your home and we will advise on the best approach.</p>
            <Link href="/get-started">
              <button className="flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-white text-cobalt-600 hover:bg-cobalt-50 shadow-lg transition-colors mx-auto">
                Start Your Renovation <ArrowRight size={15} />
              </button>
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
