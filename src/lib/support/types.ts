export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketCategory = 'general' | 'renovation' | 'maintenance' | 'billing' | 'account' | 'other'

export interface SupportTicket {
  id: string
  ticket_number: string
  user_id: string | null
  name: string
  email: string
  phone: string | null
  subject: string
  category: TicketCategory
  status: TicketStatus
  source: 'contact_form' | 'dashboard'
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface TicketMessage {
  id: string
  ticket_id: string
  sender_role: 'customer' | 'homeserve'
  body: string
  created_at: string
}

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  general: 'General enquiry',
  renovation: 'Renovation',
  maintenance: 'Home maintenance',
  billing: 'Billing & payments',
  account: 'My account',
  other: 'Something else',
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}
