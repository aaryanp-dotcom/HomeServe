'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string
  category: string
  description: string
  qty: number
  unit: string
  rate: number
  amount: number
}

interface PaymentScheduleItem {
  milestone: string
  percentage: number
  amount: number
  description: string
}

interface Request {
  id: string
  request_number: string | null
  full_name: string
  mobile: string
  email?: string | null
  city: string
  locality: string
}

interface Props {
  requests: Request[]
  defaultRequest?: Record<string, unknown> | null
  /** Measured area from the latest site visit, else the customer's stated area. */
  defaultArea?: { sqft: number; source: 'measured' | 'stated' } | null
}

const UNITS = ['sqft', 'unit', 'rft', 'set', 'lot', 'job', 'nos', 'kg']
const CATEGORIES = [
  'Civil Work', 'Flooring', 'Tiling', 'Painting', 'False Ceiling',
  'Electrical', 'Plumbing', 'Carpentry', 'Modular Kitchen',
  'Wardrobe', 'Furniture', 'Glass & Aluminium', 'Miscellaneous',
]

function uid() {
  return Math.random().toString(36).slice(2)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuotationBuilder({ requests, defaultRequest, defaultArea }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill from request if provided
  const dr = defaultRequest as Record<string, string | null> | null

  const [requestId, setRequestId] = useState(dr?.id ?? '')
  const [customerName, setCustomerName] = useState(dr?.full_name ?? '')
  const [customerMobile, setCustomerMobile] = useState(dr?.mobile ?? '')
  const [customerEmail, setCustomerEmail] = useState(dr?.email ?? '')
  const [projectAddress, setProjectAddress] = useState(dr ? `${dr.locality ?? ''}, ${dr.city ?? ''}` : '')
  const [projectTitle, setProjectTitle] = useState('')
  const [projectArea, setProjectArea] = useState(defaultArea ? String(defaultArea.sqft) : '')
  const [projectScope, setProjectScope] = useState('')
  const [gstRate, setGstRate] = useState(18)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [validityDays, setValidityDays] = useState(30)
  const [termsAndConditions, setTermsAndConditions] = useState(
    `1. This quotation is valid for ${validityDays} days from the date of issue.\n` +
    `2. Prices are inclusive of labour, material (at selected specification) and project management.\n` +
    `3. Any additional scope or changes in specification will be quoted separately.\n` +
    `4. Payment terms as per the payment schedule agreed upon acceptance.\n` +
    `5. GST at ${gstRate}% is applicable on all services.\n` +
    `6. HomeServe's standard warranty terms apply.`
  )
  const [notes, setNotes] = useState('')

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: uid(), category: 'Civil Work', description: '', qty: 1, unit: 'sqft', rate: 0, amount: 0 },
  ])

  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([
    { milestone: 'Advance Payment', percentage: 30, amount: 0, description: 'On acceptance of quotation' },
    { milestone: 'Work in Progress', percentage: 40, amount: 0, description: 'Mid-project milestone' },
    { milestone: 'Completion & Handover', percentage: 30, amount: 0, description: 'On project completion' },
  ])

  const [showTerms, setShowTerms] = useState(false)

  // ── Calculations ──────────────────────────────────────────────────────────

  const subtotal = lineItems.reduce((s, item) => s + (item.amount || 0), 0)
  const gstAmount = Math.round(subtotal * gstRate / 100)
  const totalAmount = subtotal + gstAmount - discountAmount
  const areaNum = parseFloat(projectArea)
  const validArea = Number.isFinite(areaNum) && areaNum > 0
  const ratePerSqft = validArea ? Math.round(subtotal / areaNum) : null

  const updatePaymentAmounts = useCallback((total: number, schedule: PaymentScheduleItem[]) => {
    return schedule.map(item => ({
      ...item,
      amount: Math.round(total * item.percentage / 100),
    }))
  }, [])

  // ── Line item operations ──────────────────────────────────────────────────

  const addLineItem = () => {
    setLineItems(prev => [...prev, { id: uid(), category: 'Civil Work', description: '', qty: 1, unit: 'sqft', rate: 0, amount: 0 }])
  }

  /** Set qty = project area on every line item priced per sq ft, and recompute amounts. */
  const applyAreaToSqftItems = () => {
    if (!validArea) return
    setLineItems(prev => prev.map(item => item.unit === 'sqft' ? { ...item, qty: areaNum, amount: Math.round(areaNum * Number(item.rate)) } : item))
  }

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id))
  }

  const updateLineItem = (id: string, key: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [key]: value }
      if (key === 'qty' || key === 'rate') {
        updated.amount = Math.round(Number(updated.qty) * Number(updated.rate))
      }
      return updated
    }))
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSave = async (sendToCustomer = false) => {
    if (!customerName || !customerMobile || !projectAddress || !projectTitle) {
      setError('Please fill in all required fields')
      return
    }
    setSaving(true)
    setError('')
    try {
      const scheduleWithAmounts = updatePaymentAmounts(totalAmount, paymentSchedule)

      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId || null,
          customer_name: customerName,
          customer_mobile: customerMobile,
          customer_email: customerEmail || null,
          project_address: projectAddress,
          project_title: projectTitle,
          project_area_sqft: validArea ? areaNum : null,
          project_scope: projectScope || null,
          line_items: lineItems,
          subtotal,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          payment_schedule: scheduleWithAmounts,
          validity_days: validityDays,
          terms_and_conditions: termsAndConditions,
          notes: notes || null,
          status: sendToCustomer ? 'sent' : 'draft',
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to save quotation')
      }
      const data = await res.json()
      router.push(`/admin/quotations/${data.quotation.id}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Customer & Project details */}
      <div className="bg-white border border-ink-900/15 p-6 space-y-4">
        <h2 className="panel-title">Customer &amp; Project Details</h2>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">Link to Renovation Request (optional)</label>
          <select aria-label="Link to Renovation Request (optional)" value={requestId} onChange={(e) => {
            const req = requests.find(r => r.id === e.target.value)
            setRequestId(e.target.value)
            if (req) {
              setCustomerName(req.full_name)
              setCustomerMobile(req.mobile)
              setCustomerEmail(req.email ?? '')
              setProjectAddress(`${req.locality}, ${req.city}`)
            }
          }} className="field w-full">
            <option value="">— Not linked to a request —</option>
            {requests.map(r => (
              <option key={r.id} value={r.id}>{r.full_name} — {r.locality}, {r.city}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Customer Name *</label>
            <input aria-label="Customer Name" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
              className="field w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Mobile *</label>
            <input aria-label="Mobile" type="tel" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)}
              className="field w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Email</label>
            <input aria-label="Email" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
              className="field w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Project Address *</label>
            <input aria-label="Project Address" type="text" value={projectAddress} onChange={e => setProjectAddress(e.target.value)}
              className="field w-full" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Project Title *</label>
            <input aria-label="Project Title" type="text" value={projectTitle} onChange={e => setProjectTitle(e.target.value)}
              placeholder="e.g. 3BHK Full Home Renovation — Sector 50, Noida"
              className="field w-full" />
          </div>
          <div className="col-span-2 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                Project area (sq ft)
                {defaultArea && <span className="ml-2 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-stone-400">prefilled · {defaultArea.source === 'measured' ? 'measured on site' : "customer's figure"}</span>}
              </label>
              <input aria-label="Project area" type="number" min={0} value={projectArea} onChange={e => setProjectArea(e.target.value)} placeholder="e.g. 1350"
                className="field w-full" />
            </div>
            <button type="button" onClick={applyAreaToSqftItems} disabled={!validArea}
              className="border-2 border-ink-900 px-4 py-2.5 text-xs font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-white disabled:opacity-40">
              Apply to sq ft line items
            </button>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Project Scope Summary</label>
            <textarea aria-label="Project Scope Summary" value={projectScope} onChange={e => setProjectScope(e.target.value)} rows={2}
              placeholder="Brief description of scope and key inclusions/exclusions"
              className="field w-full" />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white border border-ink-900/15 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="panel-title">Line Items (BOQ)</h2>
          <button onClick={addLineItem} className="flex items-center gap-1.5 text-xs font-medium text-cobalt-500 hover:text-cobalt-700">
            <Plus size={13} /> Add Item
          </button>
        </div>

        <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="min-w-[600px] w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left pb-2 text-xs font-semibold text-stone-500 pr-3 min-w-[120px]">Category</th>
                <th className="text-left pb-2 text-xs font-semibold text-stone-500 pr-3 min-w-[200px]">Description</th>
                <th className="text-left pb-2 text-xs font-semibold text-stone-500 pr-3 w-16">Qty</th>
                <th className="text-left pb-2 text-xs font-semibold text-stone-500 pr-3 w-20">Unit</th>
                <th className="text-left pb-2 text-xs font-semibold text-stone-500 pr-3 w-24">Rate (₹)</th>
                <th className="text-left pb-2 text-xs font-semibold text-stone-500 pr-3 w-24">Amount (₹)</th>
                <th className="w-8"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pr-3">
                    <select aria-label="Category" value={item.category} onChange={e => updateLineItem(item.id, 'category', e.target.value)}
                      className="field w-full">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <input aria-label="Item description" type="text" value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="Description of work"
                      className="field w-full" />
                  </td>
                  <td className="py-2 pr-3">
                    <input aria-label="Quantity" type="number" value={item.qty} min={0} onChange={e => updateLineItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                      className="field w-full text-right" />
                  </td>
                  <td className="py-2 pr-3">
                    <select aria-label="Unit" value={item.unit} onChange={e => updateLineItem(item.id, 'unit', e.target.value)}
                      className="field w-full">
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <input aria-label="Rate" type="number" value={item.rate} min={0} onChange={e => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      className="field w-full text-right" />
                  </td>
                  <td className="py-2 pr-3 text-sm font-medium text-stone-700 text-right">
                    {item.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2">
                    <button type="button" aria-label="Remove line item" onClick={() => removeLineItem(item.id)} className="inline-flex items-center justify-center p-1 coarse:h-11 coarse:w-11 text-stone-500 hover:text-rose-700 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financials */}
      <div className="bg-white border border-ink-900/15 p-6 space-y-4">
        <h2 className="panel-title">Financial Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">GST Rate (%)</label>
            <input aria-label="GST Rate (%)" type="number" value={gstRate} min={0} max={28} onChange={e => setGstRate(parseFloat(e.target.value) || 0)}
              className="field w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Discount (₹)</label>
            <input aria-label="Discount (₹)" type="number" value={discountAmount} min={0} onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
              className="field w-full" />
          </div>
        </div>
        <div className="space-y-1.5 pt-2 border-t border-stone-100">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Subtotal</span>
            <span className="font-medium text-stone-800">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {ratePerSqft !== null && subtotal > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-stone-400">Effective rate on {Math.round(areaNum).toLocaleString('en-IN')} sq ft</span>
              <span className="font-mono font-medium text-stone-600">₹{ratePerSqft.toLocaleString('en-IN')} / sq ft</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">GST ({gstRate}%)</span>
            <span className="font-medium text-stone-800">₹{gstAmount.toLocaleString('en-IN')}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Discount</span>
              <span className="font-medium text-rose-700">- ₹{discountAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t border-stone-200 pt-2 mt-1">
            <span className="text-stone-900">Total Amount</span>
            <span className="text-cobalt-600">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="bg-white border border-ink-900/15 p-6 space-y-4">
        <h2 className="panel-title">Payment Schedule</h2>
        <div className="space-y-3">
          {paymentSchedule.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-4">
                <input aria-label="Milestone name" type="text" value={item.milestone} onChange={e => {
                  const s = [...paymentSchedule]; s[idx] = { ...s[idx], milestone: e.target.value }; setPaymentSchedule(s)
                }} placeholder="Milestone name"
                  className="field w-full" />
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-1">
                  <input aria-label="Percentage" type="number" value={item.percentage} min={0} max={100} onChange={e => {
                    const s = [...paymentSchedule]; s[idx] = { ...s[idx], percentage: parseInt(e.target.value) || 0, amount: Math.round(totalAmount * (parseInt(e.target.value) || 0) / 100) }; setPaymentSchedule(s)
                  }} className="field w-full text-right" />
                  <span className="text-xs text-stone-400">%</span>
                </div>
              </div>
              <div className="col-span-3 text-sm font-medium text-stone-700 text-right">
                ₹{Math.round(totalAmount * item.percentage / 100).toLocaleString('en-IN')}
              </div>
              <div className="col-span-3">
                <input aria-label="Item description" type="text" value={item.description} onChange={e => {
                  const s = [...paymentSchedule]; s[idx] = { ...s[idx], description: e.target.value }; setPaymentSchedule(s)
                }} placeholder="Description"
                  className="field w-full" />
              </div>
            </div>
          ))}
          <p className="text-xs text-stone-400">
            Sum of percentages: {paymentSchedule.reduce((s, i) => s + i.percentage, 0)}%
          </p>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-white border border-ink-900/15 p-6 space-y-3">
        <button onClick={() => setShowTerms(t => !t)} className="flex items-center gap-2 text-sm font-semibold text-stone-900">
          Terms &amp; Conditions {showTerms ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showTerms && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">Validity (days)</label>
                <input aria-label="Validity (days)" type="number" value={validityDays} onChange={e => setValidityDays(parseInt(e.target.value) || 30)}
                  className="field w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Terms &amp; Conditions</label>
              <textarea aria-label="Terms &amp; Conditions" value={termsAndConditions} onChange={e => setTermsAndConditions(e.target.value)} rows={6}
                className="field w-full font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Additional Notes</label>
              <textarea aria-label="Additional Notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="field w-full" />
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      <div className="flex gap-3">
        <button onClick={() => handleSave(false)} disabled={saving}
          className="coarse:min-h-11 flex-1 py-3 text-sm font-semibold border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Save as Draft'}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving}
          className="coarse:min-h-11 flex-1 py-3 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Save & Mark as Sent'}
        </button>
      </div>
    </div>
  )
}
