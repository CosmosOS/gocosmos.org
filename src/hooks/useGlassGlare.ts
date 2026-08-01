import { useEffect } from 'react';

/**
 * Drives the cursor-tracking specular glare on .glass surfaces: writes
 * --glare-x/--glare-y (pointer position relative to each element, can sit
 * outside 0–100% so the shine hugs the nearest edge) and --glare-o (opacity
 * with distance falloff, so surfaces near the cursor catch the light).
 * Work is batched per animation frame; disabled under prefers-reduced-motion.
 */
export function useGlassGlare(): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const FALLOFF = 280; // px from element edge at which the glare fades out
    let raf = 0;
    let px = 0;
    let py = 0;

    const apply = () => {
      raf = 0;
      document.querySelectorAll<HTMLElement>('.glass').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.bottom < -FALLOFF || r.top > window.innerHeight + FALLOFF) return;
        const dx = Math.max(r.left - px, 0, px - r.right);
        const dy = Math.max(r.top - py, 0, py - r.bottom);
        const opacity = Math.max(0, 1 - Math.hypot(dx, dy) / FALLOFF);
        el.style.setProperty('--glare-x', `${(((px - r.left) / r.width) * 100).toFixed(2)}%`);
        el.style.setProperty('--glare-y', `${(((py - r.top) / r.height) * 100).toFixed(2)}%`);
        el.style.setProperty('--glare-o', opacity.toFixed(3));
      });
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
