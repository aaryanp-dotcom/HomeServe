'use client'

import { useRouter } from 'next/navigation'
import { TicketForm } from '@/components/support/TicketForm'

export function NewTicketClient({ defaultName, defaultEmail, defaultPhone }: { defaultName: string; defaultEmail: string; defaultPhone: string }) {
  const router = useRouter()
  return (
    <TicketForm
      defaultName={defaultName} defaultEmail={defaultEmail} defaultPhone={defaultPhone} source="dashboard"
      onSuccess={({ id }) => { router.push(`/homeowner/support/${id}?new=1`); router.refresh() }}
    />
  )
}
