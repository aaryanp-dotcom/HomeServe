import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
        display: ["var(--font-body)", ...fontFamily.sans],
      },

      // ── Design Tokens ──────────────────────────────────────────────
      colors: {
        // BLUEPRINT palette. `cobalt` keeps its legacy name but is now safety orange
        // (the single accent); `navy` is now neutral ink. Renaming would touch ~100 files.
        
        navy: {
          50: "#F3F3F2",
          100: "#E4E4E2",
          200: "#C9C9C5",
          300: "#A3A39D",
          400: "#77776F",
          500: "#55554E",
          600: "#3B3B36",
          700: "#2A2A26",
          800: "#1C1B19",
          900: "#111111",
          950: "#0B0B0A",
        },
        // PRIMARY accent = cobalt-400 (#FF4D17); 500 for text/buttons on paper
        cobalt: {
          50: "#FFF2EC",
          100: "#FFE0D2",
          200: "#FFC1A6",
          300: "#FF9B73",
          400: "#FF4D17",
          500: "#C22F05",
          600: "#A92A06",
          700: "#8F2304",
          800: "#7F2007",
          900: "#561708",
          950: "#2F0C04",
        },
        // Paper (page background) — `cream` kept as an alias for older components
        
        paper: {
          50: "#F7F4ED",
          100: "#EEEAE1",
          200: "#E2DDD0",
          300: "#CFC8B6",
        },
        
        cream: {
          50: "#F7F4ED",
          100: "#EEEAE1",
          200: "#E2DDD0",
          300: "#CFC8B6",
        },
        
        ink: {
          50: "#F3F3F2",
          100: "#E4E4E2",
          200: "#C9C9C5",
          300: "#A3A39D",
          400: "#77776F",
          500: "#55554E",
          600: "#3B3B36",
          700: "#2A2A26",
          800: "#1C1B19",
          900: "#111111",
          950: "#0B0B0A",
        },
        
        brass: {
          300: "#FF9B73",
          400: "#FF4D17",
          500: "#C22F05",
        },
        // Warm stone — the neutral base for the entire UI
        
        stone: {
          50: "#F7F4ED",
          75: "#F3EFE7",
          100: "#EEEAE1",
          150: "#E0DBCE",
          200: "#D3CDBE",
          300: "#BDB6A4",
          400: "#6F6959",
          500: "#6E6858",
          600: "#524D40",
          700: "#3A362D",
          800: "#211F1A",
          900: "#131210",
          950: "#0B0B0A",
        },
        // Warm sage — success / nature signals
        sage: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        // Warm amber — warnings / budgets / gold tier
        amber: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        // Warm rose — destructive / alerts
        rose: {
          50:  "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
      },

      // ── Spacing — strict 8pt grid ──────────────────────────────────
      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "15":  "3.75rem",
        "17":  "4.25rem",
        "18":  "4.5rem",
        "22":  "5.5rem",
        "26":  "6.5rem",
        "30":  "7.5rem",
        "34":  "8.5rem",
        "38":  "9.5rem",
        "42":  "10.5rem",
        "46":  "11.5rem",
        "50":  "12.5rem",
        "76":  "19rem",
        "84":  "21rem",
        "88":  "22rem",
        "92":  "23rem",
        "100": "25rem",
        "104": "26rem",
        "108": "27rem",
        "112": "28rem",
        "120": "30rem",
      },

      // ── Typography ─────────────────────────────────────────────────
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "0.875rem" }],
        "xs":  ["0.75rem",  { lineHeight: "1rem" }],
        "sm":  ["0.875rem", { lineHeight: "1.375rem" }],
        "base":["1rem",     { lineHeight: "1.625rem" }],
        "lg":  ["1.125rem", { lineHeight: "1.75rem" }],
        "xl":  ["1.25rem",  { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem",   { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.375rem" }],
        "4xl": ["2.25rem",  { lineHeight: "2.75rem" }],
        "5xl": ["3rem",     { lineHeight: "3.5rem" }],
        "6xl": ["3.75rem",  { lineHeight: "4.25rem" }],
        "7xl": ["4.5rem",   { lineHeight: "5rem" }],
        "8xl": ["6rem",     { lineHeight: "6.5rem" }],
        "9xl": ["8rem",     { lineHeight: "8.5rem" }],
      },

      letterSpacing: {
        "tighter": "-0.04em",
        "tight":   "-0.02em",
        "snug":    "-0.01em",
        "normal":  "0em",
        "wide":    "0.02em",
        "wider":   "0.06em",
        "widest":  "0.12em",
      },

      // ── Shadows — minimal, warm-tinted ────────────────────────────
      boxShadow: {
        "xs":   "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        "sm":   "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "md":   "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        "lg":   "0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
        "xl":   "0 20px 25px -5px rgb(0 0 0 / 0.07), 0 8px 10px -6px rgb(0 0 0 / 0.04)",
        "2xl":  "0 25px 50px -12px rgb(0 0 0 / 0.12)",
        "card": "0 0 0 1px rgb(0 0 0 / 0.04), 0 2px 4px 0 rgb(0 0 0 / 0.04), 0 8px 16px -4px rgb(0 0 0 / 0.06)",
        "card-hover": "0 0 0 1px rgb(0 0 0 / 0.06), 0 4px 8px 0 rgb(0 0 0 / 0.06), 0 16px 32px -8px rgb(0 0 0 / 0.10)",
        "card-md": "0 0 0 1px rgb(0 0 0 / 0.06), 0 4px 8px 0 rgb(0 0 0 / 0.06), 0 16px 32px -8px rgb(0 0 0 / 0.10)",
        "card-lg": "0 0 0 1px rgb(0 0 0 / 0.06), 0 8px 16px 0 rgb(0 0 0 / 0.08), 0 24px 48px -12px rgb(0 0 0 / 0.12)",
        "cobalt": "0 0 0 3px rgb(61 90 241 / 0.12)",
        "inner": "inset 0 1px 2px 0 rgb(0 0 0 / 0.04)",
        "hard":  "4px 4px 0 0 #111111",
        "hard-orange": "4px 4px 0 0 #FF4D17",
        // Ambient, no-offset shadow for the warm/reassurance surfaces — pairs with rounded-soft.
        "soft":  "0 2px 8px 0 rgb(19 18 16 / 0.05), 0 12px 32px -8px rgb(19 18 16 / 0.12)",
        "none":  "none",
      },

      // ── Border Radius ─────────────────────────────────────────────
      borderRadius: {
        "none": "0",
        "xs":   "0",
        "sm":   "0",
        "DEFAULT": "0",
        "md":   "0.125rem",
        "lg":   "0.125rem",
        "xl":   "0.125rem",
        "2xl":  "0.1875rem",
        "3xl":  "0.1875rem",
        "4xl":  "0.25rem",
        "5xl":  "0.25rem",
        "full": "9999px",
        // Reserved for warm, reassurance-toned surfaces (empty states, dashboard CTAs, warranty/support
        // notices) that intentionally break from the sharp architectural system elsewhere on the site —
        // see `.panel-warm` in globals.css.
        "soft":    "1.25rem",
        "soft-sm": "0.875rem",
      },

      // ── Animations ────────────────────────────────────────────────
      animation: {
        "fade-in":      "fadeIn 0.3s ease-out forwards",
        "fade-up":      "fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-down":    "fadeDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in":     "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up":     "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-left":   "slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "shimmer":      "shimmer 2s linear infinite",
        "float":        "float 6s ease-in-out infinite",
        "pulse-slow":   "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":    "spin 8s linear infinite",
        "bounce-sm":    "bounceSm 1s ease-in-out infinite",
        "ping-once":    "ping 0.6s cubic-bezier(0, 0, 0.2, 1) forwards",
        "reveal":       "reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "marquee":      "marquee 38s linear infinite",
        "orb":          "orb 14s ease-in-out infinite",
        "ken-burns":    "kenBurns 22s ease-out forwards",
      },

      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        orb: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%":      { transform: "translate3d(40px,-30px,0) scale(1.15)" },
        },
        kenBurns: { from: { transform: "scale(1.14)" }, to: { transform: "scale(1.02)" } },
        fadeIn:    { from: { opacity: "0" }, to: { opacity: "1" } },
        fadeUp:    { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeDown:  { from: { opacity: "0", transform: "translateY(-8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn:   { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } },
        slideUp:   { from: { opacity: "0", transform: "translateY(24px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideLeft: { from: { opacity: "0", transform: "translateX(16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        shimmer:   { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        bounceSm: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-4px)" },
        },
        reveal: {
          from: { opacity: "0", transform: "translateY(20px) scale(0.98)" },
          to:   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },

      // ── Easing ────────────────────────────────────────────────────
      transitionTimingFunction: {
        "spring":   "cubic-bezier(0.16, 1, 0.3, 1)",
        "smooth":   "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce":   "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "sharp":    "cubic-bezier(0.4, 0, 1, 1)",
      },

      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
        "250": "250ms",
        "350": "350ms",
        "400": "400ms",
        "500": "500ms",
        "600": "600ms",
        "800": "800ms",
      },

      // ── Layout helpers ────────────────────────────────────────────
      maxWidth: {
        "8xl":  "88rem",
        "9xl":  "96rem",
        "10xl": "106rem",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E\")",
      },

      aspectRatio: {
        "4/3":  "4 / 3",
        "3/2":  "3 / 2",
        "5/3":  "5 / 3",
        "16/9": "16 / 9",
        "golden": "1.618 / 1",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    // coarse: — touch screens (phones, tablets), regardless of width. Used for 44px tap targets.
    ({ addVariant }: { addVariant: (n: string, d: string) => void }) => addVariant("coarse", "@media (pointer: coarse)"),
  ],
};

export default config;
