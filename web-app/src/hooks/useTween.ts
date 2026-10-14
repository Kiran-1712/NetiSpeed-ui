import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Eases a number towards `target`. Re-targeting mid-tween resumes from wherever
 * the value currently is, so a live reading glides instead of jumping.
 */
export function useTween(target: number, duration = 700): number {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [value, setValue] = useState(safeTarget);
  // Held in a ref so the effect doesn't depend on `value`, which would restart
  // the tween on every frame.
  const currentRef = useRef(safeTarget);

  useEffect(() => {
    const from = currentRef.current;
    const span = prefersReducedMotion() ? 0 : duration;
    let frame = 0;
    let startedAt: number | null = null;

    const step = (now: number) => {
      if (startedAt === null) startedAt = now;
      const t = span === 0 ? 1 : Math.min((now - startedAt) / span, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (safeTarget - from) * eased;
      currentRef.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [safeTarget, duration]);

  return value;
}
