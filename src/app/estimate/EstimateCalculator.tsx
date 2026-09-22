'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Calculator, ArrowRight, CheckCircle,
  Home, Layers, Paintbrush, Wrench, Zap, Droplets,
  ChevronDown, ChevronUp, Info,
} from 'lucide-react'
import { SizeInput } from '@/components/size/SizeInput'
import { ESTIMATOR_SCOPE_TO_LEAD, NCR_CITIES, QUALITY_TIERS, SERVICE_BASE, calcEstimate, formatINR, type QualityTier } from '@/lib/estimate'
import { DEFAULT_SIZE, computeSize, encodeSize, formatSqft, sizePayload, type SizeValue } from '@/lib/size'

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'Full Home Renovation': <Home size={18} />,
  'Modular Kitchen':      <Layers size={18} />,
  'Home Renovation':      <Wrench size={18} />,
  'Painting':             <Paintbrush size={18} />,
  'Flooring':             <Layers size={18} />,
  'False Ceiling':        <Home size={18} />,
  'Bathroom Renovation':  <Droplets size={18} />,
  'Electrical':           <Zap size={18} />,
  'Plumbing':             <Droplets size={18} />,
  'Carpentry & Wardrobes':<Wrench size={18} />,
}


export interface InitialEstimate { size?: SizeValue | null; scope?: string[]; quality?: QualityTier }

export default function EstimateCalculator({ initial }: { initial?: InitialEstimate }) {
  const [size, setSize] = useState<SizeValue>(initial?.size ?? { ...DEFAULT_SIZE, bhk: '2BHK' })
  const [quality, setQuality] = useState<QualityTier>(initial?.quality ?? 'Standard')
  const [selected, setSelected] = useState<string[]>(initial?.scope?.length ? initial.scope : ['Full Home Renovation'])
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [lead, setLead] = useState({ name: '', mobile: '', city: 'Delhi' })
  const [leadState, setLeadState] = useState<'idle' | 'form' | 'sending' | 'done' | 'error'>('idle')
  const [leadError, setLeadError] = useState('')

  const sizeRes = useMemo(() => computeSize(size), [size])
  const sqft = sizeRes.areaSqft
  const needsSize = sqft === 0 && selected.some((k) => SERVICE_BASE[k]?.unit === 'sqft')

  const breakdown = selected.map((key) => {
    const meta = SERVICE_BASE[key]
    if (!meta) return null
    const est = calcEstimate(key, sqft, quality)
    return { key, label: meta.label, note: meta.note, ...est }
  }).filter(Boolean) as { key: string; label: string; note: string; low: number; high: number }[]

  const totalLow  = breakdown.reduce((s, b) => s + b.low,  0)
  const totalHigh = breakdown.reduce((s, b) => s + b.high, 0)

  const leadScope = selected.map((k) => ESTIMATOR_SCOPE_TO_LEAD[k]).filter(Boolean)
  const handoff = `/get-started?${encodeSize(size)}&scope=${encodeURIComponent(leadScope.join(','))}&quality=${quality}&lo=${totalLow}&hi=${totalHigh}`
  const sizeLabel = size.mode === 'bhk_preset' ? `${size.bhk} · ${formatSqft(sqft)}` : size.mode === 'room_wise' ? `${sizeRes.rooms.length} rooms · ${formatSqft(sqft)}` : formatSqft(sqft)

  async function submitLead() {
    setLeadError('')
    if (lead.name.trim().length < 2) return setLeadError('Please enter your name')
    if (!/^\+?\d{10,13}$/.test(lead.mobile.replace(/[\s()-]/g, ''))) return setLeadError('Please enter a valid mobile number')
    setLeadState('sending')
    try {
      const sz = sizePayload(size)
      const res = await fetch('/api/renovation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: lead.city,
          locality: 'To be confirmed',
          propertyType: size.mode === 'bhk_preset' ? size.bhk : 'Other',
          scope: leadScope.length ? leadScope : ['other'],
          fullName: lead.name.trim(),
          mobile: lead.mobile,
          notes: `Saved from the cost estimator (${quality} finish).`,
          sizeMode: sz?.sizeMode, areaSqft: sz?.areaSqft, rooms: sz?.rooms, estimateLow: totalLow, estimateHigh: totalHigh,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Could not save')
      setLeadState('done')
    } catch (e) {
      setLeadError(e instanceof Error ? e.message : 'Something went wrong')
      setLeadState('form')
    }
  }

  function toggleService(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    )
  }

  return (
    <main className="min-h-screen bg-paper-100 pt-20">

      {/* ── Hero ── */}
      <section className="container-site py-14">
        <div className="max-w-2xl">
          <p className="label mb-3">Delhi NCR renovation pricing</p>
          <h1 className="text-4xl lg:text-5xl font-semibold text-stone-900 tracking-tight mb-4">
            How much will your<br />
            <span className="text-cobalt-500">renovation cost?</span>
          </h1>
          <p className="text-lg text-stone-500 leading-relaxed">
            Get an indicative estimate based on your home size, scope and finish quality. Serving Delhi, Noida, Greater Noida, Ghaziabad, Gurugram and Faridabad.
          </p>
          <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 inline-block">
            All figures are indicative estimates only. Final pricing is based on site inspection, measurements and detailed quotation.
          </p>
        </div>
      </section>

      {/* ── Calculator ── */}
      <section className="container-site pb-16">
        <div className="grid lg:grid-cols-5 gap-8">

          {/* Left: Inputs */}
          <div className="lg:col-span-2 space-y-6">

            {/* Size */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Home size</label>
              <SizeInput value={size} onChange={setSize} />
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Finish Quality</label>
              <p className="text-xs text-stone-400 mb-2">Essential ≈ ₹800–1200/sqft · Standard ≈ ₹1200–2000 · Premium ≈ ₹2000–3000 · Luxury ≈ ₹3000+</p>
              <div className="grid grid-cols-2 gap-2">
                {QUALITY_TIERS.map((q) => (
                  <button key={q} onClick={() => setQuality(q)}
                    className={`py-2.5 text-sm font-medium border transition-all ${
                      quality === q ? 'bg-cobalt-500 text-white border-cobalt-500' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                  >{q}</button>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Scope of Work</label>
              <div className="space-y-2">
                {Object.keys(SERVICE_BASE).map((key) => (
                  <button key={key} onClick={() => toggleService(key)}
                    className={`w-full flex items-center gap-3 p-3 border text-left transition-all ${
                      selected.includes(key) ? 'border-cobalt-300 bg-cobalt-50' : 'border-ink-900/15 bg-white hover:border-ink-900/50'
                    }`}
                  >
                    <div className={`h-8 w-8 flex items-center justify-center shrink-0 ${
                      selected.includes(key) ? 'bg-cobalt-500 text-white' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {SERVICE_ICONS[key]}
                    </div>
                    <span className={`text-sm font-medium ${selected.includes(key) ? 'text-cobalt-700' : 'text-stone-700'}`}>{key}</span>
                    {selected.includes(key) && <CheckCircle size={15} className="ml-auto text-cobalt-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Output */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-4">

              <div className="border border-ink-900/15 bg-white p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Calculator size={16} className="text-cobalt-500" />
                  <p className="panel-title">Indicative Cost Range</p>
                </div>

                {selected.length === 0 || needsSize ? (
                  <p className="text-stone-400 text-sm mt-4">{selected.length === 0 ? 'Select at least one scope of work to see an estimate.' : 'Enter your home size on the left to see an estimate.'}</p>
                ) : (
                  <>
                    <div className="mt-4 mb-5">
                      <p className="text-4xl font-bold text-stone-900 tracking-tight">
                        {formatINR(totalLow)} – {formatINR(totalHigh)}
                      </p>
                      <p className="text-sm text-stone-500 mt-1">
                        Delhi NCR · {sizeLabel} · {quality} finish
                      </p>
                    </div>

                    <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 mb-5">
                      <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        <strong>Indicative estimate only.</strong> Final pricing depends on site condition, measurements, scope, material selection and the final BOQ. A site visit is required before any quotation is issued.
                      </p>
                    </div>

                    <button onClick={() => setShowBreakdown(!showBreakdown)}
                      className="flex items-center gap-1.5 text-sm font-medium text-cobalt-600 hover:text-cobalt-700 mb-3"
                    >
                      {showBreakdown ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      {showBreakdown ? 'Hide' : 'Show'} service breakdown
                    </button>

                    {showBreakdown && (
                      <div className="space-y-2 mb-5">
                        {breakdown.map((b) => (
                          <div key={b.key} className="flex items-start justify-between gap-2 py-2 border-t border-stone-100">
                            <div>
                              <p className="text-sm font-medium text-stone-800">{b.label}</p>
                              <p className="text-xs text-stone-400">{b.note}</p>
                            </div>
                            <p className="text-sm font-semibold text-stone-900 shrink-0">{formatINR(b.low)}–{formatINR(b.high)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {leadState === 'done' ? (
                      <div className="flex items-center gap-2 p-3 bg-sage-50 border border-sage-200">
                        <CheckCircle size={16} className="text-sage-700 shrink-0" />
                        <p className="text-sm text-sage-700 font-medium">Saved. Our team will call you to schedule a free site visit.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link href={handoff}
                          className="flex items-center justify-center gap-2 w-full py-3 bg-ink-900 text-white text-sm font-semibold hover:bg-cobalt-500 transition-colors"
                        >
                          Request a site visit &amp; exact quote <ArrowRight size={16} />
                        </Link>
                        {leadState === 'idle' ? (
                          <button onClick={() => setLeadState('form')}
                            className="flex items-center justify-center gap-2 w-full py-3 border-2 border-ink-900 text-ink-900 text-sm font-semibold hover:bg-paper-100 transition-colors"
                          >
                            Save this estimate &amp; call me back
                          </button>
                        ) : (
                          <div className="border-2 border-ink-900 p-4 space-y-3">
                            <div className="grid sm:grid-cols-2 gap-2">
                              <input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} placeholder="Your name" className="field" />
                              <input value={lead.mobile} inputMode="tel" onChange={(e) => setLead({ ...lead, mobile: e.target.value })} placeholder="Mobile number" className="field" />
                            </div>
                            <select value={lead.city} onChange={(e) => setLead({ ...lead, city: e.target.value })} className="field w-full">
                              {NCR_CITIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                            {leadError && <p className="text-xs font-medium text-cobalt-700">{leadError}</p>}
                            <button onClick={submitLead} disabled={leadState === 'sending'}
                              className="w-full py-2.5 bg-ink-900 text-white text-sm font-semibold hover:bg-cobalt-500 transition-colors disabled:opacity-50">
                              {leadState === 'sending' ? 'Saving…' : 'Save & request a call back'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border border-stone-100 bg-stone-50 p-5">
                <p className="panel-title mb-3">What&apos;s typically included</p>
                <div className="space-y-2">
                  {[
                    'Material cost at selected quality tier',
                    'Skilled labour and site supervision',
                    'Project management and coordination',
                    'GST-compliant tax invoice',
                    'Milestone-based payment structure',
                    'Post-completion warranty support',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle size={12} className="text-sage-500 shrink-0" />
                      <span className="text-xs text-stone-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-cobalt-100 bg-cobalt-50 p-5">
                <p className="text-sm font-semibold text-cobalt-900 mb-2">Delhi NCR market context (2025–26)</p>
                <div className="space-y-1.5 text-xs text-cobalt-700">
                  <p>• Basic / Essential: approximately ₹800–1,200/sq ft</p>
                  <p>• Standard / Mid-range: approximately ₹1,200–2,000/sq ft</p>
                  <p>• Premium: approximately ₹2,000–3,000+/sq ft</p>
                  <p>• Luxury: ₹3,000–4,000+ depending on materials</p>
                  <p className="text-cobalt-500 mt-2">Full 3BHK projects typically range ₹12–38L+ depending on scope and specification.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
