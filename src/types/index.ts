// ============================================================
// HomeServe AI — Shared TypeScript Types
// ============================================================

// ----- User & Roles -----

export type UserRole = 'homeowner' | 'contractor' | 'admin'

export interface UserProfile {
  id: string
  user_id: string
  role: UserRole
  full_name: string
  phone: string | null
  avatar_url: string | null
  city: string | null
  state: string | null
  created_at: string
  updated_at: string
}

// ----- Services -----

export const SERVICE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Civil Work',
  'Interior Design',
  'Modular Kitchen',
  'Home Cleaning',
  'Pest Control',
  'False Ceiling',
  'Flooring',
  'Waterproofing',
  'AC Repair',
  'Appliance Repair',
  'Deep Cleaning',
  'Bathroom Remodeling',
  'Kitchen Remodeling',
  'CCTV Installation',
  'Solar Installation',
  'Smart Home',
  'Gardening & Landscaping',
  'Custom Furniture',
] as const

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

export interface Service {
  id: string
  category: ServiceCategory
  name: string
  description: string
  base_price: number
  price_unit: 'fixed' | 'per_sqft' | 'per_hour' | 'per_unit'
  min_duration_hours: number
  max_duration_hours: number
  image_url: string | null
  is_active: boolean
  created_at: string
}

// ----- Bookings -----

export type BookingType = 'instant' | 'project'

export type BookingStatus =
  | 'pending'           // created, awaiting payment
  | 'payment_pending'   // payment initiated
  | 'confirmed'         // payment received
  | 'assigned'          // contractor assigned
  | 'in_progress'       // work started
  | 'milestone_1_done'  // project: 1st milestone complete (40% due)
  | 'milestone_2_done'  // project: 2nd milestone complete (40% due)
  | 'completed'         // work finished, pending review
  | 'cancelled'
  | 'refunded'

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'approved'

export interface Milestone {
  id: string
  booking_id: string
  milestone_number: number
  title: string
  description: string | null
  percentage: number
  amount: number
  status: MilestoneStatus
  completed_at: string | null
  approved_at: string | null
  notes: string | null
}

export interface Booking {
  id: string
  booking_number: string
  homeowner_id: string
  contractor_id: string | null
  service_id: string | null
  service_category: ServiceCategory
  booking_type: BookingType
  status: BookingStatus
  description: string
  address: string
  city: string
  scheduled_date: string
  scheduled_time: string
  total_amount: number
  paid_amount: number
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  admin_notes: string | null
  request_id: string | null
  quotation_id: string | null
  project_title: string | null
  created_at: string
  updated_at: string
  // joined
  service?: Service
  homeowner?: UserProfile
  contractor?: UserProfile
  milestones?: Milestone[]
}

// ----- Payments -----

export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'failed' | 'refunded'

export interface Payment {
  id: string
  booking_id: string
  milestone_id: string | null
  razorpay_order_id: string
  razorpay_payment_id: string | null
  amount: number
  currency: string
  status: PaymentStatus
  payment_type: 'booking_full' | 'milestone_1' | 'milestone_2' | 'milestone_3'
  created_at: string
}

// ----- Contractors -----

export type ContractorType = 'employed' | 'marketplace'

export interface ContractorProfile {
  id: string
  user_id: string
  contractor_type: ContractorType
  specializations: ServiceCategory[]
  experience_years: number
  is_verified: boolean
  is_available: boolean
  rating: number
  total_jobs: number
  city: string
  created_at: string
}

// ----- Notifications -----

export type NotificationChannel = 'email' | 'sms' | 'whatsapp'

export type NotificationEvent =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_assigned'
  | 'booking_started'
  | 'milestone_completed'
  | 'milestone_payment_due'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'maintenance_request_received'
  | 'maintenance_request_confirmed'
  | 'maintenance_visit_scheduled'
  | 'maintenance_completed'
  | 'maintenance_payment_received'
  | 'membership_purchased'
  | 'membership_renewal_reminder'
  | 'membership_expiry_notice'
  | 'warranty_update'

export interface NotificationLog {
  id: string
  user_id: string
  booking_id: string | null
  event: NotificationEvent
  channel: NotificationChannel
  recipient: string
  status: 'sent' | 'failed' | 'pending'
  sent_at: string | null
  error: string | null
}
