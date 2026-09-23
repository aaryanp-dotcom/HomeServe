import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Your Privacy Rights',
  description: 'How to exercise your data privacy rights under the Digital Personal Data Protection Act, 2023 with HomeServe.',
  alternates: { canonical: '/privacy/rights' },
  openGraph: {
    title: 'Your Privacy Rights — HomeServe',
    description: 'How to exercise your data privacy rights under the DPDP Act, 2023.',
    url: '/privacy/rights',
  },
}

export default function PrivacyRightsPage() {
  return (
    <LegalPage
      code="L-04"
      title="Your Privacy Rights"
      updated="22 September 2026"
      intro="The Digital Personal Data Protection Act, 2023 gives you rights over your personal data. This page explains what those rights are and how you can exercise them with HomeServe."
    >
      <p>
        HomeServe is the Data Fiduciary for the personal data you share when using our website and
        services. You are the Data Principal — the person whose data is being processed. The rights
        below apply to personal data we hold about you in connection with your account, renovation
        projects, maintenance bookings, and communications.
      </p>

      <h2>1. Right to access</h2>
      <p>
        You can see and update most of your account information directly in your{' '}
        <Link href="/homeowner/profile" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">profile page</Link>.
        Your active and past projects, bookings, quotations, payments, service requests, and notifications
        are all visible from your{' '}
        <Link href="/homeowner/dashboard" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">dashboard</Link>.
      </p>
      <p>
        If you need a summary of personal data we hold about you that is not directly visible in your
        account, you can submit a data access request using the form at the bottom of this page or via
        a{' '}
        <Link href="/homeowner/support/new" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">support ticket</Link>{' '}
        addressed to our Grievance Officer.
      </p>

      <h2>2. Right to correction</h2>
      <p>
        You can update your name, phone number, city, and state at any time from your{' '}
        <Link href="/homeowner/profile" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">profile page</Link>.
        Your email address is managed through your authentication provider (Google or email/password).
        For corrections to data not directly editable in your account — such as an address in a past
        quotation — raise a{' '}
        <Link href="/homeowner/support/new" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">support ticket</Link>.
      </p>

      <h2>3. Right to erasure</h2>
      <p>
        You can request deletion of your account and associated personal data at any time. On receiving
        your request, we will:
      </p>
      <ul>
        <li>Delete or anonymise personal data that is not required for a legal, tax, or contractual obligation.</li>
        <li>Retain financial transaction records, payment confirmations, and booking records for the period required under applicable law (currently 7 years under Indian tax and accounting rules).</li>
        <li>Retain records needed to resolve an open dispute, warranty claim, or legal proceeding until it is concluded.</li>
        <li>Inform you which records have been retained and why.</li>
      </ul>
      <p>
        To request account deletion, raise a{' '}
        <Link href="/homeowner/support/new" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">support ticket</Link>{' '}
        with the subject &ldquo;Account Deletion Request&rdquo; or use the{' '}
        <Link href="/contact" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">contact form</Link>.
        We aim to complete erasure requests within 30 days, subject to the legal retention obligations above.
      </p>

      <h2>4. Right to withdraw consent</h2>
      <p>
        Where processing is based on your consent, you can withdraw it at any time. Withdrawing consent
        does not affect the lawfulness of processing carried out before the withdrawal.
      </p>
      <ul>
        <li>
          <strong>Marketing and non-essential communications:</strong> Contact us to opt out of
          marketing emails. Transactional emails about active projects, bookings, or payments are
          necessary to deliver the service and cannot be turned off while a project is active.
        </li>
        <li>
          <strong>SMS / WhatsApp notifications:</strong> Reply STOP to any message from our number or
          contact us to stop receiving SMS/WhatsApp notifications.
        </li>
        <li>
          <strong>Account closure:</strong> Closing your account (as described above) constitutes
          withdrawal of consent for ongoing data processing, subject to our legal retention obligations.
        </li>
      </ul>

      <h2>5. Right to grievance redressal</h2>
      <p>
        If you have a question or complaint about how we handle your personal data, you can raise a
        grievance with our Grievance Officer. We aim to acknowledge grievances within 48 hours and
        resolve them within 30 days.
      </p>
      <p>
        <strong>How to raise a grievance:</strong>
      </p>
      <ul>
        <li>
          Use the{' '}
          <Link href="/homeowner/support/new" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">support ticket</Link>{' '}
          form in your account (subject: &ldquo;Privacy Grievance&rdquo;), or
        </li>
        <li>
          Use the{' '}
          <Link href="/contact" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">contact form</Link>{' '}
          on our website, or
        </li>
        <li>
          Email us directly at{' '}
          <a href="mailto:privacy@homeserve.in" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">privacy@homeserve.in</a>
          {' '}(also serves as the Grievance Officer contact).
        </li>
      </ul>

      <p className="text-sm text-stone-500 mt-4">
        <strong>Note:</strong> The DPDP Act, 2023 is partially in force. Additional rights and
        obligations may apply when further provisions and the final Rules are notified. This page
        will be updated accordingly.
      </p>

      <h2>6. How to submit a data request</h2>
      <p>
        To exercise any of the rights above — access, correction, erasure, withdrawal of consent,
        or grievance — use one of the channels below:
      </p>
      <ul>
        <li>
          <strong>Signed-in customers:</strong>{' '}
          <Link href="/homeowner/support/new" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">Raise a support ticket</Link>{' '}
          with the category &ldquo;Privacy / Data Request&rdquo;.
        </li>
        <li>
          <strong>Anyone else:</strong>{' '}
          <Link href="/contact" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">Use the contact form</Link>.
        </li>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:privacy@homeserve.in" className="font-medium text-cobalt-600 underline-offset-2 hover:underline">privacy@homeserve.in</a>
        </li>
      </ul>
      <p>
        Please include your registered email address (so we can identify your account), the type of
        request (access / correction / erasure / withdrawal / grievance), and a brief description of
        what you are requesting.
      </p>
    </LegalPage>
  )
}
