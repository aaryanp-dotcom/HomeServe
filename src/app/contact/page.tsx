import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { PlanWatermark } from '@/components/arch/PlanWatermark'
import { TicketForm } from '@/components/support/TicketForm'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with HomeServe for home renovation queries in Delhi NCR. We offer free consultations and site visits.',
  alternates: { canonical: '/contact' },
  openGraph: { title: 'Contact HomeServe', description: 'Get in touch for a free consultation and site visit in Delhi NCR.', url: '/contact' },
}

export default function ContactPage() {
  return (
    <>
    <MarketingNav />
    <main className="min-h-screen bg-paper-100 pt-20">
      {/* Hero */}
      <div className="relative overflow-hidden border-b-2 border-ink-900 bg-blueprint">
        <PlanWatermark />
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <SheetTag code="A-13" title="Contact" />
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink-900 tracking-[-0.03em] leading-[1.05] mb-4 animate-fade-up">
            Get in Touch
          </h1>
          <p className="text-base text-stone-500 max-w-xl">
            Planning a renovation in Delhi NCR? Tell us about your project and we&apos;ll schedule a free consultation at your home.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">

          {/* Contact form → Start Your Renovation */}
          <div className="bg-white border border-ink-900/15 p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-1">Start Your Renovation</h2>
            <p className="text-sm text-stone-500 mb-5">
              Fill out our quick request form and we&apos;ll contact you within one business day to discuss your project.
            </p>
            <Link
              href="/get-started"
              className="coarse:min-h-11 block w-full text-center py-3 px-6 bg-ink-900 text-white font-semibold hover:bg-cobalt-600 transition-colors"
            >
              Submit Renovation Request →
            </Link>

            <div className="mt-6 pt-6 border-t border-stone-100 space-y-3">
              <p className="panel-title">What happens next</p>
              {[
                'Our team reviews your request within 1 business day',
                'We call you to understand your requirements better',
                'We schedule a free site visit at your convenience',
                'You receive a detailed, transparent quotation',
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

          {/* Contact details */}
          <div className="space-y-4">

            {/* Phone / WhatsApp */}
            <div className="bg-white border border-ink-900/15 p-5">
              <p className="panel-title mb-3">Call or WhatsApp</p>
              <a href="tel:+919205803868" className="block text-lg font-semibold text-stone-900 mb-1 hover:text-cobalt-600">+91 92058 03868</a>
              <p className="text-xs text-stone-400">Mon – Sat, 9am – 7pm</p>
            </div>

            {/* Email */}
            <div className="bg-white border border-ink-900/15 p-5">
              <p className="panel-title mb-3">Email</p>
              <a href="mailto:hello@homeserve.in" className="text-cobalt-600 font-medium hover:underline">
                hello@homeserve.in
              </a>
            </div>

            {/* Service area */}
            <div className="bg-stone-50 border border-ink-900/15 p-5">
              <p className="panel-title mb-3">We Serve</p>
              <div className="grid grid-cols-2 gap-1.5 text-sm text-stone-700">
                {['Delhi', 'Noida', 'Greater Noida', 'Ghaziabad', 'Gurugram', 'Faridabad'].map(city => (
                  <div key={city} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cobalt-400" />
                    {city}
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-3">Delhi NCR only at this time</p>
            </div>

            {/* Office hours */}
            <div className="bg-white border border-ink-900/15 p-5">
              <p className="panel-title mb-3">Office Hours</p>
              <div className="text-sm text-stone-600 space-y-1">
                <div className="flex justify-between">
                  <span>Monday – Friday</span>
                  <span className="font-medium text-stone-800">9:00 am – 7:00 pm</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-medium text-stone-800">10:00 am – 5:00 pm</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-medium text-stone-400">Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* General message — anything that isn't a new renovation project */}
        <div className="mt-8 bg-white border border-ink-900/15 p-6 sm:p-8">
          <p className="panel-title mb-1">Or send us a message</p>
          <h2 className="mb-1 font-display text-2xl font-bold tracking-[-0.02em] text-ink-900">Have a question, or already a customer?</h2>
          <p className="mb-6 text-sm text-stone-500">For an existing project, maintenance visit, a billing question or anything else — write to us here and we&apos;ll reply by email.</p>
          <div className="max-w-xl">
            <TicketForm />
          </div>
        </div>
      </div>
    </main>
    <Footer />
    </>
  )
}
