import { z } from 'zod'
import { SERVICE_CATEGORIES } from '@/types'

const empty = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v)

/** Public "apply to join as a technician" form. Submitting this never creates an account or
 *  assigns a role — see the route and 030_contractor_applications.sql. `honeypot` follows the
 *  same pattern as the support-ticket form: a bot that fills every field trips it silently,
 *  validated-but-discarded rather than rejected, so the bot can't tell it failed. */
export const createApplicationSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(120),
  // Optional — phone is the primary contact method here (matches the form's own "optional"
  // label and the admin approval flow, which falls back to phone when there's no email).
  email: z.preprocess(empty, z.string().trim().email('Enter a valid email').nullish()),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number'),
  city: z.preprocess(empty, z.string().trim().max(80).nullish()),
  experienceYears: z.coerce.number().int().min(0).max(60).default(0),
  specializations: z.array(z.enum(SERVICE_CATEGORIES)).min(1, 'Pick at least one specialisation').max(10),
  message: z.preprocess(empty, z.string().trim().max(2000).nullish()),
  honeypot: z.string().max(500).optional().default(''),
})

export const reviewApplicationSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
    // Admin sets this directly rather than relying on an invite email reaching the new
    // contractor — see the route for why. Supabase's own minimum is 6 characters; 8 matches
    // the signup form's own bar elsewhere in the app.
    temporaryPassword: z.string().min(8, 'At least 8 characters').max(72),
    // Only used when the application itself has no email — a login account needs one even
    // though the application didn't require it (see 030_contractor_applications.sql).
    email: z.preprocess(empty, z.string().trim().email('Enter a valid email').nullish()),
    adminNotes: z.string().trim().max(1000).optional(),
  }),
  z.object({
    action: z.literal('reject'),
    rejectionReason: z.string().trim().min(1, 'Give a reason').max(500),
  }),
])
