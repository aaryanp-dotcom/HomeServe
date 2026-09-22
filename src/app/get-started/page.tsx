import { MarketingNav } from '@/components/shared/Navigation'
import RenovationRequestForm from './RenovationRequestForm'
import { decodeSize } from '@/lib/size'

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export const metadata = { title: 'Start your renovation', description: 'Tell us about your home for a free site visit and itemised quotation in Delhi NCR.', alternates: { canonical: '/get-started' }, openGraph: { title: 'Start your renovation with HomeServe', description: 'Tell us about your home for a free site visit and itemised quotation in Delhi NCR.', url: '/get-started' } }

export default async function GetStartedPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const lo = Number(one(sp.lo)), hi = Number(one(sp.hi))
  return (
    <>
      <MarketingNav />
      <main>
      <RenovationRequestForm
        defaultTheme={one(sp.theme)}
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
