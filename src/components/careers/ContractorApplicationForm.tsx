'use client'

import { useState } from 'react'
import { CheckCircle, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PrivacyNotice } from '@/components/privacy/PrivacyNotice'
import { SERVICE_CATEGORIES } from '@/types'

interface FormState {
  fullName: string
  email: string
  phone: string
  city: string
  experienceYears: string
  specializations: string[]
  message: string
  honeypot: string
}

const INITIAL: FormState = {
  fullName: '', email: '', phone: '', city: '', experienceYears: '',
  specializations: [], message: '', honeypot: '',
}

export function ContractorApplicationForm() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleSpecialization = (id: string) => {
    set('specializations', form.specializations.includes(id)
      ? form.specializations.filter((s) => s !== id)
      : [...form.specializations, id])
  }

  const canSubmit = form.fullName.trim().length >= 2
    && /^[6-9]\d{9}$/.test(form.phone)
    && form.specializations.length > 0
    && privacyAccepted
    && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/contractor-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim(),
          city: form.city.trim() || undefined,
          experienceYears: form.experienceYears ? Number(form.experienceYears) : 0,
          specializations: form.specializations,
          message: form.message.trim() || undefined,
          honeypot: form.honeypot,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Could not submit your application')
      }
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white border border-ink-900/15 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-soft bg-sage-100">
          <CheckCircle size={26} className="text-sage-700" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink-900 mb-2">Application received</h2>
        <p className="text-sm text-stone-500 max-w-sm mx-auto">
          Thanks, {form.fullName.split(' ')[0]}. Our team will review your application and reach
          out if it&apos;s a fit — we don&apos;t create or assign any account automatically.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-ink-900/15 p-6 sm:p-8 space-y-5">
      {error && <p className="text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2.5">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Full name" required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Ravi Kumar" />
        <Input label="Mobile number" required type="tel" inputMode="numeric" maxLength={10}
          value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" />
        <Input label="Email (optional)" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
        <Input label="City" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Noida" />
        <Input label="Years of experience" type="number" min={0} max={60} value={form.experienceYears}
          onChange={(e) => set('experienceYears', e.target.value)} placeholder="5" />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-800 mb-2">What do you specialise in?</label>
        <div className="flex flex-wrap gap-2">
          {SERVICE_CATEGORIES.map((cat) => {
            const active = form.specializations.includes(cat)
            return (
              <button key={cat} type="button" onClick={() => toggleSpecialization(cat)}
                className={`coarse:min-h-11 flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? 'border-cobalt-400 bg-cobalt-50 text-cobalt-700' : 'border-stone-200 bg-white text-stone-600 hover:border-cobalt-200'
                }`}
              >
                {active && <Wrench size={11} />} {cat}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="ca-message" className="block text-sm font-medium text-ink-800 mb-1.5">Tell us about your work (optional)</label>
        <textarea id="ca-message" rows={4} value={form.message} onChange={(e) => set('message', e.target.value)}
          placeholder="Past projects, tools you bring, availability…" className="field" />
      </div>

      {/* Honeypot — real visitors never see or fill this */}
      <input type="text" name="website" value={form.honeypot} onChange={(e) => set('honeypot', e.target.value)}
        className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <PrivacyNotice accepted={privacyAccepted} onAcceptChange={setPrivacyAccepted} context="contractor_application" />

      <Button type="submit" size="lg" fullWidth loading={submitting} disabled={!canSubmit}>
        Submit application
      </Button>
    </form>
  )
}
