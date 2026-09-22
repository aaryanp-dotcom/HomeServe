import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy',
  description: 'How cancellations and refunds work for HomeServe renovation projects, maintenance visits, and memberships.',
  alternates: { canonical: '/refund-policy' },
  openGraph: { title: 'Cancellation & Refund Policy — HomeServe', description: 'How cancellations and refunds work for HomeServe renovation projects, maintenance visits, and memberships.', url: '/refund-policy' },
}

export default function RefundPolicyPage() {
  return (
    <LegalPage
      code="L-03"
      title="Cancellation & Refund Policy"
      updated="22 September 2026"
      intro="Renovation projects, maintenance visits, and memberships each work a little differently, so each has its own cancellation terms below."
    >
      <h2>1. Renovation projects</h2>
      <h3>Before you accept a quotation</h3>
      <p>There is no charge for a consultation or site visit, so there is nothing to cancel or refund at this stage — you can walk away at any time, free of charge.</p>
      <h3>After you accept a quotation, before work begins</h3>
      <p>
        If you cancel after paying the advance milestone but before work has started on site, we refund the advance
        payment, less any cost HomeServe has already committed on your behalf at that point — for example, materials
        specifically ordered for your project. We will always tell you the amount involved before deducting it.
      </p>
      <h3>Once work has started</h3>
      <p>
        Milestone payments correspond to work already completed and are not refundable once that stage of work is
        done. Any milestone you have paid for but that has not yet started remains cancellable, refundable in full.
        If you need to pause or stop a project partway through, tell us and we will settle accounts for work
        completed to that point.
      </p>

      <h2>2. Home maintenance services</h2>
      <h3>Before the visit</h3>
      <p>You can cancel a maintenance request at no charge any time before a technician visit is scheduled to begin. If you had already paid online, we refund the full amount.</p>
      <h3>After the visit</h3>
      <p>
        Once a technician has visited and diagnosed or completed the work, the visit fee and any labour or materials
        used are payable. Charges are confirmed and shown to you after the visit and before you pay, so there are no
        surprises. If you believe a charge is wrong, raise it with us before paying and we will review it.
      </p>
      <h3>If something isn&apos;t right</h3>
      <p>If completed work has a genuine defect, tell us — we will fix it or, where that is not possible, discuss an appropriate refund for that portion of the charge.</p>

      <h2>3. Memberships</h2>
      <p>
        A membership is billed upfront for a fixed annual term and does not renew automatically. If you cancel before
        using any benefit under the plan, you can request a full refund within 7 days of purchase. Once a visit,
        discount, or credit under the membership has been used, the remaining term is non-refundable, since the
        value of the plan has already started being delivered.
      </p>

      <h2>4. How to request a cancellation or refund</h2>
      <p>
        Use the <Link href="/contact">contact form</Link>, or if you already have an account,{' '}
        <Link href="/homeowner/support/new">raise a support ticket</Link> from your dashboard, or reply on the
        project, request, or membership page directly. Include the project or request number where you have one, so
        we can act on it quickly.
      </p>

      <h2>5. How refunds are paid</h2>
      <p>
        A refund for an online payment is issued to the original payment method through Razorpay, and typically
        reflects in your account within 7–10 business days of approval, depending on your bank. A refund for an
        offline payment (cash, UPI transfer, or cheque recorded by our team) is returned the same way it was paid,
        on a similar timeline, once we have confirmed the details with you.
      </p>

      <h2>6. What this policy does not cover</h2>
      <p>
        This page describes our standard cancellation and refund terms. It does not override any specific terms
        agreed in writing in your project agreement or quotation, which take precedence for that project where they
        differ.
      </p>
    </LegalPage>
  )
}
