import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { PlanWatermark } from '@/components/arch/PlanWatermark'
import { ArrowRight, CheckCircle, Phone, MapPin, FileText, Hammer, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How It Works — Delhi NCR',
  description: 'From your first call to final handover — understand exactly how HomeServe manages your home renovation across Delhi NCR.',
  alternates: { canonical: '/how-it-works' },
  openGraph: { title: 'How HomeServe works', description: 'From your first call to final handover — how we manage your renovation across Delhi NCR.', url: '/how-it-works' },
}

const STEPS = [
  {
    number: '01',
    icon: Phone,
    title: 'Tell us what you need',
    desc: 'Submit your renovation requirement using our simple form. Share your property details — city, locality, type, approximate area — and what you want renovated. Also let us know your approximate budget and preferred timeline.',
    detail: 'Takes about 5 minutes. No obligations.',
    color: 'bg-cobalt-50 text-cobalt-600',
  },
  {
    number: '02',
    icon: MapPin,
    title: 'Consultation & site visit',
    desc: 'Our team reviews your requirement and calls you within 24 hours. We schedule a free site visit at your convenience. During the visit, we understand your requirements in detail, take measurements, assess site conditions and discuss material options.',
    detail: 'Free site visit anywhere in Delhi NCR.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    number: '03',
    icon: FileText,
    title: 'Detailed estimate & quotation',
    desc: 'Based on the site visit, we prepare a transparent, itemised quotation. Every line item is specified — scope, material, quantity, rate. No hidden charges. You know exactly what you are paying for and what you are getting.',
    detail: 'Full BOQ with materials and rates.',
    color: 'bg-sage-50 text-sage-700',
  },
  {
    number: '04',
    icon: CheckCircle,
    title: 'You approve the plan',
    desc: 'Review the quotation carefully. Ask questions, request changes, compare material options. Once you are satisfied, you digitally accept the quotation and pay the advance. The project is confirmed.',
    detail: 'Accept online. Pay advance to start.',
    color: 'bg-cobalt-50 text-cobalt-600',
  },
  {
    number: '05',
    icon: Hammer,
    title: 'We execute the renovation',
    desc: 'Our team takes over. We handle material procurement, skilled labour, daily site supervision and quality control at every stage. You receive regular progress updates and can raise questions at any time through your project dashboard.',
    detail: 'Full supervision. Milestone payments tied to progress.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    number: '06',
    icon: ShieldCheck,
    title: 'Handover & after-sales support',
    desc: 'Once work is complete, we do a final walkthrough together. Any snags are resolved before formal handover. After handover, our team remains available for warranty support and service requests.',
    detail: 'Walkthrough. Snag resolution. Warranty coverage.',
    color: 'bg-sage-50 text-sage-700',
  },
]

const PAYMENT_MILESTONES = [
  { label: 'Advance', desc: 'Paid on project confirmation. Covers material procurement and mobilisation.', pct: '~20–30%' },
  { label: 'Mid-project milestone', desc: 'Paid at a defined mid-stage completion point (e.g., civil/carpentry done).', pct: '~40–50%' },
  { label: 'Completion', desc: 'Final payment after walkthrough and handover.', pct: '~20–30%' },
]

const FAQS = [
  { q: 'Do you only operate in Delhi NCR?', a: 'Yes, currently we serve Delhi, Noida, Greater Noida, Ghaziabad, Gurugram and Faridabad. We plan to expand to other cities in the future.' },
  { q: 'Is the site visit free?', a: 'Yes. The site visit and initial consultation are completely free with no obligation.' },
  { q: 'How long does a quotation take?', a: 'Typically 3–5 working days after the site visit, depending on the scope of work.' },
  { q: 'Can I change the scope after the quotation?', a: 'Yes. Any changes to scope or materials will be quoted separately as a revision or change order. We will never start additional work without your written approval.' },
  { q: 'Who supervises the work at site?', a: 'A dedicated HomeServe site supervisor manages day-to-day execution, quality checks and labour coordination.' },
  { q: 'What is the warranty on work done?', a: 'Warranty terms are defined in your project agreement. Coverage, duration and conditions depend on the scope and type of work. Please ask your project manager for details.' },
  { q: 'Do I need to buy materials separately?', a: 'No. Material procurement is part of our service. We source materials as per the agreed specification. You are always welcome to specify preferred brands or visit material showrooms with us.' },
  { q: 'How do I track my project?', a: 'Your homeowner dashboard shows current project status, milestone progress, payment history and uploaded project photos.' },
]

export default function HowItWorksPage() {
  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-paper-100 pt-20">

        {/* Hero */}
        <section className="py-20 lg:py-28 border-b-2 border-ink-900 bg-blueprint relative overflow-hidden">
          <PlanWatermark />
          <div className="container-site relative max-w-3xl">
            <SheetTag code="A-10" title="How it works" />
            <p className="text-xs font-semibold text-cobalt-600 uppercase tracking-wider mb-3">Transparent process</p>
            <h1 className="font-display text-4xl lg:text-[3.6rem] font-bold text-ink-900 tracking-[-0.03em] leading-[1.05] animate-fade-up mb-5">
              From your first call to<br />final handover
            </h1>
            <p className="text-lg text-stone-500 leading-relaxed mb-8">
              Renovating your home should feel in control, not stressful. Here is exactly how HomeServe manages your project — step by step, with full transparency.
            </p>
            <Link
              href="/get-started"
              className="coarse:min-h-11 inline-flex items-center gap-2 px-6 py-3 bg-ink-900 text-white text-sm font-semibold hover:bg-cobalt-600 transition-colors"
            >
              Start Your Renovation
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 lg:py-20">
          <div className="container-site max-w-4xl">
            <div className="space-y-12">
              {STEPS.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={step.number} className="flex gap-6 lg:gap-10">
                    {/* Number + connector */}
                    <div className="flex flex-col items-center">
                      <div className={`h-12 w-12 flex items-center justify-center shrink-0 ${step.color}`}>
                        <Icon size={20} />
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 w-px bg-stone-200 my-3" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-mono font-bold text-stone-400">{step.number}</span>
                        <h2 className="text-xl font-semibold text-stone-900">{step.title}</h2>
                      </div>
                      <p className="text-stone-600 leading-relaxed mb-3">{step.desc}</p>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-100 text-xs text-stone-500">
                        <CheckCircle size={11} className="text-sage-500" />
                        {step.detail}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Payment milestones */}
        <section className="py-16 bg-paper-100 border-y border-ink-900/20">
          <div className="container-site max-w-4xl">
            <p className="text-xs font-semibold text-cobalt-600 uppercase tracking-wider mb-2">No upfront lump sums</p>
            <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-3">Milestone-based payments</h2>
            <p className="text-stone-500 mb-8">You never pay the full project amount upfront. Payments are split across defined project milestones so your money tracks actual progress.</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {PAYMENT_MILESTONES.map((m, i) => (
                <div key={i} className="p-5 bg-white border border-ink-900/15">
                  <div className="flex items-center justify-between mb-3">
                    <span className="panel-title">{m.label}</span>
                    <span className="text-sm font-bold text-cobalt-600">{m.pct}</span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-4">* Actual percentages are agreed in your quotation. They vary by project size and scope.</p>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 lg:py-20">
          <div className="container-site max-w-3xl">
            <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-8">Common questions</h2>
            <div className="space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group p-5 border border-ink-900/15 bg-white cursor-pointer open:border-cobalt-200">
                  <summary className="flex items-center justify-between text-sm font-semibold text-stone-800 list-none select-none">
                    {q}
                    <span className="shrink-0 ml-3 text-stone-400 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-stone-600 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-stone-900">
          <div className="container-site text-center max-w-2xl">
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-3">Ready to start your renovation?</h2>
            <p className="text-stone-300 mb-6">Submit your requirement and our team will be in touch within 24 hours.</p>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-cobalt-500 text-white text-sm font-semibold hover:bg-cobalt-400 transition-colors"
            >
              Start Your Renovation
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
