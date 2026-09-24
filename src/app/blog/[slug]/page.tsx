import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { MarketingNav, Footer } from '@/components/shared/Navigation';
import { JsonLd, breadcrumbJsonLd, siteUrl } from '@/lib/seo';
import { getAllBlogPosts, getBlogPostBySlug, getRelatedBlogPosts } from '@/lib/blog/data';
import { getThemeBySlug } from '@/lib/themes/data';

/**
 * Section body copy is written with markdown-style **bold** spans (see BlogSection's
 * `content` field comment) but there's no markdown renderer in this project — it was being
 * printed as plain text, so readers saw literal asterisks mid-sentence across ~35 spots.
 * This isn't a full markdown parser, just the one construct actually used in the content
 * (line breaks are already preserved by the whitespace-pre-line wrapper this feeds into).
 */
function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const match = part.match(/^\*\*([^*]+)\*\*$/);
    return match ? <strong key={i} className="font-semibold text-ink-900">{match[1]}</strong> : <Fragment key={i}>{part}</Fragment>;
  });
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.seoTitle,
    description: post.metaDescription,
    alternates: {
      canonical: `${siteUrl()}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.seoTitle,
      description: post.metaDescription,
      url: `${siteUrl()}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      images: [
        {
          url: post.heroImage.src,
          alt: post.heroImage.alt,
        },
      ],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedBlogPosts(post.slug, 3);
  const relatedThemes = post.relatedThemeSlugs
    .map(s => getThemeBySlug(s))
    .filter((t): t is import('@/lib/themes/types').Theme => t !== undefined);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    image: post.heroImage.src,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      '@id': `${siteUrl()}/#organization`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl()}/blog/${post.slug}`,
    },
  };

  const faqItems = [
    ...(post.faq ? post.faq.map(f => ({ q: f.q, a: f.a })) : []),
    ...(post.faqs ? post.faqs.map(f => ({ q: f.question, a: f.answer })) : []),
  ];

  const faqJsonLdData = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-paper-50 text-ink-900">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: post.title, path: `/blog/${post.slug}` }
      ])} />
      <JsonLd data={articleJsonLd} />
      {faqJsonLdData && <JsonLd data={faqJsonLdData} />}

      <MarketingNav />

      <main className="pt-24 pb-20">
        <article className="container-site max-w-4xl py-8">

          {/* Breadcrumb & Category */}
          <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-4">
            <Link href="/" className="hover:text-stone-900">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-stone-900">Blog</Link>
            <span>/</span>
            <span className="text-cobalt-600 font-semibold">{post.categoryLabel}</span>
          </div>

          {/* H1 Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-ink-900 tracking-tight leading-[1.08] mb-6">
            {post.title}
          </h1>

          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-stone-200 text-xs font-mono text-stone-600 mb-8">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-stone-900">{post.author.name}</span>
              <span>•</span>
              <time dateTime={post.publishedAt}>Published: {post.publishedAt}</time>
              {post.updatedAt !== post.publishedAt && (
                <>
                  <span>•</span>
                  <span>Updated: {post.updatedAt}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-stone-100 px-2.5 py-1 border border-stone-200">{post.readingTime}</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mb-10 border-2 border-ink-900 overflow-hidden bg-stone-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.heroImage.src}
              alt={post.heroImage.alt}
              className="w-full aspect-[16/9] object-cover"
            />
            {post.heroImage.caption && (
              <p className="p-3 text-xs text-stone-600 bg-white border-t border-stone-200 italic">
                {post.heroImage.caption}
              </p>
            )}
          </div>

          {/* Summary Callout */}
          <div className="p-6 bg-paper-100 border-2 border-ink-900/15 mb-10 text-stone-800 text-base leading-relaxed font-medium">
            <p className="text-xs font-mono uppercase text-stone-500 tracking-wider mb-2">Executive Summary</p>
            {post.summary}
          </div>

          {/* Table of Contents */}
          {post.tableOfContents && post.tableOfContents.length > 0 && (
            <div className="p-6 bg-white border-2 border-stone-200 mb-12">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-ink-900 mb-4">
                In This Guide
              </h3>
              <ul className="space-y-2 text-sm">
                {post.tableOfContents.map((toc, i) => (
                  <li key={i}>
                    <a href={`#${toc.anchor}`} className="text-cobalt-600 hover:underline flex items-center gap-2">
                      <span className="text-stone-400 font-mono text-xs">{i + 1}.</span>
                      {toc.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Content Sections */}
          <div className="space-y-12 text-stone-800 text-base leading-relaxed">
            {post.sections.map((section, idx) => (
              <section key={idx} id={post.tableOfContents?.[idx]?.anchor} className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink-900 tracking-tight pt-4">
                  {section.heading}
                </h2>

                <div className="whitespace-pre-line text-stone-700 leading-relaxed space-y-4">
                  {renderInlineBold(section.content)}
                </div>

                {/* Optional Callout */}
                {section.callout && (
                  <div className={`p-5 my-6 border-l-4 ${
                    section.callout.type === 'cost' ? 'bg-amber-50/80 border-amber-500 text-amber-950' :
                    section.callout.type === 'tip' ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950' :
                    'bg-cobalt-50/80 border-cobalt-500 text-cobalt-950'
                  }`}>
                    <p className="font-bold text-sm mb-1">{section.callout.title}</p>
                    <p className="text-xs sm:text-sm leading-relaxed">{section.callout.text}</p>
                  </div>
                )}

                {/* Optional Table */}
                {section.table && (
                  <div className="my-6 overflow-x-auto border-2 border-ink-900 bg-white">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-stone-900 text-white font-mono uppercase text-[11px]">
                        <tr>
                          {section.table.headers.map((h, i) => (
                            <th key={i} className="p-3.5 border-r border-stone-800 last:border-r-0">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {section.table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-3.5 border-r border-stone-200 last:border-r-0 font-medium">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Optional Pricing Table */}
                {section.pricingTable && (
                  <div className="my-6 overflow-x-auto border-2 border-ink-900 bg-white">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-stone-900 text-white font-mono uppercase text-[11px]">
                        <tr>
                          <th className="p-3.5 border-r border-stone-800">Scope / Item</th>
                          <th className="p-3.5 border-r border-stone-800">Indicative Price Range</th>
                          <th className="p-3.5">Typical Timeline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {section.pricingTable.map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                            <td className="p-3.5 border-r border-stone-200 font-semibold text-stone-900">{row.item}</td>
                            <td className="p-3.5 border-r border-stone-200 font-mono font-bold text-cobalt-700">{row.range}</td>
                            <td className="p-3.5 text-stone-600 font-mono text-xs">{row.timeline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Optional Checklist */}
                {section.checklist && (
                  <div className="p-5 my-6 bg-white border-2 border-stone-200 space-y-2.5">
                    <p className="text-xs font-mono font-bold uppercase text-stone-600 mb-3">Checklist Items</p>
                    {section.checklist.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-stone-800">
                        <span className="w-4 h-4 rounded-none bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional Section Image */}
                {section.image && (
                  <div className="my-6 border-2 border-ink-900 overflow-hidden bg-stone-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={section.image.src}
                      alt={section.image.alt}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    {section.image.caption && (
                      <p className="p-3 text-xs text-stone-600 bg-white border-t border-stone-200 italic">
                        {section.image.caption}
                      </p>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* FAQ Section */}
          {((post.faq && post.faq.length > 0) || (post.faqs && post.faqs.length > 0)) && (
            <div className="mt-16 pt-12 border-t-2 border-ink-900">
              <p className="label mb-1">Frequently Asked Questions</p>
              <h3 className="text-2xl font-display font-bold text-ink-900 mb-6">Common Questions on This Topic</h3>
              <div className="space-y-4">
                {post.faq?.map((item, i) => (
                  <div key={i} className="p-5 bg-white border-2 border-stone-200">
                    <h4 className="text-base font-bold text-ink-900 mb-2">{item.q}</h4>
                    <p className="text-sm text-stone-600 leading-relaxed">{item.a}</p>
                  </div>
                ))}
                {post.faqs?.map((item, i) => (
                  <div key={i} className="p-5 bg-white border-2 border-stone-200">
                    <h4 className="text-base font-bold text-ink-900 mb-2">{item.question}</h4>
                    <p className="text-sm text-stone-600 leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── INTERNAL LINKING & RELATED INSPIRATION ── */}
          {relatedThemes.length > 0 && (
            <div className="mt-16 pt-12 border-t-2 border-ink-900">
              <p className="label mb-1">Matching Design Themes</p>
              <h3 className="text-2xl font-display font-bold text-ink-900 mb-6">Explore Related Design Themes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {relatedThemes.map(theme => (
                  <Link
                    key={theme.slug}
                    href={`/themes/${theme.slug}`}
                    className="group border-2 border-ink-900 bg-white p-4 hover:border-cobalt-600 transition-all shadow-sm"
                  >
                    <p className="text-[11px] font-mono uppercase text-stone-500">{theme.category}</p>
                    <h4 className="text-lg font-display font-bold text-ink-900 group-hover:text-cobalt-600 mt-1">{theme.name}</h4>
                    <p className="text-xs text-stone-500 mt-1">From {theme.budget.basic}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── CONVERSION CTA BOX ── */}
          <div className="mt-16 p-8 bg-stone-900 text-white border-2 border-ink-900 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-mono uppercase text-cobalt-400 font-bold tracking-wider">Start Your Project</span>
              <h3 className="text-2xl font-display font-bold text-white mt-1 mb-2">
                Ready to plan your renovation in Delhi NCR?
              </h3>
              <p className="text-xs sm:text-sm text-stone-300">
                Get itemised transparent pricing, verified materials, and single-point turnkey execution by HomeServe.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/estimate"
                className="px-5 py-3 text-xs font-semibold bg-white text-ink-900 hover:bg-stone-100 transition-all"
              >
                Estimate Cost
              </Link>
              <Link
                href="/get-started"
                className="px-5 py-3 text-xs font-semibold bg-cobalt-500 text-white hover:bg-cobalt-600 transition-all shadow-sm"
              >
                Book Site Consultation
              </Link>
            </div>
          </div>

          {/* ── RELATED ARTICLES ── */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-12 border-t-2 border-stone-200">
              <h3 className="text-xl font-display font-bold text-ink-900 mb-6">More Design &amp; Renovation Guides</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map(rPost => (
                  <Link
                    key={rPost.slug}
                    href={`/blog/${rPost.slug}`}
                    className="group border border-stone-300 bg-white p-5 hover:border-ink-900 transition-all shadow-2xs"
                  >
                    <p className="text-[10px] font-mono uppercase text-cobalt-600 font-semibold">{rPost.categoryLabel}</p>
                    <h4 className="text-base font-display font-bold text-ink-900 group-hover:text-cobalt-600 mt-1 leading-snug">{rPost.title}</h4>
                    <p className="text-xs text-stone-500 mt-2">{rPost.readingTime}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </article>
      </main>

      <Footer />
    </div>
  );
}
