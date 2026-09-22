'use client';
import { useRef, useCallback, useEffect } from 'react';
import { Theme } from '@/lib/themes/types';
import ThemeCard from './ThemeCard';

interface Props {
  themes: Theme[];
  title?: string;
  description?: string;
  saveCounts?: Record<string, number>;
}

export default function ThemeCarousel({ themes, title, description, saveCounts }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const scroll = useCallback((dir: 'prev' | 'next') => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'next' ? 340 : -340, behavior: 'smooth' });
  }, []);

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    const el = trackRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const el = trackRef.current;
    if (!isDragging.current || !el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = scrollLeft.current - (x - startX.current);
  };
  const stopDrag = () => {
    isDragging.current = false;
    if (trackRef.current) trackRef.current.style.cursor = 'grab';
  };

  // Touch
  const touchStartX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove = (e: React.TouchEvent) => {
    const el = trackRef.current;
    if (!el) return;
    const diff = touchStartX.current - e.touches[0].clientX;
    el.scrollLeft += diff * 0.8;
    touchStartX.current = e.touches[0].clientX;
  };

  // Keyboard
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const handleKey = (e: KeyboardEvent) => {
      if (document.activeElement === el || el.contains(document.activeElement)) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); scroll('prev'); }
        if (e.key === 'ArrowRight') { e.preventDefault(); scroll('next'); }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [scroll]);

  if (!themes.length) return null;

  return (
    <div className="relative">
      {/* Header */}
      {(title || description) && (
        <div className="flex items-end justify-between mb-5">
          <div>
            {title && <h3 className="text-xl font-semibold text-stone-900 tracking-tight">{title}</h3>}
            {description && <p className="text-sm text-stone-500 mt-0.5">{description}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => scroll('prev')}
              className="h-9 w-9 rounded-full border border-stone-200 bg-white hover:border-stone-400 hover:border-ink-900 flex items-center justify-center transition-all"
              aria-label="Previous"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              onClick={() => scroll('next')}
              className="h-9 w-9 rounded-full border border-stone-200 bg-white hover:border-stone-400 hover:border-ink-900 flex items-center justify-center transition-all"
              aria-label="Next"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth"
        style={{ cursor: 'grab' }}
        tabIndex={0}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        {themes.map(theme => (
          <div key={theme.slug} style={{ width: 280, flexShrink: 0 }}>
            <ThemeCard theme={theme} size="md" saveCount={saveCounts?.[theme.slug] ?? 0} />
          </div>
        ))}
      </div>
    </div>
  );
}
