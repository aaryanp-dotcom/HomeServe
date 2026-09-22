import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServiceData, getAllServiceSlugs } from '@/lib/services/data'
import { ServicePage } from '@/components/services/ServicePage'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceData(slug)
  if (!service) return { title: 'Service Not Found' }
  return {
    title: `${service.title} in Delhi NCR — HomeServe`,
    description: service.metaDescription,
    keywords: [
      `${service.title.toLowerCase()} Delhi NCR`,
      `${service.title.toLowerCase()} Delhi`,
      `${service.title.toLowerCase()} Noida`,
      `${service.title.toLowerCase()} Gurugram`,
    ],
    alternates: { canonical: `/services/${slug}` },
    openGraph: { title: `${service.title} in Delhi NCR`, description: service.metaDescription, url: `/services/${slug}`, images: [{ url: service.hero.image }] },
  }
}

export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }))
}

export default async function ServiceSlugPage({ params }: Props) {
  const { slug } = await params
  const service = getServiceData(slug)
  if (!service) notFound()
  return <ServicePage service={service} />
}
