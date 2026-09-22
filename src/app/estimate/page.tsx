import type { Metadata } from 'next'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import EstimateCalculator from './EstimateCalculator'
import { decodeSize } from '@/lib/size'
import { QUALITY_TIERS, SERVICE_BASE, type QualityTier } from '@/lib/estimate'

export const metadata: Metadata = {
  title: 'Renovation Cost Estimator — Delhi NCR',
  description: 'Get an indicative home renovation cost estimate for Delhi, Noida, Gurugram, Ghaziabad, Greater Noida and Faridabad. Final pricing is based on site inspection.',
  alternates: { canonical: '/estimate' },
  openGraph: { title: 'Renovation cost estimator — Delhi NCR', description: 'An indicative home renovation cost range for Delhi NCR. Final pricing is confirmed after a site visit.', url: '/estimate' },
}

export default async function EstimatePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const q = Array.isArray(sp.quality) ? sp.quality[0] : sp.quality
  const scope = (Array.isArray(sp.svc) ? sp.svc[0] : sp.svc)?.split(',').filter((k) => k in SERVICE_BASE)
  return (
    <>
      <MarketingNav />
      <EstimateCalculator
        initial={{
          size: decodeSize(sp),
          scope,
          quality: (QUALITY_TIERS as readonly string[]).includes(q ?? '') ? (q as QualityTier) : undefined,
        }}
      />
      <Footer />
    </>
  )
}
