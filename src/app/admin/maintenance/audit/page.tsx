import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { adminPage } from '@/lib/maintenance/page-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Audit Log — Admin' }

export default async function AdminAuditPage() {
  const { supabase } = await adminPage('/admin/maintenance/audit')
  const { data } = await supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(150)
  const rows = data ?? []
  const ids = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean)))
  const { data: profiles } = ids.length ? await createAdminClient().from('user_profiles').select('user_id, full_name').in('user_id', ids) : { data: [] }
  const who = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name as string]))

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8">
      <Link href="/admin/maintenance" className="coarse:min-h-11 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-ink-900"><ArrowLeft size={14} /> Maintenance</Link>
      <div>
        <h1 className="page-title">Audit log</h1>
        <p className="mt-1 text-sm text-stone-500">Who changed prices, plans, warranty and payments, and when. Entries cannot be edited.</p>
      </div>
      {rows.length === 0 ? <p className="border border-ink-900/15 bg-white p-8 text-center text-sm text-stone-500">Nothing recorded yet.</p> : (
        <div className="overflow-x-auto border-2 border-ink-900 bg-white" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b-2 border-ink-900 bg-paper-100 text-left font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-900/60"><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">What</th><th className="p-3">Action</th></tr></thead>
            <tbody className="divide-y divide-ink-900/10">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="whitespace-nowrap p-3 text-stone-500">{new Date(r.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</td>
                  <td className="p-3">{who.get(r.actor_id) ?? '—'}</td>
                  <td className="p-3 text-ink-900">{r.summary}</td>
                  <td className="p-3 font-mono text-xs text-stone-500">{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
