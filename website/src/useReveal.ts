import { useEffect } from 'react';

/**
 * What rises into place as it scrolls into view. None of these sit inside
 * another, so nothing animates twice. `.s-head` and `.s-split` also draw their
 * rule; the grade scale and the roadmap have their own variants in site.css.
 */
const TARGETS = [
  '.s-head:not(.s-split > .s-head)',
  '.s-split',
  '.s-legend li',
  '.s-spec-item',
  '.s-bloat-copy',
  '.s-bloat-panel > :not(.s-scale)',
  '.s-scale li',
  '.s-more-lead',
  '.s-rows li',
  '.s-group-title',
  '.s-item',
  '.s-android-copy',
  '.s-roadmap li',
  '.s-statement > *',
  '.s-cta-grid > *',
  '.s-doc section',
  '.s-fmeasures > .s-label',
  '.s-fwords li',
  '.s-fmeta',
].join(', ');

/** Gap between items that come into view together, and how many steps it runs to. */
const STAGGER_MS = 80;
const STAGGER_MAX = 6;

/**
 * Hides what starts below the fold and reveals it on entry. Anything already on
 * screen when the page hydrates is left alone, so the prerendered page never
 * blinks, and without JavaScript or with reduced motion everything just shows.
 */
export function useReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let step = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.style.setProperty('--rd', `${Math.min(step++, STAGGER_MAX) * STAGGER_MS}ms`);
          el.dataset.reveal = 'shown';
          observer.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );

    const fold = window.innerHeight;
    for (const el of document.querySelectorAll<HTMLElement>(TARGETS)) {
      if (el.dataset.reveal === 'shown' || el.getBoundingClientRect().top < fold) continue;
      el.dataset.reveal = 'hidden';
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);
}
