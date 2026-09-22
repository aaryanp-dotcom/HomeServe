'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, CheckCircle, XCircle, RefreshCw, Send } from 'lucide-react'
import Link from 'next/link'

interface Props {
  quotationId: string
  status: string
  isAdmin: boolean
  requestId?: string | null
}

export default function QuotationActions({ quotationId, status, isAdmin, requestId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const updateStatus = async (newStatus: string, extra?: Record<string, string>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extra }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-wrap gap-3 print:hidden">

      {/* Print / PDF */}
      <button onClick={handlePrint}
        className="coarse:min-h-11 flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white transition-colors"
      >
        <Printer size={15} /> Download / Print PDF
      </button>

      {/* Admin actions */}
      {isAdmin && (
        <>
          {status === 'draft' && (
            <button onClick={() => updateStatus('sent')} disabled={loading}
              className="coarse:min-h-11 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 disabled:opacity-50 transition-colors"
            >
              <Send size={15} /> Mark as Sent
            </button>
          )}
          {requestId && (
            <Link href={`/admin/leads/${requestId}`}
              className="coarse:min-h-11 flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white transition-colors"
            >
              Back to Lead
            </Link>
          )}
        </>
      )}

      {/* Customer actions */}
      {!isAdmin && (status === 'sent' || status === 'viewed') && (
        <>
          {!showRejectForm ? (
            <>
              <button onClick={() => updateStatus('accepted')} disabled={loading}
                className="coarse:min-h-11 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 disabled:opacity-50 transition-colors"
              >
                <CheckCircle size={15} /> Accept Quotation
              </button>
              <button onClick={() => setShowRejectForm(true)}
                className="coarse:min-h-11 flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-rose-700 text-rose-700 hover:bg-rose-700 hover:text-white transition-colors"
              >
                <XCircle size={15} /> Reject
              </button>
              <button onClick={() => updateStatus('revision_requested')} disabled={loading}
                className="coarse:min-h-11 flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white transition-colors"
              >
                <RefreshCw size={15} /> Request Changes
              </button>
            </>
          ) : (
            <div className="w-full space-y-3">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Please tell us why you are rejecting this quotation…"
                className="field w-full"
              />
              <div className="flex gap-2">
                <button onClick={() => updateStatus('rejected', { rejection_reason: rejectionReason })} disabled={loading}
                  className="coarse:min-h-11 px-4 py-2.5 text-sm font-semibold bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 transition-colors"
                >
                  Confirm Rejection
                </button>
                <button onClick={() => setShowRejectForm(false)}
                  className="coarse:min-h-11 px-4 py-2.5 text-sm font-medium border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {status === 'accepted' && !isAdmin && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-sage-700 bg-sage-50 border border-sage-200 ">
          <CheckCircle size={15} className="text-sage-700" />
          Quotation accepted — our team will contact you to start the project.
        </div>
      )}
    </div>
  )
}
