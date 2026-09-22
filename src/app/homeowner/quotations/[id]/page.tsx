import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/shared'
import QuotationAccept from './QuotationAccept'

export const metadata: Metadata = { title: 'Your Quotation' }

interface LineItem {
  id: string
  category: string
  description: string
  qty: number
  unit: string
  rate: number
  amount: number
}

interface PaymentItem {
  milestone: string
  percentage: number
  amount: number
  description: string
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' }> = {
  draft:              { label: 'Pending',            variant: 'default' },
  sent:               { label: 'Ready for Review',   variant: 'accent' },
  viewed:             { label: 'Under Review',        variant: 'accent' },
  accepted:           { label: 'Accepted',            variant: 'success' },
  rejected:           { label: 'Rejected',            variant: 'danger' },
  revision_requested: { label: 'Revision Requested',  variant: 'warning' },
  expired:            { label: 'Expired',             variant: 'default' },
}

export default async function CustomerQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/homeowner/quotations/${id}`)

  // Fetch quotation — RLS ensures customer can only see their own
  const { data: q, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !q) notFound()

  // Auto-mark as viewed when customer opens a sent quotation
  if (q.status === 'sent') {
    await supabase
      .from('quotations')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() })
      .eq('id', id)
    q.status = 'viewed'
  }

  const lineItems = (q.line_items ?? []) as LineItem[]
  const paymentSchedule = (q.payment_schedule ?? []) as PaymentItem[]
  const cfg = STATUS_CONFIG[q.status] ?? { label: q.status, variant: 'default' as const }

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/homeowner/requests"
            aria-label="Back" className="inline-flex items-center justify-center p-2 coarse:min-h-11 coarse:min-w-11 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft size={16} className="text-stone-500" />
          </Link>
          <div>
            <h1 className="page-title">Your Quotation</h1>
            <p className="text-sm text-stone-500">{q.quotation_number ?? q.id.slice(0, 12)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
        </div>
      </div>

      {/* Quotation document */}
      <div id="quotation-document" className="bg-white border border-ink-900/15 p-6 sm:p-8 space-y-6">

        {/* Letterhead */}
        <div className="flex items-start justify-between pb-6 border-b border-stone-100">
          <div>
            <p className="text-2xl font-bold text-stone-900 tracking-tight">HomeServe</p>
            <p className="text-sm text-cobalt-600 font-medium">Home Renovation Services · Delhi NCR</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-stone-900 uppercase tracking-wide">Quotation</p>
            <p className="text-xs text-stone-500 mt-1 font-mono">{q.quotation_number ?? q.id.slice(0, 12)}</p>
            <p className="text-xs text-stone-400 mt-0.5">
              {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">Valid for {q.validity_days} days</p>
          </div>
        </div>

        {/* Customer & Project */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="panel-title mb-2">Prepared For</p>
            <p className="text-sm font-semibold text-stone-900">{q.customer_name}</p>
            <p className="text-sm text-stone-600">{q.customer_mobile}</p>
            {q.customer_email && <p className="text-sm text-stone-600">{q.customer_email}</p>}
            <p className="text-sm text-stone-500 mt-1">{q.project_address}</p>
          </div>
          <div>
            <p className="panel-title mb-2">Project</p>
            <p className="text-sm font-semibold text-stone-900">{q.project_title}</p>
            {q.project_scope && (
              <p className="text-sm text-stone-500 mt-1 leading-relaxed">{q.project_scope}</p>
            )}
            {q.project_area_sqft && (
              <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-wider text-stone-500">
                Project area · <strong className="text-stone-800">{Math.round(Number(q.project_area_sqft)).toLocaleString('en-IN')} sq ft</strong>
                {Number(q.subtotal) > 0 && <> · ₹{Math.round(Number(q.subtotal) / Number(q.project_area_sqft)).toLocaleString('en-IN')} / sq ft (before GST)</>}
              </p>
            )}
          </div>
        </div>

        {/* Line Items */}
        {lineItems.length > 0 && (
          <div>
            <p className="panel-title mb-3">
              Scope &amp; Bill of Quantities
            </p>
            <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
              <table className="w-full text-sm min-w-[540px]">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500">Category</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500">Description</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-500">Qty</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-500">Unit</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-500">Rate (₹)</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-500">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {lineItems.map((item, idx) => (
                    <tr key={item.id ?? idx} className="hover:bg-stone-50/50">
                      <td className="px-4 py-2.5 text-xs text-stone-500">{item.category}</td>
                      <td className="px-4 py-2.5 text-sm text-stone-800">{item.description}</td>
                      <td className="px-4 py-2.5 text-sm text-stone-600 text-right">{item.qty}</td>
                      <td className="px-4 py-2.5 text-xs text-stone-500 text-right">{item.unit}</td>
                      <td className="px-4 py-2.5 text-sm text-stone-600 text-right">
                        {Number(item.rate).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-stone-800 text-right">
                        {Number(item.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Subtotal</span>
              <span className="text-stone-800">₹{Number(q.subtotal).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">GST ({q.gst_rate}%)</span>
              <span className="text-stone-800">₹{Number(q.gst_amount).toLocaleString('en-IN')}</span>
            </div>
            {Number(q.discount_amount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Discount</span>
                <span className="text-rose-700">−₹{Number(q.discount_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-stone-200 pt-2 mt-2">
              <span className="text-stone-900">Total Amount</span>
              <span className="text-cobalt-600">₹{Number(q.total_amount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Payment Schedule */}
        {paymentSchedule.length > 0 && (
          <div>
            <p className="panel-title mb-3">Payment Schedule</p>
            <div className="border border-stone-100 overflow-hidden">
              {paymentSchedule.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-800">{item.milestone}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{item.description}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold text-stone-800">
                      ₹{Number(item.amount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-stone-400">{item.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terms */}
        {q.terms_and_conditions && (
          <div className="pt-4 border-t border-stone-100">
            <p className="panel-title mb-2">
              Terms &amp; Conditions
            </p>
            <pre className="text-xs text-stone-500 font-sans whitespace-pre-wrap leading-relaxed">
              {q.terms_and_conditions}
            </pre>
          </div>
        )}

        {q.notes && (
          <div className="pt-2">
            <p className="panel-title mb-1">Notes</p>
            <p className="text-sm text-stone-500">{q.notes}</p>
          </div>
        )}
      </div>

      {/* Indicative estimate disclaimer */}
      <p className="text-xs text-stone-400 print:hidden">
        This quotation is based on the agreed scope and site measurements. Any variation in scope or materials will be covered by a separate change order with your approval before execution.
      </p>

      {/* Accept / Reject / Request Changes */}
      <div className="print:hidden">
        <QuotationAccept quotationId={id} status={q.status} />
      </div>

    </div>
  )
}
