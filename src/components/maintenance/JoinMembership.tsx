'use client'

import { useState } from 'react'
import { PropertyPicker, type AddressSuggestion } from './PropertyPicker'
import { PayButton } from './PayButton'
import type { Property } from '@/lib/maintenance/types'

/** Choose the home a membership is for, then pay. `taken` maps property ids that already have a membership. */
export function JoinMembership({
  planId, planName, priceText, properties: initial, taken, suggestions,
}: {
  planId: string; planName: string; priceText: string; properties: Property[]; taken: Record<string, string>; suggestions?: AddressSuggestion[]
}) {
  const [properties, setProperties] = useState(initial)
  const [propertyId, setPropertyId] = useState(initial.find((p) => !taken[p.id])?.id ?? '')
  const blocked = propertyId ? taken[propertyId] : ''

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-900/60">Which home is this for?</p>
        <PropertyPicker properties={properties} value={propertyId} onChange={setPropertyId} onAdded={(p) => setProperties((prev) => [...prev, p])} suggestions={suggestions} />
        <p className="mt-2 text-xs text-stone-500">A membership covers one home.</p>
      </div>
      {blocked && <p className="border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">This home already has a {blocked} membership. You can renew it from your membership page.</p>}
      <PayButton
        createUrl="/api/maintenance/memberships" createBody={{ plan_id: planId, property_id: propertyId }}
        label={`Pay ${priceText} and start ${planName}`} description={`${planName} membership`} size="lg"
      />
      {!propertyId && <p className="text-xs text-stone-500">Choose or add a home to continue.</p>}
    </div>
  )
}
