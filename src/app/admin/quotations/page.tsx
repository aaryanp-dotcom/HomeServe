import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Plus, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/shared'

export const metadata: Metadata = { title: 'Quotations — Admin' }

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' }> = {
  draft:              { label: 'Draft',              variant: 'default' },
  sent:               { label: 'Sent',               variant: 'accent' },
  viewed:             { label: 'Viewed',             variant: 'accent' },
  accepted:           { label: 'Accepted',           variant: 'success' },
  rejected:           { label: 'Rejected',           variant: 'danger' },
  revision_requested: { label: 'Revision Requested', variant: 'warning' },
  expired:            { label: 'Expired',            variant: 'default' },
}

export default async function AdminQuotationsPage() {
  const cookieStore = cookies()
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
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')

  const { data: quotations } = await supabase
    .from('quotations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="text-sm text-stone-500 mt-0.5">Prepare and manage renovation quotations</p>
        </div>
        <Link href="/admin/quotations/new"
          className="coarse:min-h-11 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 transition-colors"
        >
          <Plus size={15} /> New Quotation
        </Link>
      </div>

      <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
        <table className="min-w-[600px] w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Quotation #</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">Project</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">Date</th>
              <th className="text-right px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {(quotations ?? []).map((q) => {
              const cfg = STATUS_CONFIG[q.status] ?? { label: q.status, variant: 'default' as const }
              return (
                <tr key={q.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-stone-500">{q.quotation_number ?? q.id.slice(0, 8)}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-stone-800">{q.customer_name}</p>
                    <p className="text-xs text-stone-400">{q.customer_mobile}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-stone-600 truncate max-w-[200px]">{q.project_title}</td>
                  <td className="px-5 py-3.5 font-semibold text-stone-800">
                    {q.total_amount ? `₹${Number(q.total_amount).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={cfg.variant} dot size="sm">{cfg.label}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-stone-400 text-xs hidden md:table-cell">
                    {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/admin/quotations/${q.id}`} className="coarse:min-h-11 inline-flex items-center gap-1 text-xs font-medium text-cobalt-500 hover:text-cobalt-700">
                      View <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              )
            })}
            {(quotations ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-stone-400">
                  No quotations yet. Create your first quotation from a lead.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
