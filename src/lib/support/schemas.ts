import { z } from 'zod'

const empty = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v)
const CATEGORY = z.enum(['general', 'renovation', 'maintenance', 'billing', 'account', 'other'])

/** Shared by the public /contact form and a signed-in homeowner's "raise a ticket" form. `honeypot`
 *  is a hidden field real visitors never fill in — a bot that fills every input trips it silently. */
export const createTicketSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(120),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.preprocess(empty, z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number').nullish()),
  subject: z.string().trim().min(3, 'Tell us what it is about').max(150),
  category: CATEGORY.default('general'),
  message: z.string().trim().min(10, 'Give us a few more details').max(3000),
  // Deliberately unconstrained here — the point is to still validate everything else and only decide
  // whether to actually store it afterwards (see the route). A `max(0)` on this field would make zod
  // reject the whole request the moment a bot fills it, which hands the bot a 400 instead of a 200 and
  // defeats the "let it think it worked" purpose of a honeypot.
  honeypot: z.string().max(500).optional().default(''),
  // Which form sent this — set by the caller, not inferred from whether a session exists, so a
  // signed-in customer can still use the public contact form without triggering the dashboard's
  // service-history gate (see hasServiceHistory / the route).
  source: z.enum(['contact_form', 'dashboard']).default('contact_form'),
})

export const replyMessageSchema = z.object({ body: z.string().trim().min(1).max(3000) })

export const adminTicketActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('reply'), body: z.string().trim().min(1).max(3000) }),
  z.object({ action: z.literal('status'), status: z.enum(['open', 'in_progress', 'resolved', 'closed']) }),
])
