'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORY_LABEL, type TicketCategory } from '@/lib/support/types'

interface Props {
  defaultName?: string
  defaultEmail?: string
  defaultPhone?: string
  defaultCategory?: TicketCategory
  /** 'dashboard' additionally requires the signed-in customer to have an active or past service —
   *  the server enforces this regardless of what's passed here, this just picks the right error copy. */
  source?: 'contact_form' | 'dashboard'
  /** Called after a successful submit, with the new ticket's number and id. Omit to just show an
   *  inline "message sent" state in place of the form. */
  onSuccess?: (result: { ticketNumber: string; id: string }) => void
}

const CATEGORIES = Object.keys(CATEGORY_LABEL) as TicketCategory[]

export function TicketForm({ defaultName = '', defaultEmail = '', defaultPhone = '', defaultCategory = 'general', source = 'contact_form', onSuccess }: Props) {
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [phone, setPhone] = useState(defaultPhone)
  const [category, setCategory] = useState<TicketCategory>(defaultCategory)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentNumber, setSentNumber] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone || undefined, subject, category, message, honeypot, source }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not send your message. Please try again.'); return }
      if (onSuccess) onSuccess({ ticketNumber: data.ticket_number, id: data.id })
      else setSentNumber(data.ticket_number)
    } catch {
      setError('Could not send your message. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sentNumber) {
    return (
      <div className="panel-warm p-6 text-center">
        <p className="font-display text-lg font-bold text-ink-900">Message sent.</p>
        <p className="mt-2 text-sm text-stone-600">Reference <strong className="text-ink-900">{sentNumber}</strong>. We&apos;ll get back to you at {email} shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <p role="alert" className="border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {/* Hidden from real visitors; a bot filling every field trips it. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" autoCapitalize="none" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Mobile number (optional)" type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} autoComplete="tel-national" />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tf-category" className="text-sm font-medium text-ink-800">What is this about</label>
          <select id="tf-category" value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className="field">
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
        </div>
      </div>
      <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="A short summary" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tf-message" className="text-sm font-medium text-ink-800">Message</label>
        <textarea id="tf-message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} className="field" placeholder="Tell us what's going on — as much detail as helps." />
      </div>
      <Button type="submit" size="lg" fullWidth loading={loading}>Send message</Button>
    </form>
  )
}
