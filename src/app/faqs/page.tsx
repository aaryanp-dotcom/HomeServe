import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { PlanWatermark } from '@/components/arch/PlanWatermark'
import { JsonLd, faqJsonLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'FAQs',
  description: 'Frequently asked questions about HomeServe home renovation services in Delhi NCR.',
  alternates: { canonical: '/faqs' },
  openGraph: { title: 'Frequently asked questions — HomeServe', description: 'Everything you need to know about renovating your home with HomeServe.', url: '/faqs' },
}

const FAQS = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I start my renovation with HomeServe?',
        a: 'Submit a renovation request through our website by clicking "Start Your Renovation". Our team will review your requirements and call you within one business day to discuss your project and schedule a free site visit.',
      },
      {
        q: 'Does HomeServe charge for the initial consultation or site visit?',
        a: 'No. The initial consultation and site visit are completely free. We will visit your home, understand your requirements, take measurements and observations, and then prepare a detailed, transparent quotation.',
      },
      {
        q: 'How long does it take to receive a quotation after the site visit?',
        a: 'We typically provide a detailed quotation within 3–5 working days after the site visit, depending on the scope of your project.',
      },
      {
        q: 'Which areas does HomeServe currently serve?',
        a: 'We currently operate exclusively in Delhi NCR, covering Delhi, Noida, Greater Noida, Ghaziabad, Gurugram, and Faridabad.',
      },
    ],
  },
  {
    category: 'Project Execution',
    questions: [
      {
        q: 'Who executes the renovation work?',
        a: "HomeServe's own team manages and executes the renovation. We are not a marketplace or contractor directory — we are a single, accountable renovation company responsible for your project from planning to handover.",
      },
      {
        q: 'How long does a typical renovation take?',
        a: 'Timelines depend on the scope of work. A bathroom renovation may take 2–3 weeks. A full home renovation for a 2–3 BHK apartment typically takes 8–14 weeks. We provide a detailed project schedule with your quotation.',
      },
      {
        q: 'Will there be a project manager assigned to my project?',
        a: 'Yes. A dedicated project manager from HomeServe will be your single point of contact throughout the project, from site visits and planning through execution and handover.',
      },
      {
        q: 'Can I stay in my home during the renovation?',
        a: 'That depends on the scope. For a full home renovation, we recommend temporarily relocating. For room-by-room or specific work like painting or flooring, you may be able to stay with some inconvenience. Our team will advise you based on your specific project.',
      },
    ],
  },
  {
    category: 'Pricing & Payments',
    questions: [
      {
        q: 'How is renovation pricing calculated?',
        a: 'Renovation pricing depends on the scope of work, your property\'s condition, measurements, material choices, and the final bill of quantities (BOQ). We always provide indicative estimates upfront and a detailed, itemised quotation before you commit.',
      },
      {
        q: 'What are the payment terms?',
        a: 'We follow a milestone-based payment structure. Typically this includes an advance payment to begin, a mid-execution payment at a defined milestone, and a final payment at completion. The exact payment schedule is included in your quotation.',
      },
      {
        q: 'Are your prices inclusive of GST?',
        a: 'GST is applied on the renovation services as applicable and is shown clearly in your quotation. We maintain full transparency on all charges.',
      },
      {
        q: 'Can I pay online?',
        a: 'Yes. We support secure online payments through our platform. You will receive payment requests at each milestone and can pay using UPI, net banking, or credit/debit cards.',
      },
    ],
  },
  {
    category: 'Materials & Quality',
    questions: [
      {
        q: 'Who sources the materials?',
        a: 'HomeServe procures materials on your behalf. We work with trusted suppliers and show you material options within your budget and preference. You retain visibility and approval over material choices.',
      },
      {
        q: 'Can I choose my own materials or brands?',
        a: 'Absolutely. We discuss material preferences during the consultation and quotation stage. If you have specific brands or materials in mind, we will incorporate them into the BOQ and pricing.',
      },
      {
        q: 'Do you provide a quality guarantee?',
        a: 'We stand behind the quality of our work. Any defects or issues arising from workmanship within the warranty period will be rectified at no additional cost. Warranty terms are specified in your project agreement.',
      },
    ],
  },
  {
    category: 'After the Project',
    questions: [
      {
        q: 'What happens after the renovation is complete?',
        a: 'After final inspection and handover, you receive all relevant documentation including the completion certificate, warranty details, and guidelines for maintenance. Our team remains available for any post-completion support.',
      },
      {
        q: 'How do I raise a service request after project completion?',
        a: 'Log in to your HomeServe account and go to Warranty & Support. You can submit a service request describing the issue, attach photos, and our team will review and schedule a site visit if needed.',
      },
    ],
  },
]

export default function FAQsPage() {
  const allQuestions = FAQS.flatMap((section) => section.questions)
  return (
    <>
    <JsonLd data={faqJsonLd(allQuestions)} />
    <MarketingNav />
    <main className="min-h-screen bg-paper-100 pt-20">
      {/* Hero */}
      <div className="relative overflow-hidden border-b-2 border-ink-900 bg-blueprint">
        <PlanWatermark />
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <SheetTag code="A-14" title="FAQ" />
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink-900 tracking-[-0.03em] leading-[1.05] mb-4 animate-fade-up">
            Frequently Asked Questions
          </h1>
          <p className="text-base text-stone-500">
            Everything you need to know about renovating your home with HomeServe.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {FAQS.map(section => (
          <div key={section.category}>
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-5">
              {section.category}
            </h2>
            <div className="space-y-4">
              {section.questions.map(faq => (
                <details key={faq.q}
                  className="group bg-white border border-ink-900/15 overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
                    <span className="text-sm font-semibold text-stone-800">{faq.q}</span>
                    <span className="shrink-0 h-5 w-5 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center text-xs group-open:rotate-180 transition-transform">
                      ▾
                    </span>
                  </summary>
                  <div className="px-5 pb-5">
                    <p className="text-sm text-stone-600 leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="bg-cobalt-500 p-7 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Still have questions?</h3>
          <p className="text-sm text-white/90 mb-5">
            Talk to our team. We&apos;re happy to help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/get-started"
              className="px-6 py-2.5 bg-white text-cobalt-600 font-semibold hover:bg-cobalt-50 transition-colors text-sm"
            >
              Start Your Renovation
            </Link>
            <Link href="/contact"
              className="px-6 py-2.5 border border-cobalt-400 text-white font-semibold hover:bg-cobalt-400 transition-colors text-sm"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </main>
    <Footer />
    </>
  )
}
