'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, MessageCircle } from 'lucide-react'

interface Message {
  id: string
  sender: 'homeowner' | 'homeserve'
  body: string | null
  attachment_urls: string[]
  created_at: string
}

export default function ProjectMessagesSection({ bookingId }: { bookingId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const res = await fetch(`/api/project-messages?booking_id=${bookingId}`)
    if (res.ok) setMessages(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [bookingId])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setSending(true)
    const res = await fetch('/api/project-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId, body: input.trim() }),
    })
    setSending(false)
    if (res.ok) {
      setInput('')
      load()
    }
  }

  return (
    <div className="p-5 bg-white border border-ink-900/15 ">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={15} className="text-stone-400" />
        <h2 className="panel-title">Messages</h2>
      </div>

      <div className="min-h-[160px] max-h-64 overflow-y-auto space-y-2 mb-4 bg-stone-50 p-3">
        {loading ? (
          <div className="flex items-center justify-center h-16">
            <Loader2 size={16} className="animate-spin text-stone-500" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-6">
            Send a message to your HomeServe project team
          </p>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === 'homeowner' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 text-xs ${
                m.sender === 'homeowner'
                  ? 'bg-cobalt-500 text-white rounded-br-sm'
                  : 'bg-white border border-stone-200 text-stone-700 rounded-bl-sm'
              }`}>
                {m.body && <p>{m.body}</p>}
                <p className={`text-[0.6875rem] mt-1 ${m.sender === 'homeowner' ? 'text-white/90' : 'text-stone-400'}`}>
                  {m.sender === 'homeowner' ? 'You' : 'HomeServe'} ·{' '}
                  {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Message your HomeServe team…"
          className="field flex-1"
        />
        <button type="submit" aria-label="Send message" disabled={sending || !input.trim()}
          className="coarse:min-h-11 flex items-center gap-1.5 px-4 py-2.5 bg-ink-900 text-white text-xs font-semibold hover:bg-cobalt-600 disabled:opacity-50 transition-colors"
        >
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </form>
      <p className="text-[11px] text-stone-400 mt-2">
        Our team typically responds within a few hours during business hours.
      </p>
    </div>
  )
}
