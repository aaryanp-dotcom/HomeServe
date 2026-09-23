'use client'

/**
 * PrivacyNotice — DPDP Act, 2023 §5 & §6 compliance component.
 *
 * Displayed at every point of data collection to inform the Data Principal of:
 *  - what personal data is being collected
 *  - the purpose of processing
 *  - their right to withdraw consent
 *  - how to raise a grievance
 *
 * LEGAL NOTE: The text below is informational copy, not a legal document. The full
 * Privacy Policy at /privacy is the authoritative text. This component records that
 * the user saw and actively accepted the notice before submitting their data.
 *
 * The `context` prop tailors the data-collection description to the specific form.
 */

import Link from 'next/link'

type NoticeContext = 'signup' | 'lead_form' | 'contact_form'

const CONTEXT_COPY: Record<NoticeContext, string> = {
  signup:
    'By creating an account, HomeServe will collect and use your name, email address, and optionally your mobile number to manage your account, deliver renovation and maintenance services, and send you updates about your projects and bookings.',
  lead_form:
    'HomeServe will use the name, mobile number, and property details you provide to contact you about your renovation request, schedule a consultation, and prepare a quotation. Email, if provided, is used for follow-up.',
  contact_form:
    'HomeServe will use your name, email address, and message to respond to your enquiry and keep a record of the conversation.',
}

interface PrivacyNoticeProps {
  accepted: boolean
  onAcceptChange: (v: boolean) => void
  context: NoticeContext
}

export function PrivacyNotice({ accepted, onAcceptChange, context }: PrivacyNoticeProps) {
  return (
    <div className="rounded border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-600 space-y-2">
      <p>{CONTEXT_COPY[context]}</p>
      <p>
        We share your data only with our service providers (Supabase, Razorpay, Resend, Twilio) as
        described in our{' '}
        <Link href="/privacy" className="font-medium text-cobalt-600 underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </Link>
        . You can withdraw consent, request access, correction or deletion of your data, or raise a
        grievance at any time via our{' '}
        <Link href="/contact" className="font-medium text-cobalt-600 underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
          contact form
        </Link>
        {' '}or{' '}
        <Link href="/homeowner/support/new" className="font-medium text-cobalt-600 underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
          support ticket
        </Link>
        .
      </p>
      <label className="flex items-start gap-2 cursor-pointer select-none mt-1">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-cobalt-500"
          aria-describedby="privacy-notice-desc"
        />
        <span id="privacy-notice-desc" className="text-xs text-stone-700">
          I have read the Privacy Policy and consent to HomeServe collecting and using my personal
          data as described above.{' '}
          <span className="text-stone-400">(Required)</span>
        </span>
      </label>
    </div>
  )
}
