import type { SupabaseClient } from '@supabase/supabase-js'
import { sendNotification } from '@/lib/notifications'
import type { NotificationEvent } from '@/types'
import { contactFor } from './auth'

/**
 * Send a maintenance / membership notification to a customer. Email is the default
 * channel; SMS is only used where a short template exists and Twilio is configured
 * (unconfigured channels are skipped inside sendNotification). Never throws — a
 * notification failure must not fail the action that triggered it.
 */
export async function notifyCustomer(
  admin: SupabaseClient,
  userId: string,
  event: NotificationEvent,
  data: Record<string, string>,
  opts: { reference?: { type: 'maintenance_request' | 'membership' | 'project'; id: string }; sms?: boolean } = {},
) {
  try {
    const c = await contactFor(admin, userId)
    await sendNotification({
      event,
      userId,
      reference: opts.reference,
      data: { name: c.name, ...data },
      channels: opts.sms ? ['email', 'sms'] : ['email'],
      email: c.email,
      phone: c.phone,
    })
  } catch (err) {
    console.error(`[maintenance] notification ${event} failed`, err)
  }
}

/** Append an audit / communication row to a request. */
export async function addRequestEvent(
  admin: SupabaseClient,
  e: {
    request_id: string
    actor_id?: string | null
    actor_role: 'customer' | 'homeserve' | 'system'
    event_type: 'created' | 'status_change' | 'message' | 'note' | 'assignment' | 'visit' | 'charges' | 'materials' | 'benefit' | 'payment' | 'media'
    from_status?: string | null
    to_status?: string | null
    body?: string | null
    visible_to_customer?: boolean
    metadata?: Record<string, unknown>
  },
) {
  const { error } = await admin.from('maintenance_request_events').insert({
    request_id: e.request_id,
    actor_id: e.actor_id ?? null,
    actor_role: e.actor_role,
    event_type: e.event_type,
    from_status: e.from_status ?? null,
    to_status: e.to_status ?? null,
    body: e.body ?? null,
    visible_to_customer: e.visible_to_customer ?? true,
    metadata: e.metadata ?? {},
  })
  if (error) console.error('[maintenance] event insert failed', error)
}
