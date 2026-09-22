/**
 * Property size model shared by the estimator, the lead form, site visits and quotations.
 * Everything is stored canonically in square feet; the UI lets people think in sq ft or
 * sq m, and in feet or metres for room dimensions.
 */

export type SizeMode = 'bhk_preset' | 'total_area' | 'room_wise'
export type AreaUnit = 'sqft' | 'sqm'
export type LengthUnit = 'ft' | 'm'

export const SQFT_PER_SQM = 10.7639
export const FT_PER_M = 3.28084

export const LIMITS = { minSqft: 50, maxSqft: 50000, minDimFt: 3, maxDimFt: 100 } as const

/** Typical built-up area for common Indian flat types (indicative, used only for presets). */
export const BHK_SIZES: Record<string, { sqft: number; label: string }> = {
  '1BHK':  { sqft: 500,  label: '~500 sq ft' },
  '2BHK':  { sqft: 900,  label: '~900 sq ft' },
  '3BHK':  { sqft: 1300, label: '~1,300 sq ft' },
  '4BHK':  { sqft: 1800, label: '~1,800 sq ft' },
  'Villa': { sqft: 2800, label: '~2,800 sq ft' },
}

export const ROOM_TYPES = [
  'Living room', 'Master bedroom', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining',
  'Balcony', 'Study', 'Puja room', 'Utility', 'Other',
] as const

export interface RoomRow { id: string; name: string; length: string; width: string }

export interface SizeValue {
  mode: SizeMode
  bhk: string
  /** Free-typed total area, in `areaUnit`. */
  area: string
  areaUnit: AreaUnit
  /** Unit used for room dimensions. */
  dimUnit: LengthUnit
  rooms: RoomRow[]
}

export const DEFAULT_SIZE: SizeValue = { mode: 'bhk_preset', bhk: '3BHK', area: '', areaUnit: 'sqft', dimUnit: 'ft', rooms: [] }

export interface RoomDetail { name: string; length_ft: number; width_ft: number; area_sqft: number }
export interface SizePayload { sizeMode: SizeMode; areaSqft: number; bhk: string | null; rooms: RoomDetail[] }

const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp
const num = (s: string) => { const n = parseFloat(s); return Number.isFinite(n) ? n : NaN }
export const toSqft = (area: number, unit: AreaUnit) => (unit === 'sqm' ? area * SQFT_PER_SQM : area)
export const toFeet = (len: number, unit: LengthUnit) => (unit === 'm' ? len * FT_PER_M : len)
export const sqftToSqm = (sqft: number) => sqft / SQFT_PER_SQM

let seq = 0
export const newRoom = (name: string = 'Bedroom', length = '', width = ''): RoomRow => ({
  id: `r${Date.now().toString(36)}${(seq++).toString(36)}`, name, length, width,
})

const TYPICAL: Record<string, [string, number, number][]> = {
  '1BHK': [['Living room', 11, 14], ['Bedroom', 10, 12], ['Kitchen', 8, 9], ['Bathroom', 5, 7], ['Balcony', 4, 8]],
  '2BHK': [['Living room', 12, 15], ['Master bedroom', 11, 13], ['Bedroom', 10, 11], ['Kitchen', 8, 10], ['Bathroom', 5, 8], ['Bathroom', 5, 7], ['Balcony', 4, 9]],
  '3BHK': [['Living room', 12, 18], ['Dining', 9, 10], ['Master bedroom', 12, 14], ['Bedroom', 11, 12], ['Bedroom', 10, 11], ['Kitchen', 9, 11], ['Bathroom', 5, 8], ['Bathroom', 5, 7], ['Bathroom', 5, 7], ['Balcony', 5, 10]],
  '4BHK': [['Living room', 14, 20], ['Dining', 10, 12], ['Master bedroom', 14, 16], ['Bedroom', 12, 13], ['Bedroom', 11, 12], ['Bedroom', 10, 12], ['Kitchen', 10, 12], ['Bathroom', 6, 9], ['Bathroom', 5, 8], ['Bathroom', 5, 7], ['Bathroom', 5, 7], ['Puja room', 5, 6], ['Balcony', 5, 12]],
  'Villa': [['Living room', 16, 24], ['Dining', 12, 14], ['Master bedroom', 16, 18], ['Bedroom', 13, 15], ['Bedroom', 12, 14], ['Bedroom', 12, 13], ['Kitchen', 12, 14], ['Bathroom', 7, 10], ['Bathroom', 6, 8], ['Bathroom', 6, 8], ['Study', 10, 12], ['Puja room', 6, 6], ['Utility', 6, 8]],
}

/** A starting layout the user can edit: typical room sizes for the chosen flat type, in `unit`. */
export function typicalRooms(bhk: string, unit: LengthUnit = 'ft'): RoomRow[] {
  const f = (ft: number) => String(unit === 'm' ? round(ft / FT_PER_M, 1) : ft)
  return (TYPICAL[bhk] ?? TYPICAL['2BHK']).map(([n, l, w]) => newRoom(n, f(l), f(w)))
}

export interface SizeResult { areaSqft: number; rooms: RoomDetail[]; errors: string[] }

/** Turn what the user typed into a canonical area (+ per-room details) and any problems. */
export function computeSize(v: SizeValue): SizeResult {
  const errors: string[] = []
  const rooms: RoomDetail[] = []
  let areaSqft = 0

  if (v.mode === 'bhk_preset') {
    // The BHK grid picks a typical starting size, but a flat's actual carpet area rarely matches
    // the typical number exactly — `area` doubles as an optional override here (same field the
    // total_area mode uses), so switching to a separate mode isn't the only way to enter it.
    if (v.area.trim() !== '') {
      const n = num(v.area)
      if (!(n > 0)) errors.push('Enter a valid area')
      else areaSqft = round(toSqft(n, v.areaUnit), 1)
    } else {
      areaSqft = BHK_SIZES[v.bhk]?.sqft ?? 0
    }
  } else if (v.mode === 'total_area') {
    const n = num(v.area)
    if (v.area.trim() !== '') {
      if (!(n > 0)) errors.push('Enter a valid area')
      else areaSqft = round(toSqft(n, v.areaUnit), 1)
    }
  } else {
    v.rooms.forEach((r, i) => {
      const l = num(r.length), w = num(r.width)
      if (r.length.trim() === '' && r.width.trim() === '') return
      const lf = toFeet(l, v.dimUnit), wf = toFeet(w, v.dimUnit)
      if (!(l > 0) || !(w > 0)) { errors.push(`${r.name || `Room ${i + 1}`}: enter both length and width`); return }
      if (lf < LIMITS.minDimFt || wf < LIMITS.minDimFt || lf > LIMITS.maxDimFt || wf > LIMITS.maxDimFt) {
        errors.push(`${r.name || `Room ${i + 1}`}: dimensions look off (${LIMITS.minDimFt}–${LIMITS.maxDimFt} ft expected)`)
        return
      }
      const area = round(lf * wf, 1)
      rooms.push({ name: r.name || `Room ${i + 1}`, length_ft: round(lf, 2), width_ft: round(wf, 2), area_sqft: area })
      areaSqft += area
    })
    areaSqft = round(areaSqft, 1)
  }

  if (areaSqft > 0 && (areaSqft < LIMITS.minSqft || areaSqft > LIMITS.maxSqft)) {
    errors.push(`Total area should be between ${LIMITS.minSqft} and ${LIMITS.maxSqft.toLocaleString('en-IN')} sq ft`)
  }
  return { areaSqft: errors.length ? 0 : areaSqft, rooms: errors.length ? [] : rooms, errors }
}

/** Payload sent to the API. Returns null when there is no valid size yet. */
export function sizePayload(v: SizeValue): SizePayload | null {
  const r = computeSize(v)
  if (r.errors.length || r.areaSqft <= 0) return null
  return { sizeMode: v.mode, areaSqft: r.areaSqft, bhk: v.mode === 'bhk_preset' ? v.bhk : null, rooms: r.rooms }
}

export const formatSqft = (n: number) => `${Math.round(n).toLocaleString('en-IN')} sq ft`
export const formatBoth = (sqft: number) => `${formatSqft(sqft)} (${Math.round(sqftToSqm(sqft)).toLocaleString('en-IN')} sq m)`

// ── URL handoff (estimator → lead form) ─────────────────────────────────────────
// mode=room_wise&du=ft&rooms=Living%20room:12x18;Bedroom:11x12   |   mode=total_area&area=1400&au=sqft   |   mode=bhk_preset&bhk=3BHK

export function encodeSize(v: SizeValue): string {
  const p = new URLSearchParams({ mode: v.mode })
  if (v.mode === 'bhk_preset') {
    p.set('bhk', v.bhk)
    if (v.area.trim() !== '') { p.set('area', v.area); p.set('au', v.areaUnit) }
  }
  if (v.mode === 'total_area') { p.set('area', v.area); p.set('au', v.areaUnit) }
  if (v.mode === 'room_wise') {
    p.set('du', v.dimUnit)
    p.set('rooms', v.rooms.filter((r) => r.length && r.width).map((r) => `${r.name}:${r.length}x${r.width}`).join(';'))
  }
  return p.toString()
}

export function decodeSize(sp: Record<string, string | string[] | undefined>): SizeValue | null {
  const g = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v[0] : v }
  const mode = g('mode')
  if (mode !== 'bhk_preset' && mode !== 'total_area' && mode !== 'room_wise') return null
  const v: SizeValue = { ...DEFAULT_SIZE, mode }
  if (mode === 'bhk_preset') {
    const b = g('bhk'); if (b && BHK_SIZES[b]) v.bhk = b
    const a = g('area'); if (a) { v.area = a.slice(0, 10); v.areaUnit = g('au') === 'sqm' ? 'sqm' : 'sqft' }
  }
  if (mode === 'total_area') { v.area = (g('area') ?? '').slice(0, 10); v.areaUnit = g('au') === 'sqm' ? 'sqm' : 'sqft' }
  if (mode === 'room_wise') {
    v.dimUnit = g('du') === 'm' ? 'm' : 'ft'
    v.rooms = (g('rooms') ?? '').split(';').slice(0, 20).map((s, i) => {
      const [name, dims = ''] = s.split(':'); const [l = '', w = ''] = dims.split('x')
      return { id: `q${i}`, name: name.slice(0, 40), length: l.slice(0, 6), width: w.slice(0, 6) }
    }).filter((r) => r.name)
  }
  return v
}

/** Rebuild an editable SizeValue from data saved on a lead / site visit. */
export function sizeFromSaved(s: { size_input_mode?: string | null; carpet_area_sqft?: number | string | null; rooms_detail?: unknown; bhk?: string | null }): SizeValue {
  const rooms = Array.isArray(s.rooms_detail) ? (s.rooms_detail as RoomDetail[]) : []
  const area = Number(s.carpet_area_sqft ?? 0)
  if (rooms.length) {
    return { ...DEFAULT_SIZE, mode: 'room_wise', rooms: rooms.map((r, i) => ({ id: `s${i}`, name: r.name, length: String(r.length_ft), width: String(r.width_ft) })) }
  }
  if (area > 0) return { ...DEFAULT_SIZE, mode: 'total_area', area: String(area), areaUnit: 'sqft' }
  return DEFAULT_SIZE
}
