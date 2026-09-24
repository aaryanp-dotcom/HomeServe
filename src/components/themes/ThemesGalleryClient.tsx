'use client';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MarketingNav, Footer } from '@/components/shared/Navigation';
import { JsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { THEMES, COLLECTIONS, searchThemes, getThemesByCollection, getColorFilterOptions } from '@/lib/themes/data';
import { ColorFamily } from '@/lib/themes/types';
import ThemeCard from '@/components/themes/ThemeCard';
import ThemeCarousel from '@/components/themes/ThemeCarousel';
import { SavedThemesDrawer } from '@/components/themes/SavedThemesDrawer';

const STYLE_PILLS = [
  { id: 'all', label: 'All Styles' },
  { id: 'indian', label: 'Indian Themes' },
  { id: 'trending', label: 'Trending' },
  { id: 'luxury-collection', label: 'Luxury' },
  { id: 'minimal', label: 'Minimal & Zen' },
  { id: 'nordic', label: 'Scandinavian' },
  { id: 'contemporary', label: 'Contemporary' },
  { id: 'compact-apartments', label: 'Compact 2BHK/3BHK' },
  { id: 'villas', label: 'Villas & Bungalows' },
  { id: 'family-homes', label: 'Family Friendly' },
  { id: 'eco-friendly', label: 'Eco & Earthy' },
];

const ROOM_PILLS = [
  { id: 'all', label: 'All Rooms' },
  { id: 'Living Room', label: 'Living Room' },
  { id: 'Bedroom', label: 'Bedroom' },
  { id: 'Kitchen', label: 'Modular Kitchen' },
  { id: 'Dining', label: 'Dining' },
  { id: 'Bathroom', label: 'Bathroom' },
  { id: 'Pooja Room', label: 'Pooja Room' },
  { id: 'Home Office', label: 'Home Office' },
  { id: 'Balcony', label: 'Balcony' },
];

const PROPERTY_PILLS = [
  { id: 'all', label: 'All Properties' },
  { id: 'Apartment', label: 'Apartment' },
  { id: 'Builder Floor', label: 'Builder Floor' },
  { id: 'Independent House', label: 'Independent House' },
  { id: 'Villa', label: 'Villa' },
  { id: 'Penthouse', label: 'Penthouse' },
];

const PAGE_SIZE = 12;
// sessionStorage key for scroll restoration on this page
const SCROLL_KEY = 'hs_themes_scroll';

export default function ThemesGalleryClient({ saveCounts = {} }: { saveCounts?: Record<string, number> }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Read initial state from URL params ─────────────────────────────────────
  const initialQuery    = searchParams.get('q')        ?? '';
  const initialStyle    = searchParams.get('style')    ?? 'all';
  const initialColor    = (searchParams.get('color')   ?? 'all') as ColorFamily | 'all';
  const initialRoom     = searchParams.get('room')     ?? 'all';
  const initialProperty = searchParams.get('property') ?? 'all';
  // visibleCount: how many cards the user had loaded (so "Load more" position is restored)
  const initialPage     = Math.max(PAGE_SIZE, parseInt(searchParams.get('page') ?? String(PAGE_SIZE), 10));

  const [query,          setQueryState]    = useState(initialQuery);
  const [suggestions,    setSuggestions]   = useState<string[]>([]);
  const [showSuggestions,setShowSuggestions] = useState(false);
  const [activeStyle,    setActiveStyleState]    = useState(initialStyle);
  const [activeColor,    setActiveColorState]    = useState<ColorFamily | 'all'>(initialColor);
  const [activeRoom,     setActiveRoomState]     = useState(initialRoom);
  const [activeProperty, setActivePropertyState] = useState(initialProperty);
  const [visibleCount,   setVisibleCountState]   = useState(initialPage);
  const [showAllCollections, setShowAllCollections] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const colorOptions = useMemo(() => getColorFilterOptions(), []);

  // ── Write state back to URL (replaces current history entry, no new entry) ─
  const updateUrl = useCallback((updates: {
    q?: string;
    style?: string;
    color?: string;
    room?: string;
    property?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    const q        = 'q'        in updates ? updates.q!        : query;
    const style    = 'style'    in updates ? updates.style!    : activeStyle;
    const color    = 'color'    in updates ? updates.color!    : activeColor;
    const room     = 'room'     in updates ? updates.room!     : activeRoom;
    const property = 'property' in updates ? updates.property! : activeProperty;
    const page     = 'page'     in updates ? updates.page!     : visibleCount;

    if (q)                       params.set('q',        q);
    if (style    !== 'all')      params.set('style',    style);
    if (color    !== 'all')      params.set('color',    color as string);
    if (room     !== 'all')      params.set('room',     room);
    if (property !== 'all')      params.set('property', property);
    if (page     > PAGE_SIZE)    params.set('page',     String(page));

    const qs = params.toString();
    router.replace(qs ? `/themes?${qs}` : '/themes', { scroll: false });
  }, [router, query, activeStyle, activeColor, activeRoom, activeProperty, visibleCount]);

  // Setters that also sync URL
  const setActiveStyle = (val: string) => {
    setActiveStyleState(val);
    updateUrl({ style: val, page: PAGE_SIZE });
    setVisibleCountState(PAGE_SIZE);
  };
  const setActiveColor = (val: ColorFamily | 'all') => {
    setActiveColorState(val);
    updateUrl({ color: val as string, page: PAGE_SIZE });
    setVisibleCountState(PAGE_SIZE);
  };
  const setActiveRoom = (val: string) => {
    setActiveRoomState(val);
    updateUrl({ room: val, page: PAGE_SIZE });
    setVisibleCountState(PAGE_SIZE);
  };
  const setActiveProperty = (val: string) => {
    setActivePropertyState(val);
    updateUrl({ property: val, page: PAGE_SIZE });
    setVisibleCountState(PAGE_SIZE);
  };
  const loadMore = () => {
    const next = visibleCount + PAGE_SIZE;
    setVisibleCountState(next);
    updateUrl({ page: next });
  };

  // ── Scroll position restoration ─────────────────────────────────────────────
  // On mount: if we have a stored scroll position (user is returning from a detail page), restore it.
  // On unmount: save current scroll position so we can restore it if the user comes back.
  useEffect(() => {
    const stored = sessionStorage.getItem(SCROLL_KEY);
    if (stored) {
      const y = parseInt(stored, 10);
      // Use requestAnimationFrame to ensure the page has fully rendered before scrolling
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: 'instant' });
      });
      sessionStorage.removeItem(SCROLL_KEY);
    }

    const saveScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    };

    // Capture scroll position whenever a theme card link is about to be followed.
    // We attach to the main container's click events; ThemeCard links bubble up.
    const container = document.getElementById('themes-gallery-root');
    if (container) {
      container.addEventListener('click', saveScroll, { capture: true });
      return () => container.removeEventListener('click', saveScroll, { capture: true });
    }
  }, []);

  // ── Filtered results ────────────────────────────────────────────────────────
  const filteredThemes = useMemo(() => {
    let base = query.trim() ? searchThemes(query) : THEMES;

    if (activeStyle !== 'all') {
      base = base.filter(t =>
        t.collections.includes(activeStyle) ||
        t.tags.includes(activeStyle.toLowerCase()) ||
        t.category.toLowerCase().includes(activeStyle.toLowerCase())
      );
    }

    if (activeColor !== 'all') {
      base = base.filter(t =>
        t.colorFamilies && t.colorFamilies.includes(activeColor as ColorFamily)
      );
    }

    if (activeRoom !== 'all') {
      base = base.filter(t =>
        (t.roomCategories && t.roomCategories.some(r => r.toLowerCase() === activeRoom.toLowerCase())) ||
        t.rooms.some(r => r.room.toLowerCase() === activeRoom.toLowerCase())
      );
    }

    if (activeProperty !== 'all') {
      base = base.filter(t =>
        t.suitablePropertyTypes && t.suitablePropertyTypes.some(p => p.toLowerCase() === activeProperty.toLowerCase())
      );
    }

    return base;
  }, [query, activeStyle, activeColor, activeRoom, activeProperty]);

  const visibleThemes = filteredThemes.slice(0, visibleCount);
  const hasMore = visibleCount < filteredThemes.length;
  const isFiltering = activeStyle !== 'all' || activeColor !== 'all' || activeRoom !== 'all' || activeProperty !== 'all' || Boolean(query);

  const handleSearchChange = (val: string) => {
    setQueryState(val);
    updateUrl({ q: val });
    if (val.trim().length > 1) {
      const s = searchThemes(val).slice(0, 6).map(t => t.name);
      setSuggestions(s);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const clearAllFilters = () => {
    setQueryState('');
    setActiveStyleState('all');
    setActiveColorState('all');
    setActiveRoomState('all');
    setActivePropertyState('all');
    setVisibleCountState(PAGE_SIZE);
    router.replace('/themes', { scroll: false });
  };

  const displayedCollections = showAllCollections ? COLLECTIONS : COLLECTIONS.slice(0, 6);

  return (
    <div id="themes-gallery-root" className="min-h-screen bg-paper-50 text-ink-900">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Design themes', path: '/themes' }])} />
      <MarketingNav />
      <main>

      {/* ── HERO ── */}
      <div className="relative min-h-[60vh] flex flex-col justify-center overflow-hidden bg-stone-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=1800&q=85"
          alt="HomeServe Interior Design Inspiration Delhi NCR"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/50 to-stone-950/90" />

        <div className="relative z-10 container-site py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-white/20 bg-white/10 text-white text-xs font-mono font-medium mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            43 Curated Design Themes &amp; Color Palettes
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[4rem] font-bold text-white tracking-[-0.03em] leading-[1.02] mb-4">
            Curated Design Themes<br />
            <span className="text-stone-300 font-normal">for Modern Indian Homes</span>
          </h1>
          <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed mb-8">
            Explore turnkey interior themes crafted for Delhi NCR homes — complete with colour swatches, indicative budgets, room views, and bespoke execution by HomeServe.
          </p>

          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white shadow-2xl border-2 border-stone-800">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#57534E" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by theme, color (e.g. Terracotta), room, or material..."
                value={query}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => query && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                aria-label="Search design themes"
                className="flex-1 min-w-0 text-base text-stone-900 placeholder:text-stone-400 outline-none bg-transparent"
              />
              {query && (
                <button onClick={() => { setQueryState(''); setSuggestions([]); updateUrl({ q: '' }); }} className="text-stone-400 hover:text-stone-700">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>

            {/* Suggestions drop */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-2xl border-2 border-ink-900 overflow-hidden z-50 text-left">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onMouseDown={() => { setQueryState(s); updateUrl({ q: s }); setShowSuggestions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-stone-800 hover:bg-stone-100 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick searches */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-5">
            <span className="text-xs text-stone-400 font-mono uppercase tracking-wider mr-1">Popular:</span>
            {['Modern Indian Luxury', 'Warm Indian Earth', 'Japandi', 'Scandinavian', 'Minimal Indian', 'Terracotta'].map(s => (
              <button
                key={s}
                onClick={() => handleSearchChange(s)}
                className="px-3 py-1 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MULTI-DIMENSIONAL FILTER CONTROLS ── */}
      <div className="sticky top-0 z-30 isolate bg-white/95 backdrop-blur-md border-b-2 border-ink-900 shadow-sm">
        <div className="container-wide py-4 space-y-3">

          {/* Dimension 1: Color Families */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500">
                Filter by Color
              </span>
              {activeColor !== 'all' && (
                <button onClick={() => setActiveColor('all')} className="text-xs font-medium text-cobalt-600 hover:underline">
                  Reset color
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setActiveColor('all')}
                className={`shrink-0 px-3 py-1.5 text-xs font-semibold border transition-all ${
                  activeColor === 'all'
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                }`}
              >
                All Colors
              </button>
              {colorOptions.map(c => {
                const isSelected = activeColor === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveColor(isSelected ? 'all' : c.id)}
                    className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border transition-all ${
                      isSelected
                        ? 'border-ink-900 bg-stone-900 text-white ring-2 ring-ink-900'
                        : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.label}</span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                      ({c.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension 2: Style & Room Filter Pills */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-stone-100">
            {/* Style Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider shrink-0 mr-1">Style:</span>
              {STYLE_PILLS.map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setActiveStyle(pill.id)}
                  className={`shrink-0 px-3 py-1 text-xs font-medium transition-all ${
                    activeStyle === pill.id
                      ? 'bg-cobalt-500 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Room dropdown / toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={activeRoom}
                onChange={e => setActiveRoom(e.target.value)}
                className="px-2.5 py-1 text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200 outline-none cursor-pointer"
                aria-label="Filter by Room"
              >
                {ROOM_PILLS.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>

              <select
                value={activeProperty}
                onChange={e => setActiveProperty(e.target.value)}
                className="px-2.5 py-1 text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200 outline-none cursor-pointer"
                aria-label="Filter by Property Type"
              >
                {PROPERTY_PILLS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>

              {isFiltering && (
                <button
                  onClick={clearAllFilters}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* ── CURATED COLLECTIONS (Only shown when not actively filtering) ── */}
      {!isFiltering && (
        <section className="section bg-stone-50 border-b border-stone-200">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="label mb-1.5">Editorial Selection</p>
                <h2 className="text-3xl font-display font-bold text-ink-900 tracking-tight">Curated Design Collections</h2>
                <p className="text-stone-600 mt-1 max-w-xl text-sm">Distinct aesthetic philosophies tailored for modern apartments, builder floors, and luxury villas across Delhi NCR.</p>
              </div>
            </div>
            <div className="space-y-12">
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
                  className="px-6 py-2.5 border-2 border-ink-900 text-sm font-semibold text-ink-900 hover:bg-ink-900 hover:text-white transition-all"
                >
                  Explore More Collections
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── ALL THEMES GRID ── */}
      <section className="section bg-white">
        <div className="container-wide">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="label mb-1">Design Catalogue</p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink-900 tracking-tight">
                {query
                  ? `Results for "${query}"`
                  : activeColor !== 'all'
                  ? `${activeColor.charAt(0).toUpperCase() + activeColor.slice(1)} Color Palette Themes`
                  : activeStyle !== 'all'
                  ? `${STYLE_PILLS.find(p => p.id === activeStyle)?.label ?? 'Themes'}`
                  : 'All Curated Themes'}
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                Showing {visibleThemes.length} of {filteredThemes.length} design options
              </p>
            </div>

            {isFiltering && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-cobalt-600 hover:underline self-start sm:self-auto"
              >
                Reset all filters ({filteredThemes.length} themes available)
              </button>
            )}
          </div>

          {filteredThemes.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-stone-200 p-8 max-w-md mx-auto my-6">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </div>
              <p className="text-ink-900 font-semibold text-base">No themes match your active filters</p>
              <p className="text-stone-500 text-xs mt-1.5">Try clearing some filters or searching for styles like &ldquo;Contemporary Indian&rdquo; or &ldquo;Modern&rdquo;.</p>
              <button
                onClick={clearAllFilters}
                className="mt-5 px-4 py-2 bg-ink-900 text-white text-xs font-semibold hover:bg-stone-800 transition-all"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleThemes.map(theme => (
                  <ThemeCard key={theme.slug} theme={theme} size="md" saveCount={saveCounts[theme.slug] ?? 0} />
                ))}
              </div>
              {hasMore && (
                <div className="text-center mt-12">
                  <button
                    onClick={loadMore}
                    className="px-8 py-3.5 bg-ink-900 text-white text-sm font-semibold hover:bg-cobalt-600 transition-all"
                  >
                    Load More Themes ({filteredThemes.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── STICKY CTA ── */}
      <div className="sticky bottom-0 z-40 isolate bg-stone-950/95 backdrop-blur-md border-t-2 border-ink-900 text-white">
        <div className="container-site py-3.5 flex items-center justify-between gap-4">
          <div>
            <p className="text-white text-sm font-semibold hidden md:block">
              Found a theme you love? Bring it to life with HomeServe.
            </p>
            <p className="text-stone-400 text-xs hidden md:block">
              Fixed-price quotation, verified materials &amp; milestone-based turnkey delivery across Delhi NCR.
            </p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Link
              href="/estimate"
              className="inline-flex items-center coarse:min-h-11 px-4 py-2 text-xs font-semibold text-stone-200 border border-stone-700 hover:border-white hover:text-white transition-all"
            >
              Cost Calculator
            </Link>
            <Link
              href="/get-started"
              className="coarse:min-h-11 px-4 py-2 text-xs font-semibold bg-cobalt-500 text-white hover:bg-cobalt-600 transition-all shadow-sm"
            >
              Start Your Renovation
            </Link>
          </div>
        </div>
      </div>

      </main>
      <SavedThemesDrawer />
      <Footer />
    </div>
  );
}
