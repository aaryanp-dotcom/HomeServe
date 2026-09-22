import { createAdminClient } from '@/lib/supabase/admin'

/**
 * The dashboard's "raise a ticket" is reserved for people who actually have a relationship with
 * HomeServe — a renovation booking, a maintenance request, or a membership, in any status (active,
 * completed or even cancelled all count as "taking or having taken a service"). It has no bearing on
 * the public /contact form, which stays open to anyone, including prospective customers who have never
 * booked anything yet — that's its whole purpose.
 */
export async function hasServiceHistory(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const [{ count: bookings }, { count: requests }, { count: subscriptions }] = await Promise.all([
    admin.from('bookings').select('id', { count: 'exact', head: true }).eq('homeowner_id', userId),
    admin.from('maintenance_requests').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('maintenance_subscriptions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])
  return (bookings ?? 0) > 0 || (requests ?? 0) > 0 || (subscriptions ?? 0) > 0
}
