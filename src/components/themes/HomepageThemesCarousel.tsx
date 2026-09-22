'use client';
import Link from 'next/link';
import { useRef, useCallback } from 'react';
import { THEMES, FEATURED_THEME_SLUGS } from '@/lib/themes/data';
import ThemeCard from '@/components/themes/ThemeCard';
import { SectionHeading } from '@/components/home/SectionHeading';
import { Hl } from '@/components/home/Hl';

const featured = FEATURED_THEME_SLUGS.map(s => THEMES.find(t => t.slug === s)).filter(Boolean) as typeof THEMES;

export default function HomepageThemesCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const scroll = useCallback((dir: 'prev' | 'next') => {
    trackRef.current?.scrollBy({ left: dir === 'next' ? 320 : -320, behavior: 'smooth' });
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = trackRef.current; if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const el = trackRef.current;
    if (!isDragging.current || !el) return;
    e.preventDefault();
    el.scrollLeft = scrollLeft.current - (e.pageX - el.offsetLeft - startX.current);
  };
  const stopDrag = () => {
    isDragging.current = false;
    if (trackRef.current) trackRef.current.style.cursor = 'grab';
  };

  return (
    <section className="border-b-2 border-ink-900 bg-paper-100 py-20 lg:py-28">
      <div className="container-site">
        {/* Header */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            index="A-07"
            eyebrow="Find your aesthetic"
            title={<>Design <Hl>themes.</Hl></>}
            body="Browse curated design styles with mood boards, material palettes and professional estimates."
          />
          <Link
            href="/themes"
            className="group hidden shrink-0 items-center gap-2 border-2 border-ink-900 px-5 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-white md:inline-flex"
          >
            View all themes
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-0.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Prev arrow */}
          <button
            onClick={() => scroll('prev')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 h-11 w-11 bg-white border-2 border-ink-900 flex items-center justify-center hover:bg-ink-900 hover:text-white transition-all hidden md:flex"
            aria-label="Previous"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          {/* Track */}
          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto no-scrollbar"
            style={{ cursor: 'grab' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
          >
            {featured.map(theme => (
              <div key={theme.slug} style={{ width: 300, flexShrink: 0 }}>
                <ThemeCard theme={theme} size="md" />
              </div>
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={() => scroll('next')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 h-11 w-11 bg-white border-2 border-ink-900 flex items-center justify-center hover:bg-ink-900 hover:text-white transition-all hidden md:flex"
            aria-label="Next"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 md:hidden text-center">
          <Link href="/themes" className="coarse:min-h-11 inline-flex items-center text-sm font-medium text-cobalt-500 hover:text-cobalt-600 transition-colors">
            View All Themes →
          </Link>
        </div>
      </div>
    </section>
  );
}
