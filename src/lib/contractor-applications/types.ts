import type { ServiceCategory } from '@/types'

export type ContractorApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface ContractorApplication {
  id: string
  full_name: string
  email: string
  phone: string
  city: string | null
  experience_years: number
  specializations: ServiceCategory[]
  message: string | null
  status: ContractorApplicationStatus
  admin_notes: string | null
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  approved_user_id: string | null
  created_at: string
}

export const STATUS_LABEL: Record<ContractorApplicationStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Not moving forward',
}
