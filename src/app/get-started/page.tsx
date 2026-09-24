import { MarketingNav } from '@/components/shared/Navigation'
import RenovationRequestForm from './RenovationRequestForm'
import { decodeSize } from '@/lib/size'
import { THEMES } from '@/lib/themes/data'

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export const metadata = { title: 'Start your renovation', description: 'Tell us about your home for a free site visit and itemised quotation in Delhi NCR.', alternates: { canonical: '/get-started' }, openGraph: { title: 'Start your renovation with HomeServe', description: 'Tell us about your home for a free site visit and itemised quotation in Delhi NCR.', url: '/get-started' } }

/**
 * Resolves the theme(s) to prefill into the form's inspiration field — either a single
 * theme slug (?theme=, from a theme detail page's "start with this style" CTA) or several
 * (?themes=slug-a,slug-b, from the saved-themes moodboard drawer). Both feed the same
 * inspiration_theme column on the lead record; unknown slugs are dropped rather than
 * shown to the admin as a raw slug.
 */
function resolveInspirationTheme(sp: SP): string | undefined {
  const single = one(sp.theme)
  const many = one(sp.themes)?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
  const slugs = [...(single ? [single] : []), ...many]
  const names = Array.from(new Set(slugs))
    .map((slug) => THEMES.find((t) => t.slug === slug)?.name)
    .filter((name): name is string => Boolean(name))
  return names.length > 0 ? names.join(', ') : undefined
}

export default async function GetStartedPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const lo = Number(one(sp.lo)), hi = Number(one(sp.hi))
  return (
    <>
      <MarketingNav />
      <main>
      <RenovationRequestForm
        defaultTheme={resolveInspirationTheme(sp)}
        initial={{
          size: decodeSize(sp),
          scope: one(sp.scope)?.split(',').filter(Boolean).slice(0, 8),
          estimateLow: Number.isFinite(lo) && lo > 0 ? lo : undefined,
          estimateHigh: Number.isFinite(hi) && hi > 0 ? hi : undefined,
        }}
      />
      </main>
    </>
  )
}
