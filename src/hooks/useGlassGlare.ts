import { useEffect } from 'react';

/**
 * Drives the cursor-tracking specular glare on .glass surfaces: writes
 * --glare-x/--glare-y (pointer position relative to each element, can sit
 * outside 0–100% so the shine hugs the nearest edge) and --glare-o (opacity
 * with distance falloff, so surfaces near the cursor catch the light).
 *
 * Work is batched per animation frame. Element rects are cached and only
 * re-measured on scroll/resize or every 250ms, and elements whose glare is
 * (and stays) off are skipped without touching style — so a pointer move
 * costs a handful of writes, not 25 rect reads + 75 style writes.
 * Disabled under prefers-reduced-motion.
 */
export function useGlassGlare(): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Touch devices fire pointermove during a tap and never send another
    // event when the finger lifts, so the glare would stick where the last
    // tap landed and jump to the next tap. Gate on hover-capable pointers.
    if (!window.matchMedia('(hover: hover)').matches) return;
    const FALLOFF = 280; // px from element edge at which the glare fades out
    let raf = 0;
    let px = 0;
    let py = 0;
    let els: HTMLElement[] = [];
    let rects: { left: number; top: number; right: number; bottom: number; w: number; h: number }[] = [];
    let cacheAt = -1e9;
    let cacheStale = true;
    const lastO = new WeakMap<HTMLElement, number>();
    const invalidate = () => { cacheStale = true; };

    const refreshCache = (t: number) => {
      els = Array.from(document.querySelectorAll<HTMLElement>('.glass'));
      rects = els.map(el => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
      });
      cacheAt = t;
      cacheStale = false;
    };

    const apply = () => {
      raf = 0;
      const t = performance.now();
      if (cacheStale || t - cacheAt > 250) refreshCache(t);
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const r = rects[i];
        if (r.w === 0) continue;
        const dx = Math.max(r.left - px, 0, px - r.right);
        const dy = Math.max(r.top - py, 0, py - r.bottom);
        const opacity = Math.max(0, 1 - Math.hypot(dx, dy) / FALLOFF);
        // Off and staying off — no style work.
        if (opacity < 0.005 && (lastO.get(el) ?? 0) < 0.005) continue;
        lastO.set(el, opacity);
        el.style.setProperty('--glare-x', `${(((px - r.left) / r.w) * 100).toFixed(2)}%`);
        el.style.setProperty('--glare-y', `${(((py - r.top) / r.h) * 100).toFixed(2)}%`);
        el.style.setProperty('--glare-o', opacity.toFixed(3));
      }
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
