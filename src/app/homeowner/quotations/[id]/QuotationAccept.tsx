'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, RefreshCw, Printer } from 'lucide-react'

interface Props {
  quotationId: string
  status: string
}

export default function QuotationAccept({ quotationId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  // Accept: call the accept endpoint which creates the booking + milestones,
  // then redirect to the advance payment page.
  async function accept() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/quotations/${quotationId}/accept`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Something went wrong')
      }
      const { booking_id } = await res.json()
      router.push(`/homeowner/projects/advance-payment?booking=${booking_id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  async function patch(newStatus: string, extra?: Record<string, string>) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extra }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Something went wrong')
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Already accepted
  if (status === 'accepted') {
    return (
      <div className="flex items-start gap-3 p-5 bg-sage-50 border border-sage-200">
        <CheckCircle size={20} className="text-sage-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-sage-900">Quotation Accepted</p>
          <p className="text-sm text-sage-700 mt-0.5">
            Our team will reach out shortly to confirm the start date and advance payment details.
          </p>
        </div>
      </div>
    )
  }

  // Already rejected or revision requested
  if (status === 'rejected') {
    return (
      <div className="flex items-start gap-3 p-5 bg-rose-50 border border-rose-200">
        <XCircle size={20} className="text-rose-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-rose-900">Quotation Rejected</p>
          <p className="text-sm text-rose-700 mt-0.5">
            If you change your mind or want to discuss further, please contact us.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'revision_requested') {
    return (
      <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-200">
        <RefreshCw size={20} className="text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Revision Requested</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Our team has received your request for changes and will send a revised quotation shortly.
          </p>
        </div>
      </div>
    )
  }

  // Not actionable (draft, expired, etc.)
  if (status !== 'sent' && status !== 'viewed') {
    return null
  }

  // Main action panel
  return (
    <div className="space-y-3">
      {/* Print / save PDF */}
      <button
        onClick={() => window.print()}
        className="coarse:min-h-11 flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white transition-colors"
      >
        <Printer size={14} /> Save / Print PDF
      </button>

    <div className="p-5 border border-stone-200 bg-white space-y-4">
      <div>
        <p className="text-sm font-semibold text-stone-900 mb-1">Ready to proceed?</p>
        <p className="text-xs text-stone-500">
          Review the quotation above carefully. Once you accept, our team will contact you to confirm the advance payment and project start date.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-sm text-rose-700">{error}</div>
      )}

      {!showRejectForm ? (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={accept}
            disabled={loading}
            className="coarse:min-h-11 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 disabled:opacity-50 transition-colors"
          >
            <CheckCircle size={15} />
            {loading ? 'Creating project…' : 'Accept Quotation'}
          </button>
          <button
            onClick={() => patch('revision_requested')}
            disabled={loading}
            className="coarse:min-h-11 flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={15} />
            Request Changes
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading}
            className="coarse:min-h-11 flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-rose-700 text-rose-700 hover:bg-rose-700 hover:text-white transition-colors"
          >
            <XCircle size={15} />
            Reject
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            rows={3}
            placeholder="Please tell us why you are rejecting this quotation so we can improve…"
            className="field w-full"
          />
          <div className="flex gap-2">
            <button
              onClick={() => patch('rejected', { rejection_reason: rejectionReason })}
              disabled={loading}
              className="coarse:min-h-11 px-4 py-2.5 text-sm font-semibold bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting…' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              className="coarse:min-h-11 px-4 py-2.5 text-sm font-medium border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
