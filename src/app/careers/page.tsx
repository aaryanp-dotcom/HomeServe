import type { Metadata } from 'next'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { PlanWatermark } from '@/components/arch/PlanWatermark'
import { ContractorApplicationForm } from '@/components/careers/ContractorApplicationForm'

export const metadata: Metadata = {
  title: 'Careers — Join Our Site Team',
  description: 'HomeServe is hiring skilled technicians and site contractors across Delhi NCR — plumbers, electricians, carpenters, painters and more. Apply to join our team.',
  alternates: { canonical: '/careers' },
  openGraph: { title: 'Careers at HomeServe', description: 'Join our site team as a skilled technician or contractor in Delhi NCR.', url: '/careers' },
}

export default function CareersPage() {
  return (
    <>
    <MarketingNav />
    <main className="min-h-screen bg-paper-100 pt-20">
      {/* Hero */}
      <div className="relative overflow-hidden border-b-2 border-ink-900 bg-blueprint">
        <PlanWatermark />
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <SheetTag code="A-16" title="Careers" />
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink-900 tracking-[-0.03em] leading-[1.05] mb-4 animate-fade-up">
            Join the HomeServe site team
          </h1>
          <p className="text-base text-stone-500 max-w-xl">
            We&apos;re always looking for skilled plumbers, electricians, carpenters, painters and
            other tradespeople across Delhi NCR. Tell us about your experience below — our team
            reviews every application personally.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="bg-white border border-ink-900/15 p-5 sm:p-6">
          <p className="panel-title mb-3">How it works</p>
          <div className="space-y-3">
            {[
              'Fill out the form below with your trade, experience and contact details',
              'Our team reviews your application — this is not an automatic sign-up',
              'If it looks like a fit, we’ll call you to discuss the role',
              'Once approved, we set you up with your own HomeServe account to manage jobs',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-stone-600">
                <span className="mt-0.5 h-5 w-5 rounded-full bg-cobalt-100 text-cobalt-600 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>

        <ContractorApplicationForm />
      </div>
    </main>
    <Footer />
    </>
  )
}
