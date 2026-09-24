import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo'
import { getAllServiceSlugs } from '@/lib/services/data'
import { THEMES } from '@/lib/themes/data'
import { getAllBlogPosts } from '@/lib/blog/data'
import { createAdminClient } from '@/lib/supabase/admin'

const NCR_CITY_SLUGS = ['delhi', 'noida', 'greater-noida', 'ghaziabad', 'gurugram', 'faridabad']

// Everything a homeowner can reach without signing in. Anything under /homeowner, /admin, /contractor,
// /api or /auth is excluded here and blocked in robots.ts — it's either behind a login or transactional.
const STATIC_ROUTES = [
  '', '/get-started', '/estimate', '/projects', '/services', '/themes', '/blog', '/how-it-works',
  '/about', '/contact', '/faqs', '/maintenance', '/maintenance/plans', '/login', '/signup',
]

// Low-priority, rarely-changing legal pages — listed separately so they don't skew priority/frequency
// defaults for the pages above.
const LEGAL_ROUTES = ['/privacy', '/privacy/rights', '/terms', '/refund-policy']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === '/get-started' ? 0.9 : 0.7,
  }))
  for (const path of LEGAL_ROUTES) {
    entries.push({ url: `${base}${path}`, changeFrequency: 'yearly', priority: 0.3 })
  }

  for (const slug of getAllServiceSlugs()) {
    entries.push({ url: `${base}/services/${slug}`, changeFrequency: 'monthly', priority: 0.8 })
  }
  for (const city of NCR_CITY_SLUGS) {
    entries.push({ url: `${base}/locations/${city}`, changeFrequency: 'monthly', priority: 0.7 })
  }
  for (const theme of THEMES) {
    entries.push({ url: `${base}/themes/${theme.slug}`, changeFrequency: 'monthly', priority: 0.6 })
  }
  for (const post of getAllBlogPosts()) {
    entries.push({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  // Maintenance service pages come from the live catalogue, not a static list, so an inactive/renamed
  // service never leaves a dead sitemap entry.
  try {
    const { data } = await createAdminClient().from('maintenance_services').select('slug, updated_at').eq('is_active', true)
    for (const row of data ?? []) {
      entries.push({ url: `${base}/maintenance/${row.slug}`, lastModified: row.updated_at ?? undefined, changeFrequency: 'monthly', priority: 0.6 })
    }
  } catch {
    // Sitemap still ships without the catalogue if the DB is briefly unreachable at build time.
  }

  return entries
}
