import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, MapPin, CheckCircle } from 'lucide-react'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { PlanWatermark } from '@/components/arch/PlanWatermark'
import { JsonLd, breadcrumbJsonLd } from '@/lib/seo'

const CITY_DATA: Record<string, {
  name: string
  fullName: string
  description: string
  areas: string[]
  snippet: string
}> = {
  'delhi': {
    name: 'Delhi',
    fullName: 'Delhi',
    description: 'Home renovation services across Delhi — South Delhi, North Delhi, East Delhi, West Delhi, Dwarka, Rohini, Lajpat Nagar, Vasant Kunj and all localities.',
    areas: ['South Delhi', 'North Delhi', 'Vasant Kunj', 'Lajpat Nagar', 'Dwarka', 'Rohini', 'Saket', 'Greater Kailash', 'Janakpuri', 'Pitampura'],
    snippet: 'Delhi',
  },
  'noida': {
    name: 'Noida',
    fullName: 'Noida',
    description: 'Home renovation services in Noida — Sector 50, Sector 62, Sector 137, Sector 143, Sector 150, Expressway sectors and all residential areas.',
    areas: ['Sector 50', 'Sector 62', 'Sector 78', 'Sector 100', 'Sector 119', 'Sector 137', 'Sector 143', 'Sector 150', 'Sector 168'],
    snippet: 'Noida',
  },
  'greater-noida': {
    name: 'Greater Noida',
    fullName: 'Greater Noida',
    description: 'Home renovation services in Greater Noida — Knowledge Park, Gamma, Delta, Omicron, Zeta sectors and all residential societies.',
    areas: ['Knowledge Park 1', 'Knowledge Park 2', 'Gamma 1 & 2', 'Delta 1 & 2', 'Omicron 1 & 2', 'Zeta 1 & 2', 'Alpha 1 & 2', 'Beta 1 & 2', 'Sector 1, 2, 3'],
    snippet: 'Greater Noida',
  },
  'ghaziabad': {
    name: 'Ghaziabad',
    fullName: 'Ghaziabad',
    description: 'Home renovation services in Ghaziabad — Indirapuram, Vaishali, Raj Nagar Extension, Crossings Republik and all localities.',
    areas: ['Indirapuram', 'Vaishali', 'Raj Nagar Extension', 'Crossings Republik', 'Kaushambi', 'Govindpuram', 'Pratap Vihar', 'Sahibabad', 'Loni'],
    snippet: 'Ghaziabad',
  },
  'gurugram': {
    name: 'Gurugram',
    fullName: 'Gurugram (Gurgaon)',
    description: 'Home renovation services in Gurugram — DLF Phases, Sohna Road, Golf Course Road, Sector 56, South City and all sectors.',
    areas: ['DLF Phase 1–5', 'Sector 56', 'Sector 57', 'South City 1 & 2', 'Golf Course Road', 'Sohna Road', 'Palam Vihar', 'Sector 82', 'Sector 89'],
    snippet: 'Gurugram',
  },
  'faridabad': {
    name: 'Faridabad',
    fullName: 'Faridabad',
    description: 'Home renovation services in Faridabad — NIT, Sector 15, Green Field Colony, Old Faridabad and all localities.',
    areas: ['NIT Faridabad', 'Sector 15', 'Sector 21C', 'Green Field Colony', 'Old Faridabad', 'BPTP Parklands', 'Neharpar', 'Escorts Colony'],
    snippet: 'Faridabad',
  },
}

const SERVICES = [
  'Full Home Renovation', 'Kitchen Renovation', 'Bathroom Renovation',
  'Painting', 'Flooring', 'False Ceiling', 'Electrical', 'Plumbing',
  'Carpentry & Wardrobes', 'Modular Kitchen', 'Civil Work',
]

interface Props {
  params: Promise<{ city: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params
  const data = CITY_DATA[city]
  if (!data) return { title: 'Location Not Found' }
  return {
    title: `Home Renovation in ${data.fullName} — HomeServe`,
    description: `HomeServe provides home renovation services in ${data.fullName}. We handle full home renovation, kitchen, bathroom, painting and all renovation work. Call for a free consultation.`,
    keywords: [
      `home renovation ${data.name}`,
      `${data.name} home renovation company`,
      `kitchen renovation ${data.name}`,
      `bathroom renovation ${data.name}`,
      `painting services ${data.name}`,
    ],
    alternates: { canonical: `/locations/${city}` },
    openGraph: { title: `Home Renovation in ${data.fullName}`, description: data.description, url: `/locations/${city}` },
  }
}

export function generateStaticParams() {
  return Object.keys(CITY_DATA).map((city) => ({ city }))
}

export default async function LocationPage({ params }: Props) {
  const { city } = await params
  const data = CITY_DATA[city]
  if (!data) notFound()

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: data.fullName, path: `/locations/${city}` }])} />
      <MarketingNav />
      <main className="min-h-screen bg-paper-100 pt-20">

        {/* Hero */}
        <section className="section bg-blueprint border-b-2 border-ink-900 relative overflow-hidden">
          <PlanWatermark />
          <div className="container-site max-w-3xl relative">
            <SheetTag code="A-15" title="Location" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-ink-900 bg-white text-ink-900 font-mono text-[0.6875rem] uppercase tracking-[0.12em] font-medium mb-5">
              <MapPin size={12} /> HomeServe · {data.fullName}
            </div>
            <h1 className="font-display text-4xl lg:text-[3.6rem] font-bold text-ink-900 tracking-[-0.03em] leading-[1.05] animate-fade-up mb-5">
              Home Renovation Services in {data.fullName}
            </h1>
            <p className="text-lg text-stone-500 leading-relaxed mb-8">{data.description}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/get-started">
                <button className="coarse:min-h-11 flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 transition-colors">
                  Start Your Renovation <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Services in this city */}
        <section className="section bg-white">
          <div className="container-site">
            <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-6">
              Our services in {data.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {SERVICES.map((s) => (
                <Link
                  key={s}
                  href={`/services/${s.toLowerCase().replace(/[&\s]+/g, '-').replace(/-+/g, '-')}`}
                  className="flex items-center gap-2.5 p-4 border border-ink-900/15 hover:border-cobalt-300 hover:bg-cobalt-50 transition-all group"
                >
                  <CheckCircle size={14} className="text-cobalt-400 group-hover:text-cobalt-600 shrink-0" />
                  <span className="text-sm font-medium text-stone-700 group-hover:text-cobalt-700">{s}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Areas */}
        <section className="section bg-stone-50">
          <div className="container-site max-w-3xl">
            <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-4">
              Areas we serve in {data.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.areas.map((area) => (
                <span key={area} className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 bg-white text-sm text-stone-600">
                  <MapPin size={12} className="text-cobalt-400" />
                  {area}
                </span>
              ))}
              <span className="flex items-center gap-1 px-3 py-1.5 text-sm text-cobalt-600 font-medium">
                + All localities in {data.name}
              </span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-sm bg-cobalt-500">
          <div className="container-site">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">
                  Planning a renovation in {data.fullName}?
                </h2>
                <p className="text-white/90 mt-1">
                  Submit your requirement and our team will contact you to schedule a site visit.
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
