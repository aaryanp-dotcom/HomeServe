import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function bookingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    payment_pending: 'Awaiting Payment',
    confirmed: 'Confirmed',
    assigned: 'Contractor Assigned',
    in_progress: 'In Progress',
    milestone_1_done: 'Milestone 1 Complete',
    milestone_2_done: 'Milestone 2 Complete',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  }
  return labels[status] ?? status
}

export function bookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'amber',
    payment_pending: 'amber',
    confirmed: 'blue',
    assigned: 'navy',
    in_progress: 'purple',
    milestone_1_done: 'blue',
    milestone_2_done: 'blue',
    completed: 'emerald',
    cancelled: 'red',
    refunded: 'outline',
  }
  return colors[status] ?? 'outline'
}
