import {
  Droplets, Zap, Hammer, Snowflake, Refrigerator, Bug, SprayCan, PaintRoller,
  Umbrella, ShowerHead, CookingPot, ClipboardCheck, Wrench, type LucideIcon,
} from 'lucide-react'
import type { MaintenanceCategory } from '@/lib/maintenance/config'

const ICONS: Record<MaintenanceCategory, LucideIcon> = {
  plumbing: Droplets,
  electrical: Zap,
  carpentry: Hammer,
  ac_servicing: Snowflake,
  appliance_servicing: Refrigerator,
  pest_control: Bug,
  deep_cleaning: SprayCan,
  painting_touchups: PaintRoller,
  waterproofing_inspection: Umbrella,
  bathroom_maintenance: ShowerHead,
  kitchen_maintenance: CookingPot,
  home_inspection: ClipboardCheck,
}

export function CategoryIcon({ category, size = 20, className }: { category: MaintenanceCategory; size?: number; className?: string }) {
  const Icon = ICONS[category] ?? Wrench
  return <Icon size={size} className={className} />
}
