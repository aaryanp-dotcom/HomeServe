import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/shared'
import QuotationActions from './QuotationActions'

export const metadata: Metadata = { title: 'Quotation — Admin' }

interface LineItem {
  id: string; category: string; description: string; qty: number; unit: string; rate: number; amount: number
}
interface PaymentItem {
  milestone: string; percentage: number; amount: number; description: string
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' }> = {
  draft: { label: 'Draft', variant: 'default' },
  sent: { label: 'Sent', variant: 'accent' },
  viewed: { label: 'Viewed', variant: 'accent' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  revision_requested: { label: 'Revision Requested', variant: 'warning' },
  expired: { label: 'Expired', variant: 'default' },
}

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: q } = await supabase.from('quotations').select('*').eq('id', id).single()
  if (!q) notFound()

  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const lineItems = (q.line_items ?? []) as LineItem[]
  const paymentSchedule = (q.payment_schedule ?? []) as PaymentItem[]
  const cfg = STATUS_CONFIG[q.status] ?? { label: q.status, variant: 'default' as const }

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={isAdmin ? '/admin/quotations' : '/homeowner/bookings'} aria-label="Back" className="inline-flex items-center justify-center coarse:min-h-11 coarse:min-w-11 p-2 hover:bg-stone-100">
            <ArrowLeft size={16} className="text-stone-500" />
          </Link>
          <div>
            <h1 className="page-title">{q.project_title}</h1>
            <p className="text-sm text-stone-500">{q.quotation_number ?? q.id.slice(0, 12)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
        </div>
      </div>

      {/* Print-friendly quotation card */}
      <div id="quotation-document" className="bg-white border border-ink-900/15 p-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-stone-100">
          <div>
            <p className="text-2xl font-bold text-stone-900 tracking-tight">HomeServe</p>
            <p className="text-sm text-cobalt-600 font-medium">Home Renovation Services · Delhi NCR</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-stone-900">QUOTATION</p>
            <p className="text-xs text-stone-500 mt-0.5">{q.quotation_number ?? q.id.slice(0, 12)}</p>
            <p className="text-xs text-stone-400 mt-0.5">
              {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">Valid for {q.validity_days} days</p>
          </div>
        </div>

        {/* Customer & Project */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="panel-title mb-2">Bill To</p>
            <p className="text-sm font-semibold text-stone-900">{q.customer_name}</p>
            <p className="text-sm text-stone-600">{q.customer_mobile}</p>
            {q.customer_email && <p className="text-sm text-stone-600">{q.customer_email}</p>}
            <p className="text-sm text-stone-500 mt-1">{q.project_address}</p>
          </div>
          <div>
            <p className="panel-title mb-2">Project Details</p>
            <p className="text-sm font-semibold text-stone-900">{q.project_title}</p>
            {q.project_scope && <p className="text-sm text-stone-500 mt-1">{q.project_scope}</p>}
          </div>
        </div>

        {/* Line Items */}
        <div>
          <p className="panel-title mb-3">Scope &amp; Bill of Quantities</p>
          <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="min-w-[600px] w-full text-sm">
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
                  <tr key={item.id ?? idx}>
                    <td className="px-4 py-2.5 text-xs text-stone-500">{item.category}</td>
                    <td className="px-4 py-2.5 text-sm text-stone-800">{item.description}</td>
                    <td className="px-4 py-2.5 text-sm text-stone-600 text-right">{item.qty}</td>
                    <td className="px-4 py-2.5 text-xs text-stone-500 text-right">{item.unit}</td>
                    <td className="px-4 py-2.5 text-sm text-stone-600 text-right">{Number(item.rate).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-stone-800 text-right">{Number(item.amount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
            {q.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Discount</span>
                <span className="text-rose-700">-₹{Number(q.discount_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-stone-200 pt-2">
              <span className="text-stone-900">Total Amount</span>
              <span className="text-cobalt-600">₹{Number(q.total_amount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Payment Schedule */}
        {paymentSchedule.length > 0 && (
          <div>
            <p className="panel-title mb-3">Payment Schedule</p>
            <div className="space-y-2">
              {paymentSchedule.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{item.milestone}</p>
                    <p className="text-xs text-stone-400">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-stone-800">₹{Number(item.amount).toLocaleString('en-IN')}</p>
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
            <p className="panel-title mb-2">Terms &amp; Conditions</p>
            <pre className="text-xs text-stone-500 font-sans whitespace-pre-wrap leading-relaxed">{q.terms_and_conditions}</pre>
          </div>
        )}

        {q.notes && (
          <div className="pt-2">
            <p className="panel-title mb-1">Notes</p>
            <p className="text-sm text-stone-500">{q.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <QuotationActions
        quotationId={id}
        status={q.status}
        isAdmin={isAdmin}
        requestId={q.request_id}
      />
    </div>
  )
}
