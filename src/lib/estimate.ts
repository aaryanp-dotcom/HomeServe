
// ── Delhi NCR Pricing Configuration (centralised — update here to change rates) ──
// All rates in ₹. These are indicative market-benchmark bands for Delhi NCR (2025–26).
// Do NOT present these as final HomeServe prices before a site visit.

export const DELHI_NCR_PRICING = {
  // per sqft rates
  fullHomeRenovation: { essential: 800, standard: 1400, premium: 2200, luxury: 3200 },
  renovation:         { essential: 600, standard: 1000, premium: 1600, luxury: 2400 },
  painting:           { essential: 15,  standard: 22,   premium: 35,   luxury: 55   },
  flooring:           { essential: 70,  standard: 110,  premium: 180,  luxury: 280  },
  falseCeiling:       { essential: 60,  standard: 90,   premium: 140,  luxury: 200  },
  electrical:         { essential: 25,  standard: 40,   premium: 70,   luxury: 110  },
  plumbing:           { essential: 20,  standard: 35,   premium: 60,   luxury: 95   },
  // fixed rates per unit
  modularKitchen:     { essential: 80000,  standard: 150000, premium: 280000, luxury: 450000 },
  bathroomRenovation: { essential: 60000,  standard: 100000, premium: 180000, luxury: 300000 },
  carpentry:          { essential: 50,     standard: 85,     premium: 140,    luxury: 220    },
}

/** Estimator service → lead-form scope id (must match the renovation_scope enum). */
export const ESTIMATOR_SCOPE_TO_LEAD: Record<string, string> = {
  'Full Home Renovation': 'full_home', 'Modular Kitchen': 'kitchen', 'Home Renovation': 'other',
  'Painting': 'painting', 'Flooring': 'flooring', 'False Ceiling': 'false_ceiling',
  'Bathroom Renovation': 'bathroom', 'Electrical': 'electrical', 'Plumbing': 'plumbing',
  'Carpentry & Wardrobes': 'carpentry',
}
export const NCR_CITIES = ['Delhi', 'Noida', 'Greater Noida', 'Ghaziabad', 'Gurugram', 'Faridabad']

export const QUALITY_TIERS = ['Essential', 'Standard', 'Premium', 'Luxury'] as const
export type QualityTier = typeof QUALITY_TIERS[number]

// Map quality tier to DELHI_NCR_PRICING keys
const QUALITY_KEY: Record<QualityTier, 'essential' | 'standard' | 'premium' | 'luxury'> = {
  Essential: 'essential',
  Standard:  'standard',
  Premium:   'premium',
  Luxury:    'luxury',
}

export const SERVICE_BASE: Record<string, { label: string; unit: 'sqft' | 'fixed'; note: string }> = {
  'Full Home Renovation': { label: 'Full Home Renovation', unit: 'sqft', note: 'Comprehensive renovation including civil, flooring, painting, false ceiling, electrical & plumbing' },
  'Modular Kitchen':      { label: 'Modular Kitchen',      unit: 'fixed', note: 'Per kitchen unit, includes cabinets, shutters & hardware' },
  'Home Renovation':      { label: 'Home Renovation',      unit: 'sqft', note: 'Flooring, walls, basic fixtures — excludes modular work' },
  'Painting':             { label: 'Painting',             unit: 'sqft', note: 'Interior walls, 2–3 coats, excluding furniture movement' },
  'Flooring':             { label: 'Flooring',             unit: 'sqft', note: 'Material & labour — vitrified, marble or wooden' },
  'False Ceiling':        { label: 'False Ceiling',        unit: 'sqft', note: 'Gypsum board installation with finish' },
  'Bathroom Renovation':  { label: 'Bathroom Renovation',  unit: 'fixed', note: 'Per bathroom — tiles, sanitaryware, plumbing, fixtures' },
  'Electrical':           { label: 'Electrical Work',      unit: 'sqft', note: 'Wiring, switches, MCB panel — full rewiring or upgrade' },
  'Plumbing':             { label: 'Plumbing',             unit: 'sqft', note: 'Pipes, fittings, sanitaryware installation' },
  'Carpentry & Wardrobes':{ label: 'Carpentry & Wardrobes',unit: 'sqft', note: 'Custom wardrobes, TV unit, storage — per sqft of work' },
}

// Map service key to pricing table entry
const SERVICE_TO_RATES: Record<string, keyof typeof DELHI_NCR_PRICING> = {
  'Full Home Renovation': 'fullHomeRenovation',
  'Modular Kitchen':      'modularKitchen',
  'Home Renovation':      'renovation',
  'Painting':             'painting',
  'Flooring':             'flooring',
  'False Ceiling':        'falseCeiling',
  'Bathroom Renovation':  'bathroomRenovation',
  'Electrical':           'electrical',
  'Plumbing':             'plumbing',
  'Carpentry & Wardrobes':'carpentry',
}

export function formatINR(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

export function calcEstimate(serviceKey: string, sqft: number, quality: QualityTier): { low: number; high: number } {
  const rateKey = SERVICE_TO_RATES[serviceKey]
  if (!rateKey) return { low: 0, high: 0 }

  const rates = DELHI_NCR_PRICING[rateKey] as Record<string, number>
  const qKey = QUALITY_KEY[quality]
  const rate = rates[qKey] ?? 0

  const meta = SERVICE_BASE[serviceKey]
  const size = meta.unit === 'fixed' ? 1 : sqft

  // low = 85% of rate, high = 115% of rate (indicative range)
  return {
    low:  Math.round(rate * size * 0.85),
    high: Math.round(rate * size * 1.15),
  }
}

