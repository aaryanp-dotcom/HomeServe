'use client'

import { useId, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, Ruler } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BHK_SIZES, ROOM_TYPES, computeSize, formatBoth, newRoom, sqftToSqm, typicalRooms,
  type LengthUnit, type SizeMode, type SizeValue,
} from '@/lib/size'

const MODE_LABEL: Record<SizeMode, string> = {
  bhk_preset: 'Flat type',
  total_area: 'Total area',
  room_wise: 'Room by room',
}

const BAR_COLORS = ['bg-ink-900', 'bg-cobalt-400', 'bg-ink-600', 'bg-cobalt-300', 'bg-ink-400', 'bg-cobalt-600']

const cleanNumber = (s: string) => s.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 7)

const fieldCls =
  'w-full border-2 border-ink-900 bg-white px-3 py-2 text-sm coarse:text-base coarse:min-h-11 font-medium text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-900/60 focus:border-ink-900 focus:shadow-[0_0_0_3px_rgb(255_77_23/0.35)]'

function Segmented<T extends string>({
  id, value, options, onChange, small,
}: { id: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; small?: boolean }) {
  return (
    <div role="radiogroup" className="flex border-2 border-ink-900 bg-white">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex-1 whitespace-nowrap font-semibold transition-colors coarse:min-h-11',
              small ? 'px-2.5 py-1.5 text-[0.6875rem]' : 'px-2 py-2.5 text-xs',
              active ? 'text-white' : 'text-ink-900 hover:bg-paper-100',
            )}
          >
            {active && (
              <motion.span layoutId={`seg-${id}`} className="absolute inset-0 bg-ink-900" transition={{ type: 'spring', stiffness: 480, damping: 38 }} />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export interface SizeInputProps {
  value: SizeValue
  onChange: (v: SizeValue) => void
  modes?: SizeMode[]
  compact?: boolean
  className?: string
}

/**
 * Property size entry: pick a flat type, type a total area (sq ft / sq m) or list rooms
 * with their length × width (ft / m). The parent gets a normalised value and can call
 * `computeSize(value)` for the canonical square-foot area.
 */
export function SizeInput({ value, onChange, modes = ['bhk_preset', 'total_area', 'room_wise'], compact, className }: SizeInputProps) {
  const uid = useId()
  const result = useMemo(() => computeSize(value), [value])
  const set = (patch: Partial<SizeValue>) => onChange({ ...value, ...patch })

  const setUnit = (dimUnit: LengthUnit) => {
    // Convert typed dimensions so the numbers keep describing the same rooms.
    if (dimUnit === value.dimUnit) return
    const k = dimUnit === 'm' ? 1 / 3.28084 : 3.28084
    const conv = (s: string) => (s && !Number.isNaN(parseFloat(s)) ? String(Math.round(parseFloat(s) * k * 10) / 10) : s)
    onChange({ ...value, dimUnit, rooms: value.rooms.map((r) => ({ ...r, length: conv(r.length), width: conv(r.width) })) })
  }

  const updateRoom = (id: string, patch: Partial<{ name: string; length: string; width: string }>) =>
    set({ rooms: value.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) })

  const segments = result.rooms.filter((r) => r.area_sqft > 0)
  const total = result.areaSqft

  return (
    <div className={cn('space-y-4', className)}>
      {modes.length > 1 && (
        <Segmented
          id={uid}
          value={value.mode}
          options={modes.map((m) => ({ value: m, label: MODE_LABEL[m] }))}
          onChange={(mode) => {
            if (mode === 'room_wise' && value.rooms.length === 0) onChange({ ...value, mode, rooms: typicalRooms(value.bhk, value.dimUnit) })
            else set({ mode })
          }}
        />
      )}

      {/* ── Flat type ── */}
      {value.mode === 'bhk_preset' && (
        <div className={cn('grid gap-1.5', compact ? 'grid-cols-5' : 'grid-cols-3 sm:grid-cols-5')}>
          {Object.entries(BHK_SIZES).map(([k, v]) => {
            const on = value.bhk === k
            return (
              <button
                key={k}
                type="button"
                onClick={() => set({ bhk: k })}
                aria-pressed={on}
                className={cn(
                  'border-2 border-ink-900 px-1 py-2 text-center transition-colors coarse:min-h-11',
                  on ? 'bg-ink-900 text-white' : 'bg-white text-ink-900 hover:bg-paper-100',
                )}
              >
                <span className="block text-xs font-bold">{k}</span>
                {!compact && <span className={cn('block font-mono text-[0.6875rem] uppercase', on ? 'text-white/60' : 'text-ink-900/60')}>{v.label.replace('~', '')}</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Total area ── */}
      {value.mode === 'total_area' && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              inputMode="decimal"
              aria-label="Total area"
              value={value.area}
              onChange={(e) => set({ area: cleanNumber(e.target.value) })}
              placeholder={value.areaUnit === 'sqft' ? 'e.g. 1400' : 'e.g. 130'}
              className={cn(fieldCls, 'pr-16')}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[0.6875rem] uppercase tracking-wider text-ink-900/60">
              {value.areaUnit === 'sqft' ? 'sq ft' : 'sq m'}
            </span>
          </div>
          <div className="w-32 shrink-0">
            <Segmented
              id={`${uid}-au`}
              small
              value={value.areaUnit}
              options={[{ value: 'sqft', label: 'sq ft' }, { value: 'sqm', label: 'sq m' }]}
              onChange={(areaUnit) => {
                const n = parseFloat(value.area)
                const conv = Number.isFinite(n) ? String(Math.round(areaUnit === 'sqm' ? sqftToSqm(n) : n * 10.7639)) : value.area
                set({ areaUnit, area: conv })
              }}
            />
          </div>
        </div>
      )}

      {/* ── Room by room ── */}
      {value.mode === 'room_wise' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-900/60">
              <Ruler size={12} /> Length × width of each room
            </p>
            <div className="w-28">
              <Segmented id={`${uid}-du`} small value={value.dimUnit} options={[{ value: 'ft', label: 'feet' }, { value: 'm', label: 'metres' }]} onChange={setUnit} />
            </div>
          </div>

          <ul className="space-y-2">
            {value.rooms.map((r) => (
                <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_4.25rem_auto_4.25rem_1.75rem] items-center gap-1.5 sm:grid-cols-[minmax(0,1fr)_5rem_auto_5rem_1.75rem]">
                  <select
                    aria-label="Room type"
                    value={r.name}
                    onChange={(e) => updateRoom(r.id, { name: e.target.value })}
                    className={cn(fieldCls, 'px-2 py-2')}
                  >
                    {!ROOM_TYPES.includes(r.name as (typeof ROOM_TYPES)[number]) && <option value={r.name}>{r.name}</option>}
                    {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <input inputMode="decimal" aria-label={`${r.name} length`} placeholder="L" value={r.length} onChange={(e) => updateRoom(r.id, { length: cleanNumber(e.target.value) })} className={cn(fieldCls, 'px-2 text-center')} />
                  <span className="font-mono text-xs text-ink-900/60">×</span>
                  <input inputMode="decimal" aria-label={`${r.name} width`} placeholder="W" value={r.width} onChange={(e) => updateRoom(r.id, { width: cleanNumber(e.target.value) })} className={cn(fieldCls, 'px-2 text-center')} />
                  <button
                    type="button"
                    aria-label={`Remove ${r.name}`}
                    onClick={() => set({ rooms: value.rooms.filter((x) => x.id !== r.id) })}
                    className="flex h-8 w-7 items-center justify-center text-ink-900/60 transition-colors hover:text-cobalt-500"
                  >
                    <X size={15} />
                  </button>
                </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => set({ rooms: [...value.rooms, newRoom('Bedroom')] })}
              className="inline-flex items-center gap-1.5 border-2 border-dashed border-ink-900/50 px-3 py-1.5 text-xs font-semibold text-ink-900 transition-colors hover:border-ink-900 hover:bg-paper-100"
            >
              <Plus size={13} /> Add room
            </button>
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-900/60">or start from</span>
            {['1BHK', '2BHK', '3BHK', '4BHK'].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => set({ bhk: b, rooms: typicalRooms(b, value.dimUnit) })}
                className="border border-ink-900/30 px-2 py-1 font-mono text-[0.6875rem] font-semibold uppercase text-ink-900/70 transition-colors hover:border-ink-900 hover:text-ink-900"
              >
                {b}
              </button>
            ))}
          </div>

          {segments.length > 0 && (
            <div>
              <div className="flex h-7 overflow-hidden border-2 border-ink-900" aria-hidden>
                {segments.map((s, i) => (
                  <motion.div
                    key={`${s.name}-${i}`}
                    layout
                    style={{ flexGrow: s.area_sqft }}
                    className={cn('flex min-w-0 items-center justify-center overflow-hidden border-r border-white/40 last:border-r-0', BAR_COLORS[i % BAR_COLORS.length])}
                    title={`${s.name}: ${Math.round(s.area_sqft)} sq ft`}
                  >
                    {s.area_sqft / total > 0.1 && (
                      <span className="truncate px-1 font-mono text-[0.6875rem] uppercase text-white">{s.name.split(' ')[0]}</span>
                    )}
                  </motion.div>
                ))}
              </div>
              <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-wider text-ink-900/60">Share of total area</p>
            </div>
          )}
        </div>
      )}

      {/* ── Result ── */}
      <div className={cn('border-l-4 px-3 py-2', result.errors.length ? 'border-cobalt-500 bg-cobalt-50' : 'border-ink-900 bg-paper-100')}>
        {result.errors.length > 0 ? (
          <ul className="space-y-0.5 text-xs font-medium text-cobalt-700">
            {result.errors.slice(0, 3).map((e) => <li key={e}>{e}</li>)}
          </ul>
        ) : total > 0 ? (
          <p className="text-sm text-ink-900">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-900/60">Total · </span>
            <strong className="font-bold">{formatBoth(total)}</strong>
            {value.mode === 'bhk_preset' && <span className="ml-1.5 text-xs text-ink-900/60">typical for a {value.bhk}</span>}
            {value.mode === 'room_wise' && <span className="ml-1.5 text-xs text-ink-900/60">carpet area of {result.rooms.length} room{result.rooms.length === 1 ? '' : 's'} (excludes walls &amp; passages)</span>}
          </p>
        ) : (
          <p className="text-xs text-ink-900/60">
            {value.mode === 'total_area' ? 'Enter your carpet or built-up area.' : 'Enter room dimensions to see the total.'}
          </p>
        )}
      </div>
    </div>
  )
}
