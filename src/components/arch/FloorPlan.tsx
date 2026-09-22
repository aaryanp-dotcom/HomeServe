'use client'

import { motion, type Variants } from 'framer-motion'
import { useReducedMotion } from '@/components/motion/useReducedMotion'

const EASE = [0.16, 1, 0.3, 1] as const
const INK = '#111111'
const ORANGE = '#FF4D17'

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}z`

// Outer walls are drawn as segments so window / door openings are real gaps.
const OUTER = [
  'M80 80H110', 'M190 80H380', 'M480 80H560',            // top (kitchen + master windows)
  'M560 80V110', 'M560 200V300', 'M560 340V400',         // right (master + bath windows)
  'M560 400H430', 'M360 400H175', 'M130 400H80',         // bottom (bedroom-2 window, main door)
  'M80 400V340', 'M80 250V80',                           // left (living window)
]
const INNER = [
  'M300 80V196', 'M300 241V340', 'M300 385V400',         // spine wall with two door openings
  'M80 190H130', 'M230 190H300',                         // kitchen opening
  'M300 250H560',                                        // master / rooms below
  'M470 250V270', 'M470 315V400',                        // ensuite door
]
const DOORS = [
  'M130 400V355', 'M130 355A45 45 0 0 1 175 400',        // main door
  'M300 196H345', 'M345 196A45 45 0 0 1 300 241',        // living → master
  'M300 340H345', 'M345 340A45 45 0 0 1 300 385',        // living → bedroom 2
  'M470 270H515', 'M515 270A45 45 0 0 1 470 315',        // bedroom 2 → bath
]
const WINDOWS = [
  'M110 76H190M110 80H190M110 84H190',
  'M380 76H480M380 80H480M380 84H480',
  'M556 110V200M560 110V200M564 110V200',
  'M556 300V340M560 300V340M564 300V340',
  'M360 396H430M360 400H430M360 404H430',
  'M76 250V340M80 250V340M84 250V340',
]
const FURNITURE = [
  rect(84, 84, 212, 28), rect(84, 112, 28, 74),          // kitchen counters
  rect(140, 92, 26, 14), rect(238, 90, 40, 18),          // sink, hob
  rect(120, 215, 84, 34),                                // dining table
  rect(150, 338, 122, 42), rect(180, 300, 62, 24),       // sofa + coffee table
  rect(400, 84, 120, 100), rect(410, 88, 42, 16), rect(468, 88, 42, 16), // master bed + pillows
  rect(304, 84, 22, 100),                                // wardrobe
  rect(340, 258, 96, 84), rect(350, 262, 34, 14), rect(392, 262, 34, 14), // bedroom-2 bed
  rect(448, 275, 18, 120),                               // wardrobe
  rect(520, 256, 36, 84),                                // tub
]
const WC = 'M500 380a12 12 0 1 0 24 0a12 12 0 1 0 -24 0M496 388h32v8h-32z'

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { duration: 1.1, ease: EASE } },
}
const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: EASE } },
}
const group = (delay: number, stagger = 0.06): Variants => ({
  hidden: {},
  show: { transition: { delayChildren: delay, staggerChildren: stagger } },
})

function Paths({ d, width, color = INK, opacity = 1, delay = 0, stagger = 0.06, cap = 'square' }: {
  d: string[]; width: number; color?: string; opacity?: number; delay?: number; stagger?: number
  cap?: 'square' | 'butt' | 'round'
}) {
  return (
    <motion.g variants={group(delay, stagger)} fill="none" stroke={color} strokeWidth={width} strokeLinecap={cap} strokeLinejoin="miter" opacity={opacity}>
      {d.map((p) => <motion.path key={p} d={p} variants={draw} />)}
    </motion.g>
  )
}

const T = ({ x, y, children, size = 10, anchor = 'start', fill = INK, weight = 500, o = 1 }: {
  x: number; y: number; children: React.ReactNode; size?: number; anchor?: 'start' | 'middle' | 'end'; fill?: string; weight?: number; o?: number
}) => (
  <text x={x} y={y} fontSize={size} textAnchor={anchor} fill={fill} fontWeight={weight} opacity={o}
    style={{ fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
    {children}
  </text>
)

/** Animated architectural floor plan of a 3-room residence. Pure SVG, no assets. */
export function FloorPlan({ className, still = false }: { className?: string; still?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.svg
      viewBox="0 0 620 560"
      className={className}
      role="img"
      aria-label="Architectural floor plan of a residence with kitchen, living room, master bedroom, second bedroom and bath"
      initial={reduce || still ? false : 'hidden'}
      animate="show"
      variants={group(0.2, 0.25)}
    >
      {/* structural grid bubbles + dashed axes */}
      <motion.g variants={fade}>
        {[['A', 80], ['B', 300], ['C', 560]].map(([l, x]) => (
          <g key={l as string}>
            <line x1={x as number} x2={x as number} y1={34} y2={430} stroke={INK} strokeWidth={0.8} strokeDasharray="10 4 2 4" opacity={0.28} />
            <circle cx={x as number} cy={22} r={11} fill="#fff" stroke={INK} strokeWidth={1.2} />
            <T x={x as number} y={26} anchor="middle" size={11} weight={700}>{l as string}</T>
          </g>
        ))}
        {[['1', 80], ['2', 400]].map(([l, y]) => (
          <g key={l as string}>
            <line y1={y as number} y2={y as number} x1={30} x2={600} stroke={INK} strokeWidth={0.8} strokeDasharray="10 4 2 4" opacity={0.22} />
            <circle cx={14} cy={y as number} r={11} fill="#fff" stroke={INK} strokeWidth={1.2} />
            <T x={14} y={(y as number) + 4} anchor="middle" size={11} weight={700}>{l as string}</T>
          </g>
        ))}
      </motion.g>

      {/* dimension chains */}
      <motion.g variants={fade} stroke={INK} strokeWidth={1} fill="none">
        <path d="M80 56H560M80 50V62M560 50V62M300 50V62" />
        <path d="M46 80V400M40 80H52M40 400H52" />
        <path d="M76 60l8-8M296 60l8-8M556 60l8-8" strokeWidth={1.6} />
        <path d="M42 84l8-8M42 404l8-8" strokeWidth={1.6} />
        <rect x={162} y={48} width={56} height={16} fill="#fff" stroke="none" />
        <rect x={402} y={48} width={56} height={16} fill="#fff" stroke="none" />
      </motion.g>
      <motion.g variants={fade}>
        <T x={190} y={61} size={12} anchor="middle">4.40 m</T>
        <T x={430} y={61} size={12} anchor="middle">5.20 m</T>
        <text transform="translate(36 244) rotate(-90)" fontSize={12} textAnchor="middle" fill={INK}
          style={{ fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.08em' }}>6.40 M</text>
      </motion.g>

      {/* furniture (thin), then structure (heavy) */}
      <Paths d={FURNITURE} width={1.3} opacity={0.42} delay={0.9} stagger={0.045} cap="butt" />
      <Paths d={[WC]} width={1.3} opacity={0.42} delay={1.4} />
      <Paths d={OUTER} width={9} delay={0.15} stagger={0.07} />
      <Paths d={INNER} width={5} delay={0.7} stagger={0.07} />
      <Paths d={WINDOWS} width={1.2} delay={1.2} stagger={0.05} cap="butt" />
      <Paths d={DOORS} width={1.5} delay={1.35} stagger={0.05} cap="butt" />

      {/* room tags */}
      <motion.g variants={group(1.7, 0.1)}>
        {[
          { n: '01', t: 'Kitchen', x: 136, y: 150, m: '7.8 m²' },
          { n: '02', t: 'Living + dining', x: 116, y: 296, m: '23.1 m²' },
          { n: '03', t: 'Master bedroom', x: 376, y: 224, m: '19.0 m²' },
          { n: '04', t: 'Bedroom 2', x: 376, y: 372, m: '13.1 m²' },
          { n: '05', t: 'Bath', x: 496, y: 346, m: '5.6 m²' },
        ].map((r) => (
          <motion.g key={r.n} variants={fade}>
            <circle cx={r.x - 13} cy={r.y - 4} r={10} fill={ORANGE} />
            <T x={r.x - 13} y={r.y} anchor="middle" size={10.5} fill="#fff" weight={700}>{r.n}</T>
            <T x={r.x + 2} y={r.y} size={13} weight={700}>{r.t}</T>
            <T x={r.x + 2} y={r.y + 15} size={10.5} o={0.6}>{r.m}</T>
          </motion.g>
        ))}
      </motion.g>

      {/* north arrow + scale bar */}
      <motion.g variants={fade}>
        <g transform="translate(300 492)">
          <circle r={14} fill="#fff" stroke={INK} strokeWidth={1.2} />
          <path d="M0 -10L5 8L0 4L-5 8Z" fill={INK} />
          <T x={0} y={-18} anchor="middle" size={11} weight={700}>N</T>
        </g>
        <g transform="translate(80 470)">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 50} y={0} width={50} height={7} fill={i % 2 ? '#fff' : INK} stroke={INK} strokeWidth={1} />
          ))}
          {['0', '1', '2', '3 m'].map((l, i) => <T key={l} x={i * 50} y={22} anchor="middle" size={10.5}>{l}</T>)}
        </g>
        <T x={80} y={526} size={10.5} o={0.65}>Ground floor plan · Scale 1:50</T>
      </motion.g>
    </motion.svg>
  )
}
