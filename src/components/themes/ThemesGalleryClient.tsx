'use client';
import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { MarketingNav, Footer } from '@/components/shared/Navigation';
import { JsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { THEMES, COLLECTIONS, searchThemes, getThemesByCollection } from '@/lib/themes/data';
import ThemeCard from '@/components/themes/ThemeCard';
import ThemeCarousel from '@/components/themes/ThemeCarousel';

const FILTER_PILLS = [
  { id: 'all', label: 'All Themes' },
  { id: 'trending', label: 'Trending' },
  { id: 'luxury-collection', label: 'Luxury' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'budget-friendly', label: 'Budget Friendly' },
  { id: 'family-homes', label: 'Family' },
  { id: 'eco-friendly', label: 'Eco-Friendly' },
  { id: 'nordic', label: 'Scandinavian' },
  { id: 'indian', label: 'Indian' },
  { id: 'contemporary', label: 'Contemporary' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'bohemian', label: 'Bohemian' },
];

const PAGE_SIZE = 12;

export default function ThemesGalleryClient({ saveCounts = {} }: { saveCounts?: Record<string, number> }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showAllCollections, setShowAllCollections] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredThemes = useMemo(() => {
    let base = query.trim() ? searchThemes(query) : THEMES;
    if (activeFilter !== 'all') {
      base = base.filter(t =>
        t.collections.includes(activeFilter) ||
        t.tags.includes(activeFilter.toLowerCase()) ||
        t.category.toLowerCase().includes(activeFilter.toLowerCase())
      );
    }
    return base;
  }, [query, activeFilter]);

  const visibleThemes = filteredThemes.slice(0, visibleCount);
  const hasMore = visibleCount < filteredThemes.length;

  const handleSearchChange = (val: string) => {
    setQuery(val);
    if (val.trim().length > 1) {
      const s = searchThemes(val).slice(0, 6).map(t => t.name);
      setSuggestions(s);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const displayedCollections = showAllCollections ? COLLECTIONS : COLLECTIONS.slice(0, 6);

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Design themes', path: '/themes' }])} />
      <MarketingNav />
      <main>

      {/* ── HERO ── */}
      <div className="relative min-h-[70vh] flex flex-col justify-center overflow-hidden bg-stone-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1682662046457-74fd5b199b92?w=1800&q=85"
          alt="Design Themes"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-950/40 to-stone-950/80" />

        <div className="relative z-10 container-site py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/15 bg-white/8 text-white/70 text-xs font-medium mb-6 backdrop-blur-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            38 curated design styles
          </div>
          <h1 className="font-display text-5xl lg:text-[4.5rem] font-bold text-white tracking-[-0.03em] leading-[0.92] animate-fade-up mb-5">
            Discover Your<br />
            <span className="text-stone-400">Design Identity</span>
          </h1>
          <p className="text-lg text-stone-300 max-w-xl mx-auto leading-relaxed mb-10">
            From Japandi serenity to Moroccan richness — explore premium design themes
            with mood boards, budgets, and expert room inspiration.
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white shadow-2xl">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by style, room, colour, or material..."
                value={query}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => query && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                aria-label="Search design themes" className="flex-1 min-w-0 text-base [@media(pointer:fine)]:text-sm text-stone-800 placeholder:text-stone-400 outline-none bg-transparent"
              />
              {query && (
                <button onClick={() => { setQuery(''); setSuggestions([]); }} className="text-stone-400 hover:text-stone-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-xl border border-stone-100 overflow-hidden z-50">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onMouseDown={() => { setQuery(s); setShowSuggestions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 text-left transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick searches */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {['Scandinavian','Japandi','White Kitchen','Wooden Interiors','Luxury'].map(s => (
              <button
                key={s}
                onClick={() => handleSearchChange(s)}
                className="px-3.5 py-1.5 text-xs font-medium text-white/65 border border-white/20 hover:border-white/40 hover:text-white backdrop-blur-sm transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="sticky top-0 z-30 isolate bg-white/90 backdrop-blur-md border-b border-stone-100 shadow-xs">
        <div className="container-wide">
          <div className="flex items-center gap-2 py-3.5 overflow-x-auto no-scrollbar">
            {FILTER_PILLS.map(pill => (
              <button
                key={pill.id}
                onClick={() => { setActiveFilter(pill.id); setVisibleCount(PAGE_SIZE); }}
                className={`shrink-0 px-4 py-1.5 text-sm font-medium transition-all ${
                  activeFilter === pill.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CURATED COLLECTIONS ── */}
      {!query && activeFilter === 'all' && (
        <section className="section bg-stone-50">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="label mb-2">Curated for you</p>
                <h2 className="text-3xl font-semibold text-stone-900 tracking-tight">Design Collections</h2>
                <p className="text-stone-500 mt-1.5 max-w-md">Themes grouped by lifestyle, budget, and vision</p>
              </div>
            </div>
            <div className="space-y-14">
              {displayedCollections.map(col => {
                const themes = getThemesByCollection(col.id);
                if (!themes.length) return null;
                return (
                  <ThemeCarousel
                    key={col.id}
                    themes={themes}
                    title={col.name}
                    description={col.description}
                    saveCounts={saveCounts}
                  />
                );
              })}
            </div>
            {!showAllCollections && (
              <div className="text-center mt-10">
                <button
                  onClick={() => setShowAllCollections(true)}
                  className="px-6 py-3 border border-stone-300 text-sm font-medium text-stone-700 hover:border-stone-500 hover:text-stone-900 transition-all"
                >
                  Load more collections
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── ALL THEMES GRID ── */}
      <section className="section bg-white">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="label mb-2">Browse all</p>
              <h2 className="text-3xl font-semibold text-stone-900 tracking-tight">
                {query ? `Results for "${query}"` : activeFilter !== 'all' ? FILTER_PILLS.find(p => p.id === activeFilter)?.label : 'All Themes'}
              </h2>
              <p className="text-stone-500 mt-1">{filteredThemes.length} themes</p>
            </div>
          </div>

          {filteredThemes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-stone-500 text-lg">No themes found for &ldquo;{query}&rdquo;</p>
              <button onClick={() => { setQuery(''); setActiveFilter('all'); }} className="mt-4 text-cobalt-500 text-sm font-medium hover:underline">Clear search</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleThemes.map(theme => (
                  <ThemeCard key={theme.slug} theme={theme} size="md" saveCount={saveCounts[theme.slug] ?? 0} />
                ))}
              </div>
              {hasMore && (
                <div className="text-center mt-10">
                  <button
                    onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                    className="px-8 py-3.5 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-all"
                  >
                    Load more themes
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── STICKY CTA ── */}
      <div className="sticky bottom-0 z-40 isolate bg-stone-900/95 backdrop-blur-md border-t border-stone-800">
        <div className="container-site py-3 flex items-center justify-between gap-4">
          <p className="text-white text-sm hidden md:block">
            Ready to transform your home?
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <Link href="/signup" className="inline-flex items-center coarse:min-h-11 px-4 py-2 text-xs font-semibold text-stone-300 border border-stone-700 hover:border-stone-500 hover:text-white transition-all">
              Get Quote
            </Link>
            <Link href="/signup" className="coarse:min-h-11 px-4 py-2 text-xs font-semibold bg-ink-900 text-white hover:bg-cobalt-600 transition-all">
              Book Free Consultation
            </Link>
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
