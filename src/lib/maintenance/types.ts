import type { MaintenanceCategory, RequestStatus } from './config'

export interface MaintenanceService {
  id: string
  slug: string
  category: MaintenanceCategory
  name: string
  summary: string
  description: string
  inclusions: string[]
  exclusions: string[]
  indicative_price_from: number | null
  indicative_price_to: number | null
  price_unit: 'per_visit' | 'per_unit' | 'per_sqft' | 'on_inspection'
  price_note: string | null
  photos_helpful: boolean
  membership_eligible: boolean
  is_active: boolean
  sort_order: number
}

export type EmergencySupport = 'none' | 'guidance_only' | 'priority_response'

export interface MaintenancePlan {
  id: string
  code: string
  name: string
  tagline: string | null
  description: string
  annual_price: number | null
  monthly_price: number | null
  term_months: number
  included_visits: number
  inspection_frequency_per_year: number
  discount_percent: number
  service_credit_amount: number
  max_benefit_per_service: number | null
  max_annual_benefit: number | null
  eligible_categories: MaintenanceCategory[]
  labour_included: boolean
  parts_included: boolean
  priority_booking: boolean
  priority_support: boolean
  emergency_support: EmergencySupport
  emergency_notes: string | null
  benefits: string[]
  exclusions: string[]
  eligibility_notes: string | null
  requires_homeserve_project: boolean
  is_active: boolean
  sort_order: number
}

/** What a member bought: a frozen copy of the plan row. */
export type PlanSnapshot = Omit<MaintenancePlan, 'id' | 'is_active' | 'sort_order'> & { plan_id?: string }

export type MembershipStatus = 'pending_payment' | 'active' | 'upcoming' | 'expired' | 'cancelled'

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  property_id: string
  status: MembershipStatus
  plan_snapshot: PlanSnapshot
  price_paid: number
  start_date: string | null
  end_date: string | null
  renewed_from_id: string | null
  cancel_at_period_end: boolean
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
}

export interface UsageRow {
  id: string
  subscription_id: string
  request_id: string | null
  usage_type: 'visit' | 'inspection' | 'discount' | 'credit' | 'visit_coverage'
  category: MaintenanceCategory | null
  quantity: number
  amount: number
  note: string | null
  created_at: string
}

export interface Property {
  id: string
  user_id: string
  label: string
  address_line: string
  locality: string | null
  city: string
  pincode: string | null
  property_type: string | null
  area_sqft: number | null
  booking_id: string | null
  is_default: boolean
}

export interface MaintenanceRequest {
  id: string
  request_number: string
  user_id: string
  service_id: string
  category: MaintenanceCategory
  property_id: string
  address_snapshot: string
  city: string
  booking_id: string | null
  subscription_id: string | null
  status: RequestStatus
  urgency: 'routine' | 'urgent'
  description: string
  preferred_date: string | null
  preferred_slot: string | null
  assigned_to: string | null
  team_label: string | null
  visit_fee: number
  labour_charge: number
  materials_cost: number
  materials: { item: string; qty: number; unit_price: number; amount: number }[]
  membership_discount: number
  membership_credit_used: number
  amount_due: number
  payment_status: 'not_required' | 'pending' | 'paid' | 'waived'
  paid_at: string | null
  completion_summary: string | null
  confirmed_at: string | null
  completed_at: string | null
  customer_confirmed_at: string | null
  closed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface RequestEvent {
  id: string
  request_id: string
  actor_role: 'customer' | 'homeserve' | 'system'
  event_type: string
  from_status: RequestStatus | null
  to_status: RequestStatus | null
  body: string | null
  visible_to_customer: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface Visit {
  id: string
  request_id: string
  scheduled_date: string
  time_window: string
  status: 'scheduled' | 'completed' | 'missed' | 'rescheduled' | 'cancelled'
  notes: string | null
  completed_at: string | null
  technician_id: string | null
}
