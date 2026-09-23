import type { Metadata } from 'next'

/**
 * Canonical site origin, no trailing slash. `NEXT_PUBLIC_APP_URL` is the one place this is set —
 * see .env.local.example. It still points at localhost by default; production deploys must override it
 * with the real domain, or canonical URLs, the sitemap, robots.txt and Open Graph tags will all point at
 * localhost. (Flagged in the launch checklist — this repo has no real domain to put here.)
 */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

export const NCR_CITIES = ['Delhi', 'Noida', 'Greater Noida', 'Ghaziabad', 'Gurugram', 'Faridabad'] as const

/** E.164, so it's dialable straight from a Google/Maps result. */
export const BUSINESS_PHONE = '+919205803868'

/**
 * The business facts safe to put in structured data: name, what it does, where it operates, and now a
 * confirmed real phone number. Still no address/social links — nothing in the codebase for those is
 * confirmed real, and marking up a placeholder as schema.org data would be actively misleading in search
 * results rather than merely a visual placeholder. Add them here once real.
 */
export const BUSINESS = {
  name: 'HomeServe',
  url: siteUrl(),
  description: 'HomeServe manages home renovation and home maintenance in Delhi NCR — from planning and quotation through execution, handover and post-handover care — as a single accountable team.',
  areaServed: NCR_CITIES,
  telephone: BUSINESS_PHONE,
}

/** schema.org Organization block, used site-wide so every page's structured data can reference the same @id. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${siteUrl()}/#organization`,
    name: BUSINESS.name,
    url: siteUrl(),
    description: BUSINESS.description,
    telephone: BUSINESS.telephone,
    areaServed: BUSINESS.areaServed.map((city) => ({ '@type': 'City', name: city })),
    image: absoluteUrl('/opengraph-image'),
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

export function serviceJsonLd(opts: { name: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: opts.name,
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    provider: { '@id': `${siteUrl()}/#organization` },
    areaServed: BUSINESS.areaServed.map((city) => ({ '@type': 'City', name: city })),
  }
}

/**
 * Renders a JSON-LD structured-data block.
 *
 * **Server components only** — the JSON is fixed at render time.
 *
 * ⚠️  SECURITY WARNING (FIND-11): This component uses `dangerouslySetInnerHTML`.
 * The `data` argument MUST be constructed exclusively from server-side constants
 * and server-fetched values. NEVER pass any user-controlled string (e.g. a review
 * body, a booking description, a message text, or any field that originates from
 * user input) into this component. Doing so would create a stored XSS vector.
 * If sanitisation is ever needed, use a library such as `sanitize-html` or
 * `DOMPurify` (server-side) before passing the value here.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export const noIndex: Metadata = { robots: { index: false, follow: false } }
