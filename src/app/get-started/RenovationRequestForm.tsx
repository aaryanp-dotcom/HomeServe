'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SizeInput } from '@/components/size/SizeInput'
import { DEFAULT_SIZE, computeSize, formatBoth, sizePayload, type SizeValue } from '@/lib/size'
import {
  ArrowRight, ArrowLeft, CheckCircle, Home,
  MapPin, Calendar, Upload, User, Phone, Mail,
  Wrench, Paintbrush, Layers, Droplets, Zap, TreePine,
  Clock, DollarSign,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1 — Property
  city: string
  locality: string
  propertyType: string
  bhk: string
  approximateArea: string
  isNewProperty: boolean
  // Step 2 — Scope
  scope: string[]
  scopeOther: string
  // Step 3 — Budget & Timeline
  budget: string
  timeline: string
  // Step 4 — Inspiration
  inspirationTheme: string
  notes: string
  // Step 5 — Contact
  fullName: string
  mobile: string
  email: string
  preferredContactTime: string
}

// ── Config ────────────────────────────────────────────────────────────────────

const NCR_CITIES = ['Delhi', 'Noida', 'Greater Noida', 'Ghaziabad', 'Gurugram', 'Faridabad']

const LOCALITY_HINTS: Record<string, string> = {
  Delhi: 'e.g. Vasant Kunj, Lajpat Nagar, Dwarka Sector 12',
  Noida: 'e.g. Sector 50, Sector 137, Sector 62',
  'Greater Noida': 'e.g. Sector Beta 2, Knowledge Park, Omicron',
  Ghaziabad: 'e.g. Indirapuram, Vaishali, Raj Nagar Extension',
  Gurugram: 'e.g. DLF Phase 2, Sector 56, South City',
  Faridabad: 'e.g. Sector 15, NIT, Green Field Colony',
}

const PROPERTY_TYPES = ['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Independent House', 'Other']

const SCOPE_OPTIONS = [
  { id: 'full_home',    icon: Home,       label: 'Full Home Renovation' },
  { id: 'kitchen',      icon: Layers,     label: 'Kitchen' },
  { id: 'bathroom',     icon: Droplets,   label: 'Bathroom' },
  { id: 'living_room',  icon: Wrench,     label: 'Living Room' },
  { id: 'bedroom',      icon: Home,       label: 'Bedroom' },
  { id: 'painting',     icon: Paintbrush, label: 'Painting' },
  { id: 'flooring',     icon: Layers,     label: 'Flooring' },
  { id: 'false_ceiling',icon: TreePine,   label: 'False Ceiling' },
  { id: 'electrical',   icon: Zap,        label: 'Electrical' },
  { id: 'plumbing',     icon: Droplets,   label: 'Plumbing' },
  { id: 'carpentry',    icon: Wrench,     label: 'Carpentry & Wardrobes' },
  { id: 'civil_work',   icon: Paintbrush, label: 'Civil & Masonry' },
  { id: 'other',        icon: Wrench,     label: 'Other' },
]

const BUDGET_OPTIONS = [
  { id: 'under_5L',   label: 'Under ₹5 lakh' },
  { id: '5_10L',      label: '₹5–10 lakh' },
  { id: '10_20L',     label: '₹10–20 lakh' },
  { id: '20_30L',     label: '₹20–30 lakh' },
  { id: '30L_plus',   label: '₹30 lakh+' },
  { id: 'not_sure',   label: 'Not sure yet' },
]

const TIMELINE_OPTIONS = [
  { id: 'immediately',     label: 'Immediately' },
  { id: 'within_1_month',  label: 'Within 1 month' },
  { id: '1_3_months',      label: '1–3 months' },
  { id: '3_6_months',      label: '3–6 months' },
  { id: 'just_exploring',  label: 'Just exploring' },
]

const CONTACT_TIMES = [
  'Morning (9am–12pm)',
  'Afternoon (12pm–5pm)',
  'Evening (5pm–8pm)',
  'Any time',
]

const STEPS = [
  { label: 'Property', icon: Home },
  { label: 'Scope',    icon: Wrench },
  { label: 'Budget',   icon: DollarSign },
  { label: 'Contact',  icon: User },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  defaultTheme?: string
  /** Prefill carried over from the estimator (size, scope, indicative range). */
  initial?: { size?: SizeValue | null; scope?: string[]; estimateLow?: number; estimateHigh?: number }
}

const BHK_TO_PROPERTY: Record<string, string> = { '1BHK': '1BHK', '2BHK': '2BHK', '3BHK': '3BHK', '4BHK': '4BHK', Villa: 'Villa' }

export default function RenovationRequestForm({ defaultTheme, initial }: Props) {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Size is optional: start on "Total area" (empty) so nothing is sent unless the visitor enters it.
  const [size, setSize] = useState<SizeValue>(initial?.size ?? { ...DEFAULT_SIZE, mode: 'total_area' })
  const sizeRes = computeSize(size)

  const [form, setForm] = useState<FormData>({
    city: '',
    locality: '',
    propertyType: initial?.size?.mode === 'bhk_preset' ? BHK_TO_PROPERTY[initial.size.bhk] ?? '' : '',
    bhk: '',
    approximateArea: '',
    isNewProperty: false,
    scope: initial?.scope ?? [],
    scopeOther: '',
    budget: '',
    timeline: '',
    inspirationTheme: defaultTheme ?? '',
    notes: '',
    fullName: '',
    mobile: '',
    email: '',
    preferredContactTime: '',
  })

  const set = (key: keyof FormData, value: string | boolean | string[]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleScope = (id: string) => {
    set('scope', form.scope.includes(id)
      ? form.scope.filter((s) => s !== id)
      : [...form.scope, id])
  }

  // Step validation
  const canProceed = () => {
    if (step === 0) return form.city && form.locality && form.propertyType && sizeRes.errors.length === 0
    if (step === 1) return form.scope.length > 0
    if (step === 2) return true // budget and timeline are optional
    if (step === 3) return form.fullName.trim() && /^\d{10}$/.test(form.mobile.replace(/\s/g, ''))
    return false
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/renovation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          approximateArea: sizeRes.areaSqft > 0 ? formatBoth(sizeRes.areaSqft) : '',
          ...(sizePayload(size) ?? {}),
          ...(initial?.estimateLow ? { estimateLow: initial.estimateLow, estimateHigh: initial.estimateHigh } : {}),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Submission failed')
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
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center py-16">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-soft bg-sage-100 mb-6">
            <CheckCircle size={28} className="text-sage-700" />
          </div>
          <h1 className="page-title">
            Request submitted!
          </h1>
          <p className="text-stone-500 leading-relaxed mb-8">
            Thank you, {form.fullName.split(' ')[0]}. Our team will review your renovation requirements and call you on{' '}
            <strong className="text-stone-800">{form.mobile}</strong> to schedule a consultation and site visit.
          </p>
          <div className="panel-warm p-4 bg-paper-50 text-left mb-8 space-y-2">
            <p className="panel-title mb-3">What happens next</p>
            {[
              'Our team reviews your requirement (within 24 hours)',
              'We call you to understand your project in detail',
              'We schedule a site visit at your convenience',
              'Post site visit, we prepare a detailed quotation',
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-cobalt-100 flex items-center justify-center text-cobalt-600 text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-stone-600">{s}</p>
              </div>
            ))}
          </div>
          <Link href="/" className="coarse:min-h-11 inline-flex items-center gap-2 text-sm text-cobalt-600 hover:text-cobalt-700 font-medium">
            <ArrowLeft size={14} /> Back to homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="container-site py-12 max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 mb-4">
            <ArrowLeft size={14} /> Back
          </Link>
          <h1 className="page-title">
            Start Your Renovation
          </h1>
          <p className="text-stone-500">
            Tell us about your project. Our team will contact you to schedule a consultation and site visit.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-1.5 ${i <= step ? 'text-cobalt-600' : 'text-stone-400'}`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < step  ? 'bg-cobalt-500 text-white' :
                  i === step ? 'bg-cobalt-100 text-cobalt-600 ring-2 ring-cobalt-300' :
                  'bg-stone-150 text-stone-400'
                }`}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${i < step ? 'bg-cobalt-300' : 'bg-stone-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white border border-ink-900/15 p-7">

          {/* ── Step 0: Property ── */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-stone-900">Property details</h2>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  <MapPin size={14} className="inline mr-1.5 text-cobalt-500" />
                  City *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {NCR_CITIES.map((c) => (
                    <button key={c} onClick={() => set('city', c)}
                      className={`py-2.5 px-3 text-sm font-medium border transition-all ${
                        form.city === c ? 'bg-cobalt-500 text-white border-cobalt-500' : 'bg-white text-stone-600 border-stone-200 hover:border-cobalt-300'
                      }`}
                    >{c}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Locality / Sector / Area *
                </label>
                <input aria-label="Locality / Sector / Area"
                  type="text"
                  value={form.locality}
                  onChange={(e) => set('locality', e.target.value)}
                  placeholder={form.city ? LOCALITY_HINTS[form.city] : 'Your locality or sector'}
                  className="field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Property type *</label>
                <div className="grid grid-cols-2 min-[520px]:grid-cols-4 gap-2">
                  {PROPERTY_TYPES.map((t) => (
                    <button key={t} onClick={() => set('propertyType', t)}
                      className={`py-2 px-2 coarse:min-h-11 text-xs font-medium border text-center transition-all ${
                        form.propertyType === t ? 'bg-cobalt-500 text-white border-cobalt-500' : 'bg-white text-stone-600 border-stone-200 hover:border-cobalt-300'
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Property size <span className="font-normal text-stone-400">— optional, helps us prepare a better quote</span></label>
                <p className="text-xs text-stone-400 mb-2">Pick a flat type, type the total area, or enter each room&apos;s length × width. Approximate is fine — we measure on the site visit.</p>
                <SizeInput
                  value={size}
                  onChange={(v) => {
                    setSize(v)
                    if (v.mode === 'bhk_preset' && !form.propertyType) set('propertyType', BHK_TO_PROPERTY[v.bhk] ?? '')
                  }}
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNewProperty}
                  onChange={(e) => set('isNewProperty', e.target.checked)}
                  className="h-4 w-4 accent-cobalt-500"
                />
                <span className="text-sm text-stone-600">New / under-construction property</span>
              </label>
            </div>
          )}

          {/* ── Step 1: Scope ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-stone-900">What do you need? *</h2>
              <p className="text-sm text-stone-500">Select all that apply</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SCOPE_OPTIONS.map(({ id, icon: Icon, label }) => (
                  <button key={id} onClick={() => toggleScope(id)}
                    className={`flex items-center gap-2.5 p-3 border text-left transition-all ${
                      form.scope.includes(id) ? 'border-cobalt-400 bg-cobalt-50' : 'border-stone-200 bg-white hover:border-cobalt-200'
                    }`}
                  >
                    <div className={`h-7 w-7 flex items-center justify-center shrink-0 ${
                      form.scope.includes(id) ? 'bg-cobalt-500 text-white' : 'bg-stone-100 text-stone-500'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <span className={`text-xs font-medium ${form.scope.includes(id) ? 'text-cobalt-700' : 'text-stone-700'}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
              {form.scope.includes('other') && (
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Please describe</label>
                  <textarea aria-label="Please describe"
                    value={form.scopeOther}
                    onChange={(e) => set('scopeOther', e.target.value)}
                    rows={2}
                    placeholder="Describe the additional work needed"
                    className="field w-full"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Additional notes (optional)</label>
                <textarea aria-label="Additional notes (optional)"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                  placeholder="Describe any specific requirements, preferences, or concerns…"
                  className="field w-full"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Budget & Timeline ── */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-stone-900">Budget &amp; Timeline</h2>
              <p className="text-sm text-stone-500">Both are optional — skip if unsure.</p>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-3">
                  <DollarSign size={14} className="text-cobalt-500" />
                  Approximate budget
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BUDGET_OPTIONS.map((b) => (
                    <button key={b.id} onClick={() => set('budget', form.budget === b.id ? '' : b.id)}
                      className={`py-2.5 px-3 text-sm font-medium border text-center transition-all ${
                        form.budget === b.id ? 'bg-cobalt-500 text-white border-cobalt-500' : 'bg-white text-stone-600 border-stone-200 hover:border-cobalt-300'
                      }`}
                    >{b.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-3">
                  <Calendar size={14} className="text-cobalt-500" />
                  When do you want to start?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIMELINE_OPTIONS.map((t) => (
                    <button key={t.id} onClick={() => set('timeline', form.timeline === t.id ? '' : t.id)}
                      className={`py-2.5 px-3 text-sm font-medium border text-left transition-all ${
                        form.timeline === t.id ? 'bg-cobalt-500 text-white border-cobalt-500' : 'bg-white text-stone-600 border-stone-200 hover:border-cobalt-300'
                      }`}
                    >{t.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2">
                  <Upload size={14} className="text-cobalt-500" />
                  Upload photos, floor plan or inspiration (optional)
                </label>
                <div className="border-2 border-dashed border-stone-200 p-6 text-center hover:border-cobalt-300 transition-colors cursor-pointer">
                  <Upload size={20} className="mx-auto text-stone-300 mb-2" />
                  <p className="text-sm text-stone-400">Drag &amp; drop or click to upload</p>
                  <p className="text-xs text-stone-300 mt-1">Photos, floor plans, inspiration images (max 10MB each)</p>
                  <p className="text-xs text-stone-400 mt-2 italic">File upload available after account creation</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Contact ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-stone-900">Your contact details</h2>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 mb-1.5">
                  <User size={13} /> Full name *
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  placeholder="Your full name"
                  className="field w-full"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 mb-1.5">
                  <Phone size={13} /> Mobile number *
                </label>
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => set('mobile', e.target.value)}
                  placeholder="10-digit mobile number"
                  className="field w-full"
                />
                <p className="text-xs text-stone-400 mt-1">Our team will call you on this number to confirm the site visit.</p>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 mb-1.5">
                  <Mail size={13} /> Email address (optional)
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="your@email.com"
                  className="field w-full"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 mb-2">
                  <Clock size={13} /> Preferred contact time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTACT_TIMES.map((t) => (
                    <button key={t} onClick={() => set('preferredContactTime', form.preferredContactTime === t ? '' : t)}
                      className={`py-2 px-3 text-sm border text-left transition-all ${
                        form.preferredContactTime === t ? 'bg-cobalt-500 text-white border-cobalt-500' : 'bg-white text-stone-600 border-stone-200 hover:border-cobalt-300'
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-stone-50 border border-ink-900/15 space-y-1.5">
                <p className="panel-title mb-2">Your request summary</p>
                <p className="text-sm text-stone-700"><span className="text-stone-400">Location:</span> {form.locality}, {form.city}</p>
                <p className="text-sm text-stone-700"><span className="text-stone-400">Property:</span> {form.propertyType} {sizeRes.areaSqft > 0 ? `· ${formatBoth(sizeRes.areaSqft)}` : ''}</p>
                <p className="text-sm text-stone-700"><span className="text-stone-400">Scope:</span> {form.scope.map(s => SCOPE_OPTIONS.find(o => o.id === s)?.label ?? s).join(', ')}</p>
                {form.budget && <p className="text-sm text-stone-700"><span className="text-stone-400">Budget:</span> {BUDGET_OPTIONS.find(b => b.id === form.budget)?.label}</p>}
                {form.timeline && <p className="text-sm text-stone-700"><span className="text-stone-400">Timeline:</span> {TIMELINE_OPTIONS.find(t => t.id === form.timeline)?.label}</p>}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)}
                className="coarse:min-h-11 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink-900 border-2 border-ink-900 hover:bg-ink-900 hover:text-white transition-colors"
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="coarse:min-h-11 flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="coarse:min-h-11 flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit Renovation Request'}
                {!submitting && <ArrowRight size={15} />}
              </button>
            )}
          </div>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap justify-center gap-6 mt-6">
          {[
            { icon: <CheckCircle size={13} />, text: 'No obligation — consultation is free' },
            { icon: <MapPin size={13} />,      text: 'Serving Delhi NCR only' },
            { icon: <Clock size={13} />,        text: 'Response within 24 hours' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-stone-400">
              <span className="text-cobalt-400">{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
