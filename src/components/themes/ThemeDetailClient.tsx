'use client';
import { useState, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MarketingNav, Footer } from '@/components/shared/Navigation';
import { getThemeBySlug, getSimilarThemes } from '@/lib/themes/data';
import { JsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { isThemeSavedLocally, toggleThemeSave } from '@/lib/themes/device';
import ThemeCarousel from '@/components/themes/ThemeCarousel';

const TABS = ['Overview','Colors','Materials','Furniture','Room Inspiration','Budget','Similar'];

export default function ThemeDetailClient({ slug }: { slug: string }) {
  const theme = getThemeBySlug(slug);
  if (!theme) { notFound(); }

  const similar = getSimilarThemes(slug);
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeRoom, setActiveRoom] = useState(theme.rooms[0]?.room ?? '');
  const [saved, setSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);
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
    if (count == null) setSaved(!next); // request failed — undo the optimistic flip
    setSavePending(false);
  }

  const currentRoomData = theme.rooms.find(r => r.room === activeRoom);

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Design themes', path: '/themes' }, { name: theme.name, path: `/themes/${slug}` }])} />
      <MarketingNav />

      {/* ── HERO ── */}
      <div id="theme-hero" className="relative h-[100vh] flex flex-col justify-end overflow-hidden bg-stone-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme.coverImage}
          alt={theme.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-stone-950/10" />

        <div className="relative z-10 container-site pb-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/50 text-xs mb-6">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/themes" className="hover:text-white/80 transition-colors">Design Themes</Link>
            <span>/</span>
            <span className="text-white/80">{theme.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl">
              {/* Badges */}
              <div className="flex gap-2 mb-4">
                {theme.isTrending && <span className="px-2.5 py-1 text-xs font-semibold bg-cobalt-500 text-white">TRENDING</span>}
                {theme.isEditorPick && <span className="px-2.5 py-1 text-xs font-semibold bg-amber-500 text-white">EDITOR&apos;S PICK</span>}
                {theme.isNew && <span className="px-2.5 py-1 text-xs font-semibold bg-sage-500 text-white">NEW</span>}
              </div>
              <p className="text-white/50 text-sm tracking-wider uppercase mb-2">{theme.category}</p>
              <h1 className="text-5xl lg:text-7xl font-semibold text-white tracking-tighter leading-[0.9] mb-4">{theme.name}</h1>
              <p className="text-xl text-white/70 leading-relaxed">{theme.tagline}</p>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-col gap-3 lg:w-64">
              <button
                onClick={handleToggleSave}
                className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all ${saved ? 'bg-rose-500 text-white' : 'bg-white/10 text-white border border-white/20 hover:bg-white/15 backdrop-blur-sm'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'white' : 'none'} stroke="white" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {saved ? 'Saved' : 'Save Inspiration'}
              </button>
              <Link href={`/get-started?theme=${slug}`} className="coarse:min-h-11 flex items-center justify-center gap-2 py-3 text-sm font-semibold bg-ink-900 text-white hover:bg-cobalt-600 transition-all">
                I Like This Design
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY NAV ── */}
      <div ref={navRef} className={`sticky top-0 z-30 isolate transition-all ${navSticky ? 'bg-white/95 backdrop-blur-md border-b border-stone-100' : 'bg-white border-b border-stone-100'}`}>
        <div className="container-wide">
          <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  const el = document.getElementById(`section-${tab.toLowerCase().replace(/\s+/g, '-')}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`shrink-0 px-5 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === tab ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── OVERVIEW ── */}
      <section id="section-overview" className="section bg-white">
        <div className="container-site">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="label mb-3">Design Philosophy</p>
              <h2 className="text-3xl font-semibold text-stone-900 tracking-tight mb-5">{theme.name}</h2>
              <p className="text-stone-600 leading-relaxed mb-6">{theme.description}</p>
              <p className="text-stone-600 leading-relaxed mb-6">{theme.philosophy}</p>
              <p className="text-stone-500 text-sm leading-relaxed">{theme.history}</p>
            </div>
            <div>
              {/* Key Characteristics */}
              <div className="bg-stone-50 p-6 mb-5">
                <h3 className="text-sm font-semibold text-stone-800 tracking-wide uppercase mb-4">Key Characteristics</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {theme.keyCharacteristics.map(c => (
                    <div key={c} className="flex items-center gap-2 text-sm text-stone-700">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d5af1" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* Best For */}
              <div className="bg-stone-50 p-6 mb-5">
                <h3 className="text-sm font-semibold text-stone-800 tracking-wide uppercase mb-4">Best Suited For</h3>
                <div className="flex flex-wrap gap-2">
                  {theme.bestFor.map(b => (
                    <span key={b} className="px-3 py-1 bg-white border border-stone-200 text-xs text-stone-700 font-medium">{b}</span>
                  ))}
                </div>
              </div>

              {/* Pros / Cons */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-sage-50 p-4">
                  <p className="text-xs font-semibold text-sage-700 uppercase tracking-wider mb-3">Pros</p>
                  <ul className="space-y-1.5">
                    {theme.pros.map(p => <li key={p} className="text-xs text-sage-800 flex items-start gap-1.5"><span className="mt-0.5 shrink-0">✓</span>{p}</li>)}
                  </ul>
                </div>
                <div className="bg-rose-50 p-4">
                  <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider mb-3">Consider</p>
                  <ul className="space-y-1.5">
                    {theme.cons.map(c => <li key={c} className="text-xs text-rose-800 flex items-start gap-1.5"><span className="mt-0.5 shrink-0">–</span>{c}</li>)}
                  </ul>
                </div>
              </div>

              {/* Timeline + Maintenance */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-stone-50 p-4">
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Timeline</p>
                  <p className="text-sm font-semibold text-stone-800">{theme.estimatedTimeline}</p>
                </div>
                <div className="bg-stone-50 p-4">
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Maintenance</p>
                  <p className="text-xs text-stone-700 leading-relaxed">{theme.maintenance}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COLOR PALETTE ── */}
      <section id="section-colors" className="section-sm bg-stone-50">
        <div className="container-site">
          <p className="label mb-2">Colour Story</p>
          <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-8">Palette</h2>
          <div className="flex flex-wrap gap-6">
            {theme.colors.map(color => (
              <div key={color.hex} className="flex flex-col items-center gap-3 group">
                <div
                  className="h-16 w-16 rounded-full ring-4 ring-white transition-transform group-hover:scale-110"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="text-center">
                  <p className="text-sm font-semibold text-stone-800">{color.name}</p>
                  <p className="text-xs text-stone-500 font-mono">{color.hex}</p>
                  {color.paint && <p className="text-xs text-stone-400 mt-0.5">{color.paint}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section className="section-sm bg-white">
        <div className="container-site">
          <p className="label mb-2">Gallery</p>
          <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-6">Inspiration Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {theme.galleryImages.map((img, i) => (
              <div key={i} className="relative overflow-hidden aspect-square bg-stone-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`${theme.name} ${i+1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MATERIALS ── */}
      <section id="section-materials" className="section-sm bg-stone-50">
        <div className="container-site">
          <p className="label mb-2">Materiality</p>
          <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-6">Recommended Materials</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {theme.materials.map((mat, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white border border-ink-900/15">
                <div className="h-8 w-8 bg-stone-100 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
                </div>
                <p className="text-sm font-medium text-stone-800">{mat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FURNITURE ── */}
      <section id="section-furniture" className="section-sm bg-white">
        <div className="container-site">
          <p className="label mb-2">Furnishings</p>
          <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-6">Recommended Furniture</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {theme.furniture.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 border border-ink-900/15 hover:border-ink-900/50 hover:border-ink-900 transition-all">
                <div className="h-8 w-8 bg-cobalt-50 flex items-center justify-center shrink-0 text-cobalt-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z"/><path d="M4 18v2M20 18v2M12 4v5"/></svg>
                </div>
                <p className="text-sm font-medium text-stone-800">{item}</p>
              </div>
            ))}
          </div>

          {/* Lighting */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Lighting Recommendations</h3>
            <div className="flex flex-wrap gap-3">
              {theme.lighting.map((l, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 text-sm text-amber-800">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/></svg>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROOM INSPIRATION ── */}
      <section id="section-room-inspiration" className="section bg-stone-50">
        <div className="container-site">
          <p className="label mb-2">Room by Room</p>
          <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-6">Room Inspiration</h2>

          {/* Room tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-7">
            {theme.rooms.map(r => (
              <button
                key={r.room}
                onClick={() => setActiveRoom(r.room)}
                className={`shrink-0 px-4 py-2 text-sm font-medium transition-all ${activeRoom === r.room ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'}`}
              >
                {r.room}
              </button>
            ))}
          </div>

          {currentRoomData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentRoomData.images.map((img, i) => (
                <div key={i} className="relative overflow-hidden aspect-[4/3] bg-stone-200 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`${activeRoom} ${i+1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BUDGET GUIDE ── */}
      <section id="section-budget" className="section bg-white">
        <div className="container-site">
          <p className="label mb-2">Investment Guide</p>
          <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-8">Budget Ranges</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { tier: 'Basic', price: theme.budget.basic, features: ['Standard materials','Pre-made furniture','Basic lighting','Essential finishes'], color: 'bg-stone-50 border-stone-200' },
              { tier: 'Premium', price: theme.budget.premium, features: ['Quality materials','Semi-custom furniture','Designer lighting','Premium finishes'], color: 'bg-cobalt-50 border-cobalt-200' },
              { tier: 'Luxury', price: theme.budget.luxury, features: ['Premium materials','Custom furniture','Bespoke lighting','All finishes custom'], color: 'bg-amber-50 border-amber-200' },
              { tier: 'Ultra Luxury', price: theme.budget.ultraLuxury, features: ['Finest materials','Bespoke everything','Art lighting system','Architect-supervised'], color: 'bg-stone-900 border-stone-700 text-white' },
            ].map(({ tier, price, features, color }) => (
              <div key={tier} className={`border p-5 ${color}`}>
                <p className={`text-xs font-semibold tracking-widest uppercase mb-2 ${tier === 'Ultra Luxury' ? 'text-stone-400' : 'text-stone-500'}`}>{tier}</p>
                <p className={`text-2xl font-semibold tracking-tight mb-4 ${tier === 'Ultra Luxury' ? 'text-white' : 'text-stone-900'}`}>{price}</p>
                <ul className="space-y-1.5">
                  {features.map(f => (
                    <li key={f} className={`text-xs flex items-center gap-1.5 ${tier === 'Ultra Luxury' ? 'text-stone-400' : 'text-stone-600'}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/get-started?theme=${slug}`} className={`mt-5 block text-center py-2.5 text-xs font-semibold transition-all ${tier === 'Ultra Luxury' ? 'bg-white text-stone-900 hover:bg-stone-100' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
                  Start My Renovation
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOOD BOARD ── */}
      <section className="section-sm bg-stone-50">
        <div className="container-site">
          <p className="label mb-2">Visual Story</p>
          <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-6">Mood Board</h2>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {[...theme.galleryImages, theme.coverImage, ...theme.rooms[0]?.images ?? []].slice(0,8).map((img, i) => (
              <div key={i} className="relative overflow-hidden break-inside-avoid bg-stone-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Mood ${i}`} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIMILAR THEMES ── */}
      {similar.length > 0 && (
        <section id="section-similar" className="section bg-white">
          <div className="container-site">
            <p className="label mb-2">You might also love</p>
            <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-2">Similar Themes</h2>
            <p className="text-stone-500 text-sm mb-8">Homeowners who loved {theme.name} also explored these styles</p>
            <ThemeCarousel themes={similar} />
          </div>
        </section>
      )}

      {/* ── STICKY BOTTOM CTA ── */}
      <div className="sticky bottom-0 z-40 isolate bg-white/95 backdrop-blur-md border-t border-stone-100 shadow-xl">
        <div className="container-site py-3 flex items-center justify-between gap-4">
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-stone-900">{theme.name}</p>
            <p className="text-xs text-stone-500">From {theme.budget.basic}</p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={handleToggleSave} className={`px-4 py-2.5 text-xs font-semibold border transition-all ${saved ? 'bg-rose-50 text-rose-700 border-rose-200' : 'border-stone-200 text-stone-700 hover:border-stone-400'}`}>
              {saved ? '♥ Saved' : '♡ Save Idea'}
            </button>
            <Link href={`/get-started?theme=${slug}`} className="inline-flex items-center coarse:min-h-11 px-4 py-2.5 text-xs font-semibold border border-stone-300 text-stone-700 hover:border-stone-500 transition-all hidden sm:block">
              Use This Design
            </Link>
            <Link href={`/get-started?theme=${slug}`} className="coarse:min-h-11 px-5 py-2.5 text-xs font-semibold bg-ink-900 text-white hover:bg-cobalt-600 transition-all">
              Start My Renovation
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
