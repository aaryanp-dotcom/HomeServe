import { createClient } from '@/lib/supabase/server'
import { CATEGORY_ORDER } from './config'
import type { MaintenancePlan, MaintenanceService } from './types'

/** Active catalogue, in display order. Reads through the caller's session; RLS exposes active rows only. */
export async function getActiveServices(): Promise<MaintenanceService[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('maintenance_services').select('*').eq('is_active', true).order('sort_order')
  const rows = (data ?? []) as MaintenanceService[]
  return rows.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.sort_order - b.sort_order)
}

export async function getServiceBySlug(slug: string): Promise<MaintenanceService | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('maintenance_services').select('*').eq('slug', slug).eq('is_active', true).maybeSingle()
  return (data as MaintenanceService | null) ?? null
}

/** Plans HomeServe has switched on. Empty until real pricing is entered and a plan is activated. */
export async function getActivePlans(): Promise<MaintenancePlan[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('maintenance_plans').select('*').eq('is_active', true).order('sort_order')
  return (data ?? []) as MaintenancePlan[]
}
