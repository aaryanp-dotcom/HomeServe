// ── Maintenance configuration (central, like DELHI_NCR_PRICING) ─────────────
// Presentation constants and rules live here. Commercial values — service prices,
// plan prices, visits, discounts, credits, caps — live in the database
// (maintenance_services / maintenance_plans) and are edited by admin, so nothing here
// is a HomeServe price or promise.

export type MaintenanceCategory =
  | 'plumbing' | 'electrical' | 'carpentry' | 'ac_servicing' | 'appliance_servicing'
  | 'pest_control' | 'deep_cleaning' | 'painting_touchups' | 'waterproofing_inspection'
  | 'bathroom_maintenance' | 'kitchen_maintenance' | 'home_inspection'

export const CATEGORY_META: Record<MaintenanceCategory, { label: string; short: string }> = {
  plumbing:                 { label: 'Plumbing',                     short: 'Plumbing' },
  electrical:               { label: 'Electrical',                   short: 'Electrical' },
  carpentry:                { label: 'Carpentry',                    short: 'Carpentry' },
  ac_servicing:             { label: 'AC servicing',                 short: 'AC' },
  appliance_servicing:      { label: 'Appliance servicing',          short: 'Appliances' },
  pest_control:             { label: 'Pest control',                 short: 'Pest control' },
  deep_cleaning:            { label: 'Deep cleaning',                short: 'Cleaning' },
  painting_touchups:        { label: 'Painting touch-ups',           short: 'Painting' },
  waterproofing_inspection: { label: 'Waterproofing & seepage',      short: 'Seepage' },
  bathroom_maintenance:     { label: 'Bathroom maintenance',         short: 'Bathroom' },
  kitchen_maintenance:      { label: 'Kitchen maintenance',          short: 'Kitchen' },
  home_inspection:          { label: 'General home inspection',      short: 'Inspection' },
}

export const CATEGORY_ORDER = Object.keys(CATEGORY_META) as MaintenanceCategory[]

// ── Request lifecycle ────────────────────────────────────────────────────────

export type RequestStatus =
  | 'requested' | 'confirmed' | 'scheduled' | 'visit_underway' | 'in_progress'
  | 'completed' | 'customer_confirmed' | 'closed' | 'cancelled'

type Variant = 'success' | 'warning' | 'danger' | 'accent' | 'default'

export const REQUEST_STATUS: Record<RequestStatus, { label: string; customer: string; variant: Variant; hint: string }> = {
  requested:          { label: 'Requested',          customer: 'Request received',      variant: 'warning', hint: 'We have your request and will confirm it shortly.' },
  confirmed:          { label: 'Confirmed',          customer: 'Confirmed',             variant: 'accent',  hint: 'HomeServe has confirmed your request. A visit will be scheduled.' },
  scheduled:          { label: 'Scheduled',          customer: 'Visit scheduled',       variant: 'accent',  hint: 'Your visit is scheduled.' },
  visit_underway:     { label: 'HomeServe visit',    customer: 'Team visiting',         variant: 'accent',  hint: 'Our team is visiting your home.' },
  in_progress:        { label: 'In progress',        customer: 'Work in progress',      variant: 'accent',  hint: 'Work is under way.' },
  completed:          { label: 'Completed',          customer: 'Completed — please confirm', variant: 'success', hint: 'Work is complete. Please confirm that you are happy, or tell us what is not right.' },
  customer_confirmed: { label: 'Customer confirmed', customer: 'You confirmed',         variant: 'success', hint: 'You confirmed the work. We will close the request.' },
  closed:             { label: 'Closed',             customer: 'Closed',                variant: 'default', hint: 'This request is closed.' },
  cancelled:          { label: 'Cancelled',          customer: 'Cancelled',             variant: 'danger',  hint: 'This request was cancelled.' },
}

/** The happy-path stages shown as a progress track (cancelled sits outside it). */
export const REQUEST_STEPS: RequestStatus[] = [
  'requested', 'confirmed', 'scheduled', 'visit_underway', 'in_progress', 'completed', 'customer_confirmed', 'closed',
]

/** Which status a given status may move to. Admin-driven except where noted. */
export const ADMIN_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  requested:          ['confirmed', 'cancelled'],
  confirmed:          ['scheduled', 'cancelled'],
  scheduled:          ['visit_underway', 'cancelled'],   // re-scheduling is done by adding a new visit
  visit_underway:     ['in_progress', 'completed', 'cancelled'],
  in_progress:        ['completed', 'cancelled'],
  completed:          ['closed', 'in_progress'],
  customer_confirmed: ['closed'],
  closed:             [],
  cancelled:          [],
}

export const CUSTOMER_CANCELLABLE: RequestStatus[] = ['requested', 'confirmed', 'scheduled']
export const OPEN_STATUSES: RequestStatus[] = ['requested', 'confirmed', 'scheduled', 'visit_underway', 'in_progress', 'completed', 'customer_confirmed']

export const TIME_SLOTS: { value: 'morning' | 'afternoon' | 'evening' | 'any'; label: string }[] = [
  { value: 'morning',   label: 'Morning (9am–12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm–4pm)' },
  { value: 'evening',   label: 'Evening (4pm–7pm)' },
  { value: 'any',       label: 'Any time' },
]
export const slotLabel = (v?: string | null) => TIME_SLOTS.find((s) => s.value === v)?.label ?? '—'

// ── Pricing presentation ─────────────────────────────────────────────────────

export const PRICE_UNIT_LABEL: Record<string, string> = {
  per_visit: 'per visit', per_unit: 'per unit', per_sqft: 'per sq ft', on_inspection: 'after inspection',
}

export const INDICATIVE_PRICE_NOTE =
  'Indicative price. The final amount depends on inspection, scope, materials and the work actually required. You will be told the charges before anything beyond the visit proceeds.'

export const NO_PRICE_LABEL = 'Quoted after inspection'

// ── Billing capabilities (isolating what the payment stack can actually do) ───
// Razorpay is integrated for one-time Orders only. Memberships are therefore sold as a
// fixed term paid up front, renewed by the customer. Monthly / auto-debit billing needs
// Razorpay Subscriptions (plan ids + mandates) and is intentionally NOT enabled.

export const MEMBERSHIP_BILLING = {
  autoRenewEnabled: false,
  monthlyBillingEnabled: false,
  renewalWindowDays: 45,      // "Renew" is offered this many days before the end date
  reminderDaysBefore: 30,     // renewal reminder email
  expiryNoticeDaysBefore: 7,  // final notice email
}

// ── Seasonal maintenance suggestions (advisory copy, Delhi NCR) ──────────────
// Shown as gentle reminders after handover. They are suggestions, not commitments.

export const SEASONAL_REMINDERS: { months: number[]; category: MaintenanceCategory; title: string; body: string }[] = [
  { months: [2, 3, 4],   category: 'ac_servicing',             title: 'Before the summer', body: 'Air conditioners are usually worth servicing before the peak of summer.' },
  { months: [5, 6],      category: 'waterproofing_inspection', title: 'Before the monsoon', body: 'A seepage and damp check on terraces, bathrooms and external walls is best done before the rains.' },
  { months: [6, 7, 8, 9], category: 'pest_control',            title: 'During the monsoon', body: 'Damp weather often brings pests indoors; a treatment now can stop a larger problem.' },
  { months: [9, 10],     category: 'painting_touchups',        title: 'After the rains', body: 'Check walls and ceilings for damp marks or peeling patches once the monsoon has passed.' },
  { months: [10, 11],    category: 'deep_cleaning',            title: 'Festive season', body: 'A deep clean before the festive season is a common time to refresh the home.' },
  { months: [11, 0],     category: 'home_inspection',          title: 'Year-end check', body: 'A yearly walk-through of plumbing, electrical points, woodwork and finishes helps catch small issues early.' },
]

/** Reminders relevant to the given month (0–11). */
export function remindersForMonth(month: number) {
  return SEASONAL_REMINDERS.filter((r) => r.months.includes(month))
}

/** Warranty vs maintenance — the one place this distinction is worded, so it stays consistent. */
export const WARRANTY_VS_MAINTENANCE = {
  warranty: 'Warranty covers issues with the work HomeServe did on your renovation, as set out in your project agreement.',
  maintenance: 'Maintenance is a separate, paid home-care service for upkeep and repairs, whether or not your home was renovated by HomeServe.',
  membership: 'A maintenance membership does not extend or change your renovation warranty.',
}
