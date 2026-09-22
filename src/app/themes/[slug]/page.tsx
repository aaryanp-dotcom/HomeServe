import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ThemeDetailClient from '@/components/themes/ThemeDetailClient'
import { THEMES, getThemeBySlug } from '@/lib/themes/data'

interface Props { params: { slug: string } }

export function generateStaticParams() {
  return THEMES.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const theme = getThemeBySlug(params.slug)
  if (!theme) return { title: 'Theme not found' }
  return {
    title: `${theme.name} interior design — ideas, colours & budget`,
    description: theme.description || `${theme.tagline}. Room-by-room inspiration, colour palette, materials and indicative budget for a ${theme.name} home in Delhi NCR.`,
    alternates: { canonical: `/themes/${theme.slug}` },
    openGraph: { title: `${theme.name} interior design`, description: theme.tagline, url: `/themes/${theme.slug}`, images: [{ url: theme.coverImage }] },
  }
}

export default function ThemeDetailPage({ params }: Props) {
  if (!getThemeBySlug(params.slug)) notFound()
  return <ThemeDetailClient slug={params.slug} />
}
