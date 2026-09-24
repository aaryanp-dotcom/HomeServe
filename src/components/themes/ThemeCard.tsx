'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Theme } from '@/lib/themes/types';
import { formatSaveCount } from '@/lib/themes/format';
import { isThemeSavedLocally, toggleThemeSave } from '@/lib/themes/device';

interface Props { theme: Theme; size?: 'sm' | 'md' | 'lg'; saveCount?: number }

export default function ThemeCard({ theme, size = 'md', saveCount = 0 }: Props) {
  const [saved, setSaved] = useState(false);
  const [count, setCount] = useState(saveCount);
  const [pending, setPending] = useState(false);
  const aspect = size === 'lg' ? 'aspect-[3/4]' : 'aspect-[4/3]';
  const titleSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-[1.7rem]';

  // The card renders the server-fetched count first (so it's correct on load); this only overrides
  // it with "have I saved this" once the browser's own localStorage is available.
  useEffect(() => { setSaved(isThemeSavedLocally(theme.slug)); }, [theme.slug]);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    const next = !saved;
    setSaved(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    const serverCount = await toggleThemeSave(theme.slug, next);
    if (serverCount != null) {
      setCount(serverCount);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('hs_saved_updated'));
    } else {
      setSaved(!next); // request failed — undo the optimistic flip
    }
    setPending(false);
  }

  return (
    <Link
      href={`/themes/${theme.slug}`}
      className={`group relative flex flex-col overflow-hidden border-2 border-ink-900 bg-ink-900 cursor-pointer select-none ${aspect}`}
      style={{ flexShrink: 0 }}
    >
      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={theme.coverImage}
        alt={theme.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        loading="lazy"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0 transition-opacity duration-300 group-hover:opacity-90" />

      {/* Badges */}
      <div className="absolute top-3 left-3 flex gap-1.5">
        {theme.isTrending && (
          <span className="px-2 py-1 font-mono text-[0.6875rem] font-semibold bg-cobalt-400 text-ink-900 tracking-wider">TRENDING</span>
        )}
        {theme.isNew && (
          <span className="px-2 py-1 font-mono text-[0.6875rem] font-semibold bg-white text-ink-900 tracking-wider">NEW</span>
        )}
        {theme.isEditorPick && !theme.isTrending && (
          <span className="px-2 py-1 font-mono text-[0.6875rem] font-semibold bg-white text-ink-900 tracking-wider">EDITOR&apos;S PICK</span>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleToggle}
        className={`absolute top-3 right-3 h-8 w-8 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 ${saved ? 'opacity-100 bg-rose-600' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 bg-black/30 hover:bg-black/50'}`}
        aria-label={saved ? 'Unsave' : 'Save'}
        aria-pressed={saved}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'white' : 'none'} stroke="white" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] mb-1.5">{theme.category}</p>
        <h3 className={`${titleSize} font-display font-extrabold tracking-[-0.04em] text-white leading-[0.95]`}>{theme.name}</h3>
        <p className="text-white/65 text-xs mt-1 line-clamp-2 leading-snug">{theme.tagline}</p>

        {/* Budget + saved */}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-white/50 text-xs">From {theme.budget.basic}</span>
          <span className="text-white/50 text-xs flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {formatSaveCount(count)}
          </span>
        </div>

        {/* CTA */}
        <div className="mt-3 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 translate-y-2 group-hover:translate-y-0 [@media(hover:none)]:translate-y-0 transition-all duration-300">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
            Explore theme
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
