import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How HomeServe collects, uses and protects your personal information.',
  alternates: { canonical: '/privacy' },
  openGraph: { title: 'Privacy Policy — HomeServe', description: 'How HomeServe collects, uses and protects your personal information.', url: '/privacy' },
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      code="L-01"
      title="Privacy Policy"
      updated="22 September 2026"
      intro="This explains what information HomeServe collects when you use our website or services, what we do with it, and the choices you have."
    >
      <p>
        HomeServe (&ldquo;HomeServe&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) provides home renovation and home
        maintenance services in Delhi NCR. This policy applies to homeserve.in (or wherever this site is hosted),
        our web app, and the services booked through it. It does not apply to any third-party site you reach through
        a link on ours.
      </p>

      <h2>1. Information we collect</h2>
      <p>We collect information in three ways: what you give us directly, what our systems record automatically, and what our service providers pass back to us.</p>
      <h3>a. Information you provide</h3>
      <ul>
        <li><strong>Account details</strong> — name, email address, and phone number, when you create an account or sign in with Google.</li>
        <li><strong>Project and property details</strong> — your address, property type and size, renovation scope, budget range, and anything you tell us about a maintenance issue, including photos you choose to upload.</li>
        <li><strong>Communications</strong> — messages you send through a project, a maintenance request, a support ticket, or the contact form, including the name, email, and phone number you enter on that form.</li>
        <li><strong>Payment details</strong> — we never see or store your card, UPI, or net-banking credentials. Online payments are handled entirely by our payment processor, Razorpay; we only receive confirmation that a payment succeeded, its amount, and a payment reference.</li>
      </ul>
      <h3>b. Information collected automatically</h3>
      <p>
        Our hosting and database provider records standard technical information needed to operate the site securely —
        things like sign-in timestamps and IP address at the time of a request. We do not run third-party advertising
        trackers or sell any data collected this way.
      </p>
      <h3>c. From our service providers</h3>
      <p>Razorpay tells us the status of a payment; if you sign in with Google, Google shares your name, email address, and profile photo with us, as permitted by your Google account settings.</p>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To provide the service you asked for — scheduling a site visit, preparing a quotation, running a renovation project, or carrying out a maintenance visit.</li>
        <li>To process payments and keep an accurate record of what has been paid and what is due.</li>
        <li>To send you updates about your project, request, membership, or support ticket, by email and, where you have opted in and we have it configured, SMS or WhatsApp.</li>
        <li>To respond when you contact us, and to keep a record of that conversation.</li>
        <li>To maintain the security of our systems and prevent misuse.</li>
        <li>To meet our legal, tax, and accounting obligations.</li>
      </ul>
      <p>We do not use your information to train third-party AI models, and we do not sell your personal information to anyone.</p>

      <h2>3. Who we share it with</h2>
      <p>We share information only where it is needed to run the service:</p>
      <ul>
        <li><strong>Our own team and site contractor</strong>, so the person doing the work has your address, contact number, and what needs to be done.</li>
        <li><strong>Razorpay</strong>, to process an online payment.</li>
        <li><strong>Resend</strong>, our email delivery provider, to send account, project, and payment emails.</li>
        <li><strong>Supabase</strong>, our database and authentication provider, which stores your account and project data on our behalf.</li>
        <li><strong>Twilio</strong>, if and when we enable SMS/WhatsApp notifications, to deliver those messages.</li>
        <li><strong>Law enforcement or a court</strong>, only if we are legally required to.</li>
      </ul>
      <p>We do not run a marketplace or contractor directory, so your details are never shared with a third-party contractor outside HomeServe.</p>

      <h2>4. Cookies</h2>
      <p>
        We use the minimum cookies needed to keep you signed in and to remember basic preferences (for example, whether
        you have saved a design theme on this browser). We do not use third-party advertising or cross-site tracking
        cookies.
      </p>

      <h2>5. How long we keep it</h2>
      <p>
        We keep account and project information for as long as your account is active, and afterwards for as long as
        we are required to for accounting, tax, or legal purposes, or to resolve a dispute. You can ask us to delete
        your account at any time; see Your rights below.
      </p>

      <h2>6. Security</h2>
      <p>
        We use industry-standard measures — encrypted connections, access controls, and a payment flow that never
        touches your card or bank details directly — to protect your information. No system is completely immune to
        risk, and we cannot guarantee absolute security, but we take reasonable steps to safeguard what you share
        with us and to respond quickly if something goes wrong.
      </p>

      <h2>7. Your rights</h2>
      <p>You can:</p>
      <ul>
        <li>See and update most of your account details directly from your dashboard.</li>
        <li>Ask us what personal information we hold about you.</li>
        <li>Ask us to correct information that is wrong.</li>
        <li>Ask us to delete your account and associated personal information, subject to what we are legally required to retain.</li>
        <li>Withdraw consent to non-essential communications at any time.</li>
      </ul>
      <p>To exercise any of these, use the contact details at the bottom of this page.</p>

      <h2>8. Children</h2>
      <p>Our services are for adults entering into a service agreement with us. We do not knowingly collect information from anyone under 18.</p>

      <h2>9. Changes to this policy</h2>
      <p>We may update this policy as our services change. We will update the date at the top of this page when we do; significant changes will be highlighted here.</p>

      <h2>10. Grievance officer</h2>
      <p>
        In line with Indian data protection requirements, questions or complaints about how we handle your personal
        information can be raised through the <Link href="/contact">contact form</Link> or, if you have an account,
        by <Link href="/homeowner/support/new">raising a support ticket</Link> addressed to our Grievance Officer.
        We aim to acknowledge grievances within a reasonable time and resolve them promptly.
      </p>
    </LegalPage>
  )
}
