import type { Metadata } from 'next'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import HomepageThemesCarousel from '@/components/themes/HomepageThemesCarousel'
import { ScrollProgress } from '@/components/motion/ScrollProgress'
import { Hero } from '@/components/home/Hero'
import { Ticker } from '@/components/home/Ticker'
import { EstimateSection } from '@/components/home/EstimateSection'
import { ServicesIndex } from '@/components/home/ServicesIndex'
import { ProcessTimeline } from '@/components/home/ProcessTimeline'
import { BeforeAfter } from '@/components/home/BeforeAfter'
import { WhyUs } from '@/components/home/WhyUs'
import { HomeCare } from '@/components/home/HomeCare'
import { FAQ } from '@/components/home/FAQ'
import { FinalCTA } from '@/components/home/FinalCTA'
import { StickyCTA } from '@/components/home/StickyCTA'

export const metadata: Metadata = {
  title: 'HomeServe — Home Renovation Services in Delhi NCR',
  description:
    'HomeServe manages your home renovation from planning and design to execution and handover across Delhi, Noida, Gurugram, Ghaziabad, Greater Noida and Faridabad.',
  keywords: ['home renovation Delhi NCR', 'home renovation Delhi', 'kitchen renovation Noida', 'bathroom renovation Gurugram', 'home renovation company Delhi'],
}

export default function LandingPage() {
  return (
    <>
      <ScrollProgress />
      <MarketingNav />
      <main>
        <Hero />
        <Ticker />
        <EstimateSection />
        <ServicesIndex />
        <HomepageThemesCarousel />
        <ProcessTimeline />
        <BeforeAfter />
        <WhyUs />
        <HomeCare />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer showCta={false} />
      <StickyCTA />
    </>
  )
}
