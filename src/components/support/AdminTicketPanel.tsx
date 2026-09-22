'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Textarea } from '@/components/ui/shared'
import { STATUS_LABEL, type TicketStatus } from '@/lib/support/types'

const STATUS_OPTIONS: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']
const box = 'border-2 border-ink-900 bg-white p-5'
const h = 'mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60'

export function AdminTicketPanel({ id, status }: { id: string; status: TicketStatus }) {
  const router = useRouter()
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function post(body: Record<string, unknown>, key: string, after?: () => void) {
    setBusy(key); setMsg(null)
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setMsg({ ok: false, text: data.error ?? 'Action failed' }); return }
      after?.()
      setMsg({ ok: true, text: 'Saved' })
      router.refresh()
    } finally { setBusy('') }
  }

  return (
    <div className="space-y-6">
      {msg && <p role="status" className={`border p-3 text-sm ${msg.ok ? 'border-sage-500/40 bg-sage-50 text-sage-900' : 'border-rose-300 bg-rose-50 text-rose-700'}`}>{msg.text}</p>}

      <section className={box}>
        <h2 className={h}>Reply to the customer</h2>
        <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Your reply — sent by email and shown on their ticket." aria-label="Reply" />
        <Button size="sm" className="mt-3" loading={busy === 'reply'} disabled={!reply.trim()} onClick={() => post({ action: 'reply', body: reply }, 'reply', () => setReply(''))}>Send reply</Button>
      </section>

      <section className={box}>
        <h2 className={h}>Status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <Button key={s} size="sm" variant={s === status ? 'primary' : 'secondary'} loading={busy === `s-${s}`} disabled={s === status}
              onClick={() => post({ action: 'status', status: s }, `s-${s}`)}>
              {STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      </section>
    </div>
  )
}
