'use client';
import { useState, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MarketingNav, Footer } from '@/components/shared/Navigation';
import { getThemeBySlug, getSimilarThemes } from '@/lib/themes/data';
import { JsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { isThemeSavedLocally, toggleThemeSave } from '@/lib/themes/device';
import ThemeCarousel from '@/components/themes/ThemeCarousel';
import { SavedThemesDrawer } from '@/components/themes/SavedThemesDrawer';

const TABS = [
  'Overview',
  'Color Palette',
  'Materials & Specs',
  'Room Gallery',
  'Furniture & Lighting',
  'Indicative Pricing',
  'Similar Themes'
];

export default function ThemeDetailClient({ slug }: { slug: string }) {
  const theme = getThemeBySlug(slug);
  if (!theme) { notFound(); }

  const similar = getSimilarThemes(slug);
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeRoom, setActiveRoom] = useState(theme.rooms[0]?.room ?? 'Living Room');
  const [saved, setSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const [navSticky, setNavSticky] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('theme-hero');
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setNavSticky(!entry.isIntersecting), { threshold: 0 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { setSaved(isThemeSavedLocally(slug)); }, [slug]);

  async function handleToggleSave() {
    if (savePending) return;
    setSavePending(true);
    const next = !saved;
    setSaved(next);
    const count = await toggleThemeSave(slug, next);
    if (count == null) {
      setSaved(!next);
    } else {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('hs_saved_updated'));
    }
    setSavePending(false);
  }

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

  const currentRoomData = theme.rooms.find(r => r.room === activeRoom);

  return (
    <div className="min-h-screen bg-paper-50 text-ink-900">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Design themes', path: '/themes' },
        { name: theme.name, path: `/themes/${slug}` }
      ])} />
      <MarketingNav />

      {/* ── HERO SECTION ── */}
      <div id="theme-hero" className="relative min-h-[85vh] lg:min-h-[92vh] flex flex-col justify-end overflow-hidden bg-stone-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme.coverImage}
          alt={theme.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-stone-950/20" />

        <div className="relative z-10 container-wide pb-16 pt-32">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/60 text-xs font-mono mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/themes" className="hover:text-white transition-colors">Design Themes</Link>
            <span>/</span>
            <span className="text-white font-medium">{theme.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-3xl">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {theme.isTrending && <span className="px-3 py-1 text-xs font-mono font-bold bg-cobalt-400 text-ink-900 tracking-wider">TRENDING</span>}
                {theme.isEditorPick && <span className="px-3 py-1 text-xs font-mono font-bold bg-amber-400 text-ink-900 tracking-wider">EDITOR&apos;S PICK</span>}
                {theme.isNew && <span className="px-3 py-1 text-xs font-mono font-bold bg-emerald-400 text-ink-900 tracking-wider">NEW THEME</span>}
                <span className="px-3 py-1 text-xs font-mono uppercase bg-white/20 text-white backdrop-blur-md">{theme.category} Style</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-white tracking-[-0.04em] leading-[0.95] mb-4">
                {theme.name}
              </h1>
              <p className="text-lg sm:text-xl text-stone-200 leading-relaxed font-light max-w-2xl">
                {theme.tagline}
              </p>

              {/* Quick Specs Badges */}
              <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-white/15 text-white/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-stone-400 font-mono uppercase">Est. Budget:</span>
                  <span className="font-semibold text-white">{theme.budget.basic} – {theme.budget.luxury}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/30" />
                <div className="flex items-center gap-2">
                  <span className="text-stone-400 font-mono uppercase">Timeline:</span>
                  <span className="font-semibold text-white">{theme.estimatedTimeline}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/30" />
                <div className="flex items-center gap-2">
                  <span className="text-stone-400 font-mono uppercase">Room Views:</span>
                  <span className="font-semibold text-white">{theme.roomCount || theme.rooms.length || 5} Rooms</span>
                </div>
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-72">
              <Link
                href={`/get-started?theme=${slug}`}
                className="coarse:min-h-12 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold bg-cobalt-500 text-white hover:bg-cobalt-600 shadow-hard transition-all text-center"
              >
                Start Renovation with This Look
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleToggleSave}
                  className={`flex items-center justify-center gap-2 py-3 px-3 text-xs font-semibold border transition-all ${
                    saved
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-md'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'white' : 'none'} stroke="white" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {saved ? 'Saved' : 'Save Theme'}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-3 px-3 text-xs font-semibold border bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-md transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  {copiedLink ? 'Link Copied!' : 'Share'}
                </button>
              </div>

              <Link
                href="/estimate"
                className="text-center text-xs text-stone-300 hover:text-white underline underline-offset-4 py-1"
              >
                Calculate Delhi NCR Estimate →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY NAV BAR ── */}
      <div ref={navRef} className={`sticky top-0 z-30 isolate transition-all ${navSticky ? 'bg-white/95 backdrop-blur-md border-b-2 border-ink-900 shadow-sm' : 'bg-white border-b border-stone-200'}`}>
        <div className="container-wide">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {TABS.map(tab => {
              const tabId = tab.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    const el = document.getElementById(`section-${tabId}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`shrink-0 px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                    activeTab === tab
                      ? 'border-ink-900 text-ink-900'
                      : 'border-transparent text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── OVERVIEW & SPECIFICATIONS ── */}
      <section id="section-overview" className="section bg-white border-b border-stone-200">
        <div className="container-wide">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div>
                <p className="label mb-2">Design Philosophy &amp; Concept</p>
                <h2 className="text-3xl font-display font-bold text-ink-900 tracking-tight mb-4">
                  About the {theme.name} Aesthetic
                </h2>
                <p className="text-stone-700 text-base leading-relaxed">
                  {theme.description}
                </p>
              </div>

              <div className="p-6 bg-paper-100 border-2 border-ink-900/10 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-600">The Design Philosophy</h3>
                <p className="text-stone-800 text-sm leading-relaxed italic">
                  &ldquo;{theme.philosophy}&rdquo;
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500">Historical &amp; Cultural Origins</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  {theme.history}
                </p>
              </div>

              {/* Key characteristics list */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 mb-3">Signature Design Elements</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {theme.keyCharacteristics.map((char, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-cobalt-500 mt-1.5 shrink-0" />
                      <span>{char}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar specs card */}
            <div className="lg:col-span-5 space-y-5">
              <div className="border-2 border-ink-900 bg-paper-50 p-6 shadow-sm space-y-6">
                <div>
                  <p className="text-xs font-mono uppercase text-stone-500 tracking-wider">HomeServe Specifications</p>
                  <h3 className="text-xl font-display font-bold text-ink-900 mt-0.5">Execution Profile</h3>
                </div>

                {/* Property suitability */}
                <div>
                  <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">Ideal Property Types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(theme.suitablePropertyTypes ?? ['Apartment', 'Builder Floor', 'Villa']).map(p => (
                      <span key={p} className="px-2.5 py-1 bg-white border border-stone-300 text-xs font-medium text-stone-800">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Best for */}
                <div>
                  <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">Best Suited For</p>
                  <div className="flex flex-wrap gap-1.5">
                    {theme.bestFor.map(b => (
                      <span key={b} className="px-2.5 py-1 bg-white border border-stone-300 text-xs font-medium text-stone-800">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pros & Considerations */}
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3.5">
                    <p className="text-[11px] font-mono font-bold uppercase text-emerald-800 mb-2">Advantages</p>
                    <ul className="space-y-1.5 text-xs text-emerald-900">
                      {theme.pros.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200 p-3.5">
                    <p className="text-[11px] font-mono font-bold uppercase text-amber-800 mb-2">Considerations</p>
                    <ul className="space-y-1.5 text-xs text-amber-900">
                      {theme.cons.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">–</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Maintenance requirement */}
                <div className="pt-2 border-t border-stone-200">
                  <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">Maintenance &amp; Upkeep</p>
                  <p className="text-xs text-stone-600 leading-relaxed">{theme.maintenance}</p>
                </div>

                {/* CTA Box */}
                <div className="pt-4 border-t-2 border-ink-900/10">
                  <Link
                    href={`/get-started?theme=${slug}`}
                    className="block w-full py-3 bg-ink-900 text-white text-center text-xs font-semibold hover:bg-cobalt-600 transition-colors"
                  >
                    Get a Detailed Quote for This Theme
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COLOR PALETTE STORY ── */}
      <section id="section-color-palette" className="section bg-stone-50 border-b border-stone-200">
        <div className="container-wide">
          <div className="max-w-xl mb-8">
            <p className="label mb-1">Curated Color Story</p>
            <h2 className="text-3xl font-display font-bold text-ink-900 tracking-tight">
              Color Palette &amp; Paint Codes
            </h2>
            <p className="text-stone-600 text-sm mt-1">
              Harmonised color shades paired with genuine Indian paint finishes (Asian Paints, Dulux, Berger) for accurate on-site execution.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {theme.colors.map(color => (
              <div key={color.hex} className="bg-white border-2 border-stone-200 p-4 flex flex-col justify-between group hover:border-ink-900 transition-all">
                <div
                  className="h-28 w-full border border-stone-200 shadow-inner mb-4 transition-transform group-hover:scale-102"
                  style={{ backgroundColor: color.hex }}
                />
                <div>
                  <h4 className="text-sm font-semibold text-stone-900">{color.name}</h4>
                  <p className="text-xs font-mono text-stone-500 mt-0.5">{color.hex}</p>
                  {color.paint && (
                    <p className="text-[11px] text-stone-600 font-medium mt-2 pt-2 border-t border-stone-100 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cobalt-500 shrink-0" />
                      {color.paint}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MATERIALS & FINISHES ── */}
      <section id="section-materials-specs" className="section bg-white border-b border-stone-200">
        <div className="container-wide">
          <div className="max-w-xl mb-8">
            <p className="label mb-1">Authentic Finishes</p>
            <h2 className="text-3xl font-display font-bold text-ink-900 tracking-tight">
              Materials &amp; Craftsmanship
            </h2>
            <p className="text-stone-600 text-sm mt-1">
              Materials specified for Delhi NCR climate durability and premium visual longevity.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {theme.materials.map((mat, i) => (
              <div key={i} className="flex items-start gap-3.5 p-4 bg-stone-50 border-2 border-stone-200 hover:border-ink-900 transition-all">
                <div className="w-8 h-8 rounded-none bg-cobalt-500 text-white flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{mat}</p>
                  <p className="text-xs text-stone-500 mt-0.5">Verified procurement &amp; installation by HomeServe</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROOM INSPIRATION & GALLERY ── */}
      <section id="section-room-gallery" className="section bg-stone-50 border-b border-stone-200">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="label mb-1">Visual Inspiration</p>
              <h2 className="text-3xl font-display font-bold text-ink-900 tracking-tight">
                Room-by-Room Inspiration
              </h2>
              <p className="text-stone-600 text-sm mt-1">
                Explore how the {theme.name} theme looks across living rooms, bedrooms, kitchens, and pooja spaces.
              </p>
            </div>

            {/* Room category selector pills */}
            {theme.rooms.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {theme.rooms.map(r => (
                  <button
                    key={r.room}
                    onClick={() => setActiveRoom(r.room)}
                    className={`shrink-0 px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                      activeRoom === r.room
                        ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
                    }`}
                  >
                    {r.room}
                  </button>
                ))}
              </div>
            )}
          </div>

          {currentRoomData && currentRoomData.images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {currentRoomData.images.map((img, i) => (
                <div key={i} className="group relative aspect-[4/3] overflow-hidden border-2 border-ink-900 bg-stone-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`${theme.name} ${activeRoom} design inspiration ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-white text-xs font-semibold">{theme.name} • {activeRoom} #{i + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {theme.galleryImages.map((img, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden border-2 border-ink-900 bg-stone-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`${theme.name} design inspiration ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FURNITURE & LIGHTING ── */}
      <section id="section-furniture-lighting" className="section bg-white border-b border-stone-200">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* Furniture */}
            <div>
              <p className="label mb-1">Bespoke Furniture</p>
              <h3 className="text-2xl font-display font-bold text-ink-900 tracking-tight mb-4">
                Recommended Furniture Pieces
              </h3>
              <div className="space-y-3">
                {theme.furniture.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 bg-stone-50 border border-stone-200">
                    <div className="w-6 h-6 rounded-full bg-cobalt-100 text-cobalt-700 flex items-center justify-center shrink-0 text-xs font-bold">
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium text-stone-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lighting */}
            <div>
              <p className="label mb-1">Atmosphere &amp; Illumination</p>
              <h3 className="text-2xl font-display font-bold text-ink-900 tracking-tight mb-4">
                Lighting Scheme
              </h3>
              <div className="space-y-3">
                {theme.lighting.map((light, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 bg-amber-50/60 border border-amber-200">
                    <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 text-xs font-bold">
                      ★
                    </div>
                    <p className="text-sm font-medium text-stone-800">{light}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-paper-100 border border-stone-200 text-xs text-stone-600">
                <p className="font-semibold text-stone-800 mb-1">Turnkey Execution Note</p>
                HomeServe custom-fabricates all modular cabinetry, wardrobes, and furniture in state-of-the-art facilities with German hardware (Hettich / Hafele) and handles complete electrical &amp; cove lighting execution.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── INDICATIVE PRICING GUIDE ── */}
      <section id="section-indicative-pricing" className="section bg-stone-50 border-b border-stone-200">
        <div className="container-wide">
          <div className="max-w-2xl mb-8">
            <p className="label mb-1">Transparent Pricing</p>
            <h2 className="text-3xl font-display font-bold text-ink-900 tracking-tight">
              Indicative Delhi NCR Budget Tiers
            </h2>
            <p className="text-stone-600 text-sm mt-1">
              Indicative estimates based on standard 2BHK/3BHK Delhi NCR floor plans. Final pricing is confirmed via transparent line-item quotation during your site survey.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                tier: 'Essential / Basic',
                price: theme.budget.basic,
                scope: 'Modular kitchen + essential wardrobes + paint & false ceiling',
                badge: 'Cost-Effective'
              },
              {
                tier: 'Premium Standard',
                price: theme.budget.premium,
                scope: 'Full woodwork + designer lighting + premium wall finishes + civil tiling',
                badge: 'Most Popular'
              },
              {
                tier: 'Luxury Turnkey',
                price: theme.budget.luxury,
                scope: 'Bespoke joinery + Italian stone / PU finishes + custom pooja & vanities',
                badge: 'High Spec'
              },
              {
                tier: 'Ultra Luxury / Bespoke',
                price: theme.budget.ultraLuxury,
                scope: 'Architectural supervision + imported hardware + book-matched stone + automation',
                badge: 'Bespoke'
              },
            ].map(b => (
              <div key={b.tier} className="bg-white border-2 border-ink-900 p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-stone-100 text-stone-800 border border-stone-300">
                    {b.badge}
                  </span>
                  <h4 className="text-base font-display font-bold text-ink-900 mt-2">{b.tier}</h4>
                  <p className="text-2xl font-display font-extrabold text-cobalt-600 mt-1 mb-3">{b.price}</p>
                  <p className="text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3">{b.scope}</p>
                </div>
                <Link
                  href={`/get-started?theme=${slug}`}
                  className="mt-6 block w-full py-2.5 text-center text-xs font-semibold bg-stone-900 text-white hover:bg-cobalt-600 transition-colors"
                >
                  Estimate for My Home
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIMILAR THEMES ── */}
      {similar.length > 0 && (
        <section id="section-similar-themes" className="section bg-white border-b border-stone-200">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="label mb-1">Recommended Styles</p>
                <h2 className="text-3xl font-display font-bold text-ink-900 tracking-tight">Similar Design Directions</h2>
                <p className="text-stone-600 text-sm mt-1">Homeowners who liked {theme.name} also explored these styles.</p>
              </div>
            </div>
            <ThemeCarousel themes={similar} />
          </div>
        </section>
      )}

      {/* ── STICKY BOTTOM BAR CTA ── */}
      <div className="sticky bottom-0 z-40 isolate bg-stone-950/95 backdrop-blur-md border-t-2 border-ink-900 text-white py-3.5 shadow-2xl">
        <div className="container-wide flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white">{theme.name} Interior Renovation</p>
            <p className="text-xs text-stone-400">Indicative range: {theme.budget.basic} – {theme.budget.luxury} • {theme.estimatedTimeline}</p>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={handleToggleSave}
              className={`px-3 py-2 text-xs font-semibold border transition-all ${
                saved ? 'bg-rose-600 text-white border-rose-600' : 'border-stone-700 text-stone-200 hover:border-white'
              }`}
            >
              {saved ? '♥ Saved' : '♡ Save Theme'}
            </button>

            <Link
              href="/estimate"
              className="inline-flex items-center coarse:min-h-11 px-4 py-2 text-xs font-semibold border border-stone-600 text-stone-200 hover:border-white hover:text-white transition-all hidden md:inline-flex"
            >
              Cost Estimator
            </Link>

            <Link
              href={`/get-started?theme=${slug}`}
              className="coarse:min-h-11 px-5 py-2 text-xs font-semibold bg-cobalt-500 text-white hover:bg-cobalt-600 transition-all shadow-sm"
            >
              Start Your Renovation
            </Link>
          </div>
        </div>
      </div>

      <SavedThemesDrawer />
      <Footer />
    </div>
  );
}
