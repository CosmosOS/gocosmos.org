import { useEffect } from 'react';

/**
 * Hover feedback on .glass controls: ONLY the surface under the pointer
 * reacts, as if the cursor carried a small light over that one pane —
 *
 *  - the border ring glints where the cursor is (--glare-*, painted only on
 *    the 1px ring via the mask trick in styles.css — no surface halo),
 *  - the drop shadow slides away from it (--sh-*).
 *
 * Deliberately NO whole-surface response (sheen rotation was tried and cut:
 * with the cursor inside the pane the angle flips through the center and
 * the gradient visibly snaps around — reads as a glitch on short panes).
 *
 * Neighbouring panels never light up: this is interactivity feedback, not
 * ambient lighting. Intensity eases in/out in JS, so a hand-over between two
 * controls cross-fades and everything parks back to the stylesheet defaults.
 *
 * One delegated pointermove listener; the rAF loop only animates the active
 * element (plus one fading out) and stops once settled. Disabled under
 * prefers-reduced-motion and on touch-only pointers.
 */
export function useGlassLight(): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Touch devices fire pointermove during a tap and never send another
    // event when the finger lifts — the glint would stick to the last tap.
    if (!window.matchMedia('(hover: hover)').matches) return;

    const TAU = 110; // ms — intensity ease in/out
    const SHADOW = 6; // px — max drop-shadow displacement

    type Rect = { left: number; top: number; w: number; h: number; cx: number; cy: number };
    type State = { rect: Rect; on: boolean; I: number; x: number; y: number };
    const measure = (el: HTMLElement): Rect => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    };

    const states = new Map<HTMLElement, State>();
    let active: HTMLElement | null = null;
    let raf = 0;
    let last = 0;
    let dirty = false;
    let rectStale = false;

    const step = (now: number) => {
      const dt = Math.min(now - last, 64) || 16.7;
      last = now;
      const k = 1 - Math.exp(-dt / TAU);
      dirty = false;
      let busy = false;
      states.forEach((s, el) => {
        if (rectStale && s.on) s.rect = measure(el);
        s.I += ((s.on ? 1 : 0) - s.I) * k;
        const st = el.style;
        if (!s.on && s.I < 0.01) {
          // Fade-out finished — park the stylesheet defaults and forget.
          states.delete(el);
          st.setProperty('--glare-o', '0');
          st.setProperty('--sh-x', '0px');
          st.setProperty('--sh-y', '8px');
          return;
        }
        busy = busy || Math.abs((s.on ? 1 : 0) - s.I) > 0.004;
        const r = s.rect;
        const I = s.I;
        // Offset from the pane's center, normalized to its half-extents.
        const nx = Math.max(-1, Math.min(1, (s.x - r.cx) / (r.w / 2)));
        const ny = Math.max(-1, Math.min(1, (s.y - r.cy) / (r.h / 2)));
        st.setProperty('--glare-x', `${(((s.x - r.left) / r.w) * 100).toFixed(2)}%`);
        st.setProperty('--glare-y', `${(((s.y - r.top) / r.h) * 100).toFixed(2)}%`);
        st.setProperty('--glare-o', I.toFixed(3));
        st.setProperty('--sh-x', `${(-nx * SHADOW * I).toFixed(2)}px`);
        st.setProperty('--sh-y', `${(8 - ny * SHADOW * I).toFixed(2)}px`);
      });
      rectStale = false;
      raf = busy || dirty ? requestAnimationFrame(step) : 0;
    };
    const wake = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };

    const activate = (g: HTMLElement | null) => {
      if (g === active) return;
      if (active) {
        const s = states.get(active);
        if (s) s.on = false;
      }
      active = g;
      if (g) {
        const s = states.get(g) ?? { rect: measure(g), on: true, I: 0, x: 0, y: 0 };
        s.on = true;
        s.rect = measure(g);
        // Ring glint radius scales with the pane, set once per activation.
        g.style.setProperty('--glare-r', `${Math.min(300, Math.max(90, 0.5 * Math.hypot(s.rect.w, s.rect.h))).toFixed(0)}px`);
        states.set(g, s);
      }
    };
    const onMove = (e: PointerEvent) => {
      const t = e.target as Element | null;
      activate(t && t.closest ? (t.closest('.glass') as HTMLElement | null) : null);
      if (active) {
        const s = states.get(active)!;
        s.x = e.clientX;
        s.y = e.clientY;
      }
      dirty = true;
      wake();
    };
    const release = () => {
      activate(null);
      wake();
    };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) release();
    };
    const invalidate = () => {
      rectStale = true;
      if (active) wake();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerout', onOut, { passive: true });
    window.addEventListener('blur', release);
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerout', onOut);
      window.removeEventListener('blur', release);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
