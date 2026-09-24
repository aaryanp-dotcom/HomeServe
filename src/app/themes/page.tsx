import type { Metadata } from 'next'
import { Suspense } from 'react'
import ThemesGalleryClient from '@/components/themes/ThemesGalleryClient'
import { THEMES } from '@/lib/themes/data'
import { getThemeSaveCounts } from '@/lib/themes/saves'

export const metadata: Metadata = {
  title: 'Interior design themes & inspiration — Delhi NCR',
  description: `Browse ${THEMES.length} curated interior design themes — Scandinavian, Japandi, contemporary Indian and more — with room-by-room galleries, colour palettes and indicative budgets.`,
  alternates: { canonical: '/themes' },
  openGraph: { title: 'Interior design themes & inspiration', description: `${THEMES.length} curated design styles with room galleries, colour palettes and budgets.`, url: '/themes' },
}

// The save counts come from the DB; without this the page would statically freeze them at build time
// and never show a new save again. A minute of staleness is a fair trade against fetching on every hit.
export const revalidate = 60

export default async function ThemesPage() {
  const saveCounts = await getThemeSaveCounts()
  // Suspense is required because ThemesGalleryClient calls useSearchParams().
  // The fallback renders nothing visible — the gallery paints itself once hydrated.
  return (
    <Suspense fallback={null}>
      <ThemesGalleryClient saveCounts={saveCounts} />
    </Suspense>
  )
}
