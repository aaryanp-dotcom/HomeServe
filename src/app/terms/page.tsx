import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply when you use HomeServe for a renovation or home maintenance service.',
  alternates: { canonical: '/terms' },
  openGraph: { title: 'Terms of Service — HomeServe', description: 'The terms that apply when you use HomeServe for a renovation or home maintenance service.', url: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage
      code="L-02"
      title="Terms of Service"
      updated="22 September 2026"
      intro="These terms apply whenever you use the HomeServe website or book a renovation or maintenance service with us. Please read them alongside our Privacy Policy and Cancellation & Refund Policy."
    >
      <h2>1. Who we are</h2>
      <p>
        HomeServe is a single, accountable home renovation and home maintenance company operating in Delhi NCR
        (Delhi, Noida, Greater Noida, Ghaziabad, Gurugram and Faridabad). We are not a marketplace, directory, or
        lead-generation platform — the work on your home is planned, quoted, and carried out by HomeServe&apos;s own
        team, under one agreement with you.
      </p>

      <h2>2. Accepting these terms</h2>
      <p>
        By creating an account, submitting a renovation request, booking a maintenance service, or otherwise using
        our site, you agree to these terms. If you do not agree, please do not use the service.
      </p>

      <h2>3. Eligibility and your account</h2>
      <ul>
        <li>You must be at least 18 years old and able to enter into a binding agreement to use our services.</li>
        <li>The information you give us — your name, contact details, and property address — must be accurate.</li>
        <li>You are responsible for keeping your account credentials confidential and for activity on your account.</li>
        <li>Public sign-up creates a homeowner account. Contractor and staff accounts are set up directly by HomeServe.</li>
      </ul>

      <h2>4. Site visits, quotations, and bookings</h2>
      <ul>
        <li>An initial consultation and site visit for a renovation enquiry is free of charge.</li>
        <li>A quotation we send you is an offer, not a binding commitment on either side, until you accept it. Pricing shown before a site visit is indicative; the final quotation reflects your property&apos;s actual scope and measurements.</li>
        <li>A project begins once you accept the quotation and make the advance payment described in it.</li>
        <li>A change to the agreed scope after acceptance — a different finish, an added room, and so on — is treated as a change order and quoted and agreed separately before we carry it out.</li>
        <li>Home maintenance requests are booked directly, without a formal quotation stage; indicative pricing is shown on the service page, and the final charge is confirmed after the visit, as described in the <Link href="/maintenance">home maintenance</Link> section.</li>
      </ul>

      <h2>5. Payments</h2>
      <ul>
        <li>Online payments are processed through Razorpay. We never see or store your card, UPI, or bank details.</li>
        <li>Renovation projects are paid in milestones tied to progress, as set out in your quotation — never the full amount upfront.</li>
        <li>Maintenance charges (visit fee, labour, and any materials) are confirmed after the visit and can be paid online or, where HomeServe agrees, recorded as an offline payment.</li>
        <li>Membership plans, where active, are paid upfront for a fixed annual term and do not renew automatically.</li>
        <li>Cancellations and refunds are governed by our separate <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>.</li>
      </ul>

      <h2>6. Warranty</h2>
      <p>
        Workmanship warranty terms for a completed renovation project — the coverage period and what it includes —
        are set out in that project&apos;s agreement and recorded on your account once your project is handed over.
        A warranty covers defects in HomeServe&apos;s work; it is separate from optional home maintenance, which
        covers general wear-and-tear repairs and servicing outside the warranty&apos;s scope.
      </p>

      <h2>7. Membership</h2>
      <p>
        A HomeServe home-care membership, where offered, is optional and entitles you to the benefits described on
        the plan you choose — for example, included visits, member pricing, or priority scheduling — for a fixed
        term. It does not extend, replace, or change your renovation warranty. Every service is still available to
        book individually without a membership.
      </p>

      <h2>8. Your responsibilities</h2>
      <ul>
        <li>Provide safe and reasonable access to your property for the agreed visit or work window.</li>
        <li>Tell us about anything relevant to the work — existing damage, structural concerns, or access restrictions.</li>
        <li>Keep the site reasonably clear so our team can work safely and efficiently.</li>
        <li>Make agreed payments on time, so project timelines are not delayed.</li>
      </ul>

      <h2>9. Reviews</h2>
      <p>
        Reviews on our site are written only by customers about work HomeServe actually completed for them. We do
        not create, edit, or pay for reviews, and we do not remove a genuine review because it is critical.
      </p>

      <h2>10. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the site for any unlawful purpose, or to submit false information.</li>
        <li>Attempt to access another user&apos;s account or data.</li>
        <li>Interfere with or disrupt the site&apos;s operation or security.</li>
        <li>Copy, resell, or scrape site content without our permission.</li>
      </ul>

      <h2>11. Intellectual property</h2>
      <p>
        The HomeServe name, logo, website design, and written content are owned by HomeServe or licensed to us.
        Nothing in these terms transfers that ownership to you. Photographs and design ideas you upload as part of a
        request remain yours; you give us permission to use them only to deliver the service you asked for.
      </p>

      <h2>12. Liability</h2>
      <p>
        We carry out our services with reasonable care and skill and stand behind our work through the warranty
        terms in your project agreement. To the extent permitted by law, HomeServe&apos;s liability for a claim
        arising from our services is limited to the amount you paid us for that project or service. We are not
        liable for indirect or consequential losses, or for delays caused by circumstances outside our reasonable
        control.
      </p>
      <p>Nothing in these terms limits any liability that cannot be limited under Indian law, including liability for fraud or for death or personal injury caused by our negligence.</p>

      <h2>13. Suspension and termination</h2>
      <p>
        You may stop using the service at any time; ongoing project or payment obligations already agreed will still
        apply. We may suspend or close an account that misuses the service, provides fraudulent information, or
        breaches these terms.
      </p>

      <h2>14. Governing law</h2>
      <p>These terms are governed by the laws of India. Any dispute arising from them is subject to the exclusive jurisdiction of the courts at Delhi, India.</p>

      <h2>15. Changes to these terms</h2>
      <p>We may update these terms from time to time; the date at the top of this page reflects the latest version. Continuing to use the service after an update means you accept the revised terms.</p>
    </LegalPage>
  )
}
