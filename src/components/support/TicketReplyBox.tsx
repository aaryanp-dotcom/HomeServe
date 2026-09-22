'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function TicketReplyBox({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    if (!body.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not send your message'); return }
      setBody('')
      router.refresh()
    } catch {
      setError('Could not send your message. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="field" placeholder="Add to this ticket…" aria-label="Reply" />
      <Button size="sm" loading={loading} disabled={!body.trim()} onClick={send}>Send</Button>
    </div>
  )
}
