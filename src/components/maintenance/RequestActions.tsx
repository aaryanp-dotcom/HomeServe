'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Textarea } from '@/components/ui/shared'
import type { RequestStatus } from '@/lib/maintenance/config'
import { CUSTOMER_CANCELLABLE } from '@/lib/maintenance/config'

/** What the customer can do to their own request, driven by its status. */
export function RequestActions({ id, status, section = 'all' }: { id: string; status: RequestStatus; section?: 'all' | 'confirm' | 'rest' }) {
  const router = useRouter()
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [issue, setIssue] = useState('')
  const [showIssue, setShowIssue] = useState(false)

  async function act(body: Record<string, unknown>, key: string) {
    setBusy(key); setError('')
    try {
      const res = await fetch(`/api/maintenance/requests/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'That did not work. Please try again.'); return false }
      router.refresh()
      return true
    } finally { setBusy('') }
  }

  const canMessage = !['closed', 'cancelled'].includes(status)
  const showConfirm = section !== 'rest' && status === 'completed'
  const showRest = section !== 'confirm'
  if (section === 'confirm' && !showConfirm) return null
  return (
    <div className="space-y-5">
      {showConfirm && (
        <div className="border-2 border-ink-900 bg-white p-4">
          <p className="font-semibold text-ink-900">Is everything sorted?</p>
          <p className="mt-1 text-sm text-stone-600">Confirm that the work is done to your satisfaction, or tell us what is not right and we will look at it again.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button loading={busy === 'confirm'} onClick={() => act({ action: 'confirm' }, 'confirm')}>Yes, confirm completion</Button>
            <Button variant="secondary" onClick={() => setShowIssue((v) => !v)}>Something is not right</Button>
          </div>
          {showIssue && (
            <div className="mt-3 space-y-2">
              <Textarea rows={3} value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="What still needs attention?" aria-label="What still needs attention" />
              <Button size="sm" loading={busy === 'reopen'} disabled={issue.trim().length < 3}
                onClick={async () => { if (await act({ action: 'reopen', note: issue }, 'reopen')) { setIssue(''); setShowIssue(false) } }}>
                Send to HomeServe
              </Button>
            </div>
          )}
        </div>
      )}

      {showRest && canMessage && (
        <div className="space-y-2">
          <Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message HomeServe about this request…" aria-label="Message HomeServe" />
          <Button size="sm" variant="secondary" loading={busy === 'message'} disabled={!message.trim()}
            onClick={async () => { if (await act({ action: 'message', body: message }, 'message')) setMessage('') }}>
            Send message
          </Button>
        </div>
      )}

      {showRest && CUSTOMER_CANCELLABLE.includes(status) && (
        <button type="button" disabled={!!busy}
          onClick={() => { if (window.confirm('Cancel this request?')) void act({ action: 'cancel' }, 'cancel') }}
          className="text-sm font-medium text-rose-700 underline-offset-4 hover:underline">
          Cancel this request
        </button>
      )}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    </div>
  )
}
