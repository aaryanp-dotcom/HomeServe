import { z } from 'zod'
import { CATEGORY_ORDER } from './config'

const NCR = ['Delhi', 'Noida', 'Greater Noida', 'Ghaziabad', 'Gurugram', 'Faridabad'] as const
const empty = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)
const optText = (max: number) => z.preprocess(empty, z.string().trim().max(max).nullish())
const uuid = z.string().uuid()

export const propertySchema = z.object({
  label: z.string().trim().min(1).max(60).default('My home'),
  address_line: z.string().trim().min(8, 'Enter the full address').max(300),
  locality: optText(120),
  city: z.enum(NCR),
  pincode: z.preprocess(empty, z.string().regex(/^[0-9]{6}$/, 'Enter a 6-digit pincode').nullish()),
  property_type: optText(60),
  area_sqft: z.preprocess(empty, z.coerce.number().positive().max(100000).nullish()),
  booking_id: uuid.nullish(),
})

export const createRequestSchema = z.object({
  service_id: uuid,
  property_id: uuid,
  description: z.string().trim().min(10, 'Tell us a little about the problem').max(1500),
  urgency: z.enum(['routine', 'urgent']).default('routine'),
  preferred_date: z.preprocess(empty, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish()),
  preferred_slot: z.preprocess(empty, z.enum(['morning', 'afternoon', 'evening', 'any']).nullish()),
  booking_id: uuid.nullish(),
})

export const customerActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('confirm') }),
  z.object({ action: z.literal('reopen'), note: z.string().trim().min(3).max(1000) }),
  z.object({ action: z.literal('cancel'), reason: optText(500) }),
  z.object({ action: z.literal('message'), body: z.string().trim().min(1).max(1500) }),
])

const STATUS = z.enum([
  'requested', 'confirmed', 'scheduled', 'visit_underway', 'in_progress',
  'completed', 'customer_confirmed', 'closed', 'cancelled',
])
const money = z.coerce.number().min(0).max(10_000_000)

export const adminActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('status'), status: STATUS, note: optText(1000), completion_summary: optText(2000) }),
  z.object({ action: z.literal('assign'), assigned_to: uuid.nullable(), team_label: optText(80) }),
  z.object({
    action: z.literal('schedule'),
    scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time_window: z.enum(['morning', 'afternoon', 'evening', 'any']).default('any'),
    notes: optText(500),
    technician_id: uuid.nullable().optional(),
  }),
  z.object({
    action: z.literal('visit_status'),
    visit_id: uuid,
    status: z.enum(['scheduled', 'completed', 'missed', 'rescheduled', 'cancelled']),
  }),
  z.object({ action: z.literal('technician'), visit_id: uuid, technician_id: uuid.nullable() }),
  z.object({
    action: z.literal('charges'),
    visit_fee: money, labour_charge: money,
    materials: z.array(z.object({
      item: z.string().trim().min(1).max(120),
      qty: z.coerce.number().positive().max(10000),
      unit_price: money,
    })).max(40).default([]),
    waive: z.boolean().optional(),
  }),
  z.object({ action: z.literal('note'), body: z.string().trim().min(1).max(2000) }),
  z.object({ action: z.literal('message'), body: z.string().trim().min(1).max(1500) }),
])

export const purchaseSchema = z.object({ plan_id: uuid, property_id: uuid })
export const membershipActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('cancel'), reason: optText(500) }),
  z.object({ action: z.literal('undo_cancel') }),
  z.object({ action: z.literal('renew') }),
])

export const serviceEditSchema = z.object({
  name: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(2).max(240),
  description: z.string().trim().min(2).max(2000),
  inclusions: z.array(z.string().trim().min(1).max(200)).max(12),
  exclusions: z.array(z.string().trim().min(1).max(200)).max(12),
  indicative_price_from: z.preprocess(empty, z.coerce.number().min(0).max(10_000_000).nullish()),
  indicative_price_to: z.preprocess(empty, z.coerce.number().min(0).max(10_000_000).nullish()),
  price_unit: z.enum(['per_visit', 'per_unit', 'per_sqft', 'on_inspection']),
  price_note: optText(300),
  photos_helpful: z.boolean(),
  membership_eligible: z.boolean(),
  is_active: z.boolean(),
}).refine((v) => v.indicative_price_to == null || v.indicative_price_from == null || v.indicative_price_to >= v.indicative_price_from, {
  message: 'Upper price must not be below the lower price', path: ['indicative_price_to'],
})

export const planEditSchema = z.object({
  name: z.string().trim().min(2).max(60),
  tagline: optText(160),
  description: z.string().trim().max(1000),
  annual_price: z.preprocess(empty, z.coerce.number().min(0).max(10_000_000).nullish()),
  monthly_price: z.preprocess(empty, z.coerce.number().min(0).max(10_000_000).nullish()),
  term_months: z.coerce.number().int().min(1).max(36),
  included_visits: z.coerce.number().int().min(0).max(100),
  inspection_frequency_per_year: z.coerce.number().int().min(0).max(12),
  discount_percent: z.coerce.number().min(0).max(100),
  service_credit_amount: z.coerce.number().min(0).max(10_000_000),
  max_benefit_per_service: z.preprocess(empty, z.coerce.number().min(0).max(10_000_000).nullish()),
  max_annual_benefit: z.preprocess(empty, z.coerce.number().min(0).max(10_000_000).nullish()),
  eligible_categories: z.array(z.enum(CATEGORY_ORDER as [string, ...string[]])),
  labour_included: z.boolean(),
  parts_included: z.boolean(),
  priority_booking: z.boolean(),
  priority_support: z.boolean(),
  emergency_support: z.enum(['none', 'guidance_only', 'priority_response']),
  emergency_notes: optText(300),
  benefits: z.array(z.string().trim().min(1).max(200)).max(12),
  exclusions: z.array(z.string().trim().min(1).max(200)).max(12),
  eligibility_notes: optText(400),
  requires_homeserve_project: z.boolean(),
  is_active: z.boolean(),
})

export const warrantyFactsSchema = z.object({
  handover_date: z.preprocess(empty, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish()),
  warranty_months: z.preprocess(empty, z.coerce.number().int().min(1).max(600).nullish()),
  warranty_terms: optText(3000),
})

export const reviewSchema = z.object({
  booking_id: uuid.optional(),
  maintenance_request_id: uuid.optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().default(''),
}).refine((v) => !!v.booking_id !== !!v.maintenance_request_id, { message: 'Review one project or one service request' })

export const NCR_CITY_LIST = NCR
