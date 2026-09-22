import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Signed-in portals, the API and transactional auth screens have nothing for a search index —
      // they either 404/redirect for a logged-out crawler or are the same handful of forms repeated
      // per user. Metadata on each of those trees also sets robots:noindex as a second layer.
      disallow: ['/homeowner', '/admin', '/contractor', '/api', '/auth', '/forgot-password'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
