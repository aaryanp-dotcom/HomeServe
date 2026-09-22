import { z } from 'zod'

export const signUpSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['homeowner', 'contractor']),
  city: z.string().min(2, 'Enter your city'),
})

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const bookingSchema = z.object({
  service_id: z.string().uuid('Select a service'),
  booking_type: z.enum(['instant', 'project']),
  description: z.string().min(20, 'Please describe your requirement (min 20 characters)').max(1000),
  address: z.string().min(10, 'Enter your full address'),
  city: z.string().min(2, 'Enter your city'),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid date'),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/, 'Select a valid time'),
  /** Required for services priced per sq ft; ignored for fixed-price services. */
  area_sqft: z.number().positive().max(100000).optional(),
})

// Public lead form. Enum values must match the renovation_requests enums in Postgres.
const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

export const renovationRequestSchema = z.object({
  city: z.enum(['Delhi', 'Noida', 'Greater Noida', 'Ghaziabad', 'Gurugram', 'Faridabad', 'Other']),
  locality: z.string().trim().min(2).max(200),
  propertyType: z.enum(['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Independent House', 'Other']),
  bhk: z.preprocess(emptyToNull, z.string().max(50).nullish()),
  approximateArea: z.preprocess(emptyToNull, z.string().max(50).nullish()),
  isNewProperty: z.boolean().optional().default(false),
  scope: z
    .array(z.enum([
      'full_home', 'kitchen', 'bathroom', 'living_room', 'bedroom', 'painting', 'flooring',
      'false_ceiling', 'electrical', 'plumbing', 'carpentry', 'civil_work', 'other',
    ]))
    .min(1, 'Please select at least one scope of work'),
  scopeOther: z.preprocess(emptyToNull, z.string().max(500).nullish()),
  budget: z.preprocess(
    emptyToNull,
    z.enum(['under_5L', '5_10L', '10_20L', '20_30L', '30L_plus', 'not_sure']).nullish(),
  ),
  timeline: z.preprocess(
    emptyToNull,
    z.enum(['immediately', 'within_1_month', '1_3_months', '3_6_months', 'just_exploring']).nullish(),
  ),
  inspirationTheme: z.preprocess(emptyToNull, z.string().max(100).nullish()),
  notes: z.preprocess(emptyToNull, z.string().max(2000).nullish()),
  fullName: z.string().trim().min(2).max(120),
  mobile: z
    .string()
    .transform((v) => v.replace(/[\s()-]/g, ''))
    .pipe(z.string().regex(/^\+?\d{10,13}$/, 'Enter a valid mobile number')),
  email: z.preprocess(emptyToNull, z.string().email().max(200).nullish()),
  preferredContactTime: z.preprocess(emptyToNull, z.string().max(100).nullish()),

  // Property size (canonical square feet). All optional — leads without a size are fine.
  sizeMode: z.enum(['bhk_preset', 'total_area', 'room_wise']).nullish(),
  areaSqft: z.number().positive().max(100000).nullish(),
  rooms: z
    .array(z.object({
      name: z.string().trim().min(1).max(60),
      length_ft: z.number().min(1).max(200),
      width_ft: z.number().min(1).max(200),
    }))
    .max(30)
    .default([]),
  // Indicative range the visitor saw in the estimator (informational only).
  estimateLow: z.number().nonnegative().max(1e9).nullish(),
  estimateHigh: z.number().nonnegative().max(1e9).nullish(),
})

export const milestoneUpdateSchema = z.object({
  milestone_id: z.string().uuid(),
  notes: z.string().max(500).optional(),
})

export const assignContractorSchema = z.object({
  booking_id: z.string().uuid(),
  contractor_id: z.string().uuid('Select a contractor'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type BookingInput = z.infer<typeof bookingSchema>
export type RenovationRequestInput = z.infer<typeof renovationRequestSchema>
export type MilestoneUpdateInput = z.infer<typeof milestoneUpdateSchema>
export type AssignContractorInput = z.infer<typeof assignContractorSchema>
