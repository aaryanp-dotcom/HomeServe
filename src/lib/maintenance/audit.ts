import type { SupabaseClient } from '@supabase/supabase-js'

/** Append-only record of admin changes that alter money, terms or warranty. Never throws. */
export async function logAdmin(
  admin: SupabaseClient,
  actorId: string,
  a: { action: string; entity_type: string; entity_id?: string | null; summary: string; details?: Record<string, unknown> },
) {
  const { error } = await admin.from('admin_audit_log').insert({
    actor_id: actorId, action: a.action, entity_type: a.entity_type, entity_id: a.entity_id ?? null,
    summary: a.summary, details: a.details ?? {},
  })
  if (error) console.error('[audit] insert failed', error)
}
