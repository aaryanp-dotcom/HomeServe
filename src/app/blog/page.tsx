import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingNav, Footer } from '@/components/shared/Navigation';
import { JsonLd, breadcrumbJsonLd, siteUrl } from '@/lib/seo';
import { BLOG_CATEGORIES, getAllBlogPosts } from '@/lib/blog/data';

export const metadata: Metadata = {
  title: 'Home Renovation Guides & Interior Cost Insights Delhi NCR | HomeServe Blog',
  description: 'Expert guides on home renovation costs, interior design ideas, modular kitchen budgeting, and apartment renovation checklists across Delhi, Noida & Gurgaon.',
  alternates: {
    canonical: `${siteUrl()}/blog`,
  },
  openGraph: {
    title: 'Home Renovation & Interior Guides for Delhi NCR | HomeServe',
    description: 'Explore real cost breakdowns, design inspirations, and renovation checklists for Delhi NCR homeowners.',
    url: `${siteUrl()}/blog`,
    type: 'website',
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  const blogListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'HomeServe Home Renovation & Design Guides',
    description: 'Comprehensive guides, cost breakdowns, and inspiration for home renovation in Delhi NCR.',
    url: `${siteUrl()}/blog`,
    hasPart: posts.map((post) => ({
      '@type': 'Article',
      headline: post.title,
      description: post.metaDescription,
      url: `${siteUrl()}/blog/${post.slug}`,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: {
        '@type': 'Person',
        name: post.author.name,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-paper-50 text-ink-900">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Blog & Design Guides', path: '/blog' }
      ])} />
      <JsonLd data={blogListJsonLd} />
      <MarketingNav />

      <main className="pt-24 pb-20">
        {/* ── HEADER ── */}
        <section className="container-wide py-12 border-b-2 border-ink-900">
          <div className="max-w-3xl">
            <span className="label mb-2">Editorial &amp; Guides</span>
            <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-ink-900 tracking-tight leading-[1.05] mb-4">
              Home Renovation &amp; Design Guides for Delhi NCR
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed">
              Transparent cost breakdowns, interior design inspiration, material comparisons, and step-by-step checklists written specifically for homeowners in Delhi, Noida, Gurgaon, and Ghaziabad.
            </p>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-stone-200">
            {BLOG_CATEGORIES.map(cat => (
              <span
                key={cat.id}
                className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-stone-300 text-stone-800 shadow-2xs"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </section>

        {/* ── ARTICLES GRID ── */}
        <section className="container-wide py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <article
                key={post.slug}
                className="group flex flex-col bg-white border-2 border-ink-900 shadow-sm hover:shadow-hard transition-all duration-300"
              >
                {/* Hero Thumbnail */}
                <Link href={`/blog/${post.slug}`} className="relative aspect-[16/9] overflow-hidden bg-stone-900 border-b-2 border-ink-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.heroImage.src}
                    alt={post.heroImage.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 border border-ink-900 px-2.5 py-1 text-[11px] font-mono font-bold uppercase text-ink-900">
                    {post.categoryLabel}
                  </div>
                </Link>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-2">
                      <time dateTime={post.publishedAt}>{post.publishedAt}</time>
                      <span>•</span>
                      <span>{post.readingTime}</span>
                    </div>

                    <h2 className="text-xl font-display font-bold text-ink-900 leading-snug group-hover:text-cobalt-600 transition-colors mb-3">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>

                    <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed mb-4">
                      {post.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">By {post.author.name}</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cobalt-600 group-hover:underline"
                    >
                      Read Guide →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── CALL TO ACTION ── */}
        <section className="container-wide mt-12">
          <div className="bg-stone-900 border-2 border-ink-900 text-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl">
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
                Need an Accurate Estimate for Your Delhi NCR Home?
              </h3>
              <p className="text-sm text-stone-300 leading-relaxed">
                Use our interactive cost calculator or book a free consultation with our technical quantity surveying team.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/estimate"
                className="px-5 py-3 text-xs font-semibold bg-white text-ink-900 hover:bg-stone-100 transition-all"
              >
                Launch Cost Estimator
              </Link>
              <Link
                href="/get-started"
                className="px-5 py-3 text-xs font-semibold bg-cobalt-500 text-white hover:bg-cobalt-600 transition-all"
              >
                Book Free Consultation
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
