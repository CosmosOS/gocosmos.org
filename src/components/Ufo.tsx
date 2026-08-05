import { useEffect, useRef } from 'react';

/** Sprite strip: 29 frames of the saucer's hover shimmer, re-centered from the
 *  original gif so position is fully script-controlled (scripts in the repo
 *  history: the gif's baked-in bob was cropped out per frame). */
/* Sprite cells are 130x50; rendered at 80% via background-size. */
const FRAMES = 29;
const CELL_W = 104;
const CELL_H = 40;
const FRAME_MS = 110;

type Mode = 'wander' | 'chase';

/**
 * Background flying saucer. Wanders between random waypoints behind the page
 * content (blurred when it passes under glass surfaces), and every so often
 * darts off to hover above the cursor before losing interest.
 * Starts off-screen; without JS or with reduced motion it simply never appears.
 */
export function Ufo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let last = performance.now();
    let frame = 0;
    let frameAcc = 0;

    let x = -CELL_W;
    let y = window.innerHeight * 0.25;
    let vx = 0;
    let vy = 0;
    let tx = 0;
    let ty = 0;
    let mode: Mode = 'wander';
    let modeUntil = 0;
    let mouseX = 0;
    let mouseY = 0;
    let hasMouse = false;

    const pickWaypoint = () => {
      tx = 40 + Math.random() * Math.max(window.innerWidth - CELL_W - 80, 100);
      ty = 30 + Math.random() * (window.innerHeight * 0.7);
    };
    pickWaypoint();
    modeUntil = last + 4000 + Math.random() * 4000;

    const onPointer = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      hasMouse = true;
    };

    // Tractor-beam interaction: glass surfaces near the saucer get tugged
    // toward it and lit by a purple underglow. Displacement goes through the
    // CSS `translate` property so it composes with (never overrides) the
    // reveal/hover transforms.
    //
    // Geometry is cached (refreshed on scroll/resize, throttled to 10Hz, and
    // at least every 250ms) and elements far from the saucer with settled
    // effects are skipped without touching style at all — so the steady-state
    // cost per frame is a few distance checks, not 25 rect reads + writes.
    const REACH = 240;
    const MAX_PULL = 9;
    // Text sitting straight on the starfield — with no glass to blur the
    // saucer, its silhouette bleeds into the letters. Cache those rects and
    // shrink the UFO ("flies away") when it drifts behind one.
    // .readout-tags deliberately absent: the pills read fine with the saucer
    // behind them, so it only shies away from the readout's bare text.
    // .term-player (the frameless hero cast), .term-cmd and .proj-list are
    // bare terminal text too, ever since the glass window came off.
    const SHY_SELECTOR = '.hero-title, .hero-sub, .section-head, .section-sub, .era-title, .era-desc, .era-meta, .footer-tagline, .footer-cols, .footer-fine, .footer-brand, .readout-art, .readout-specs, .term-player, .term-cmd, .proj-list';
    const SHY_PAD = 24;
    const MIN_SCALE = 0.4;
    const tugs = new WeakMap<HTMLElement, { x: number; y: number; o: number }>();
    let els: HTMLElement[] = [];
    let base: { cx: number; cy: number; left: number; top: number; w: number; h: number }[] = [];
    let shyRects: { left: number; top: number; right: number; bottom: number }[] = [];
    let cacheAt = -1e9;
    let cacheStale = true;
    let scale = 1;
    const invalidate = () => { cacheStale = true; };

    const refreshCache = (t: number) => {
      els = Array.from(document.querySelectorAll<HTMLElement>('.glass'));
      base = els.map(g => {
        const r = g.getBoundingClientRect();
        // Subtract the element's own tug so cached centers are its rest position.
        const f = tugs.get(g);
        const ox = f?.x ?? 0;
        const oy = f?.y ?? 0;
        return {
          left: r.left - ox, top: r.top - oy, w: r.width, h: r.height,
          cx: r.left + r.width / 2 - ox, cy: r.top + r.height / 2 - oy,
        };
      });
      shyRects = Array.from(document.querySelectorAll<HTMLElement>(SHY_SELECTOR)).map(e => {
        const r = e.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      });
      cacheAt = t;
      cacheStale = false;
    };

    const interact = (t: number, dt: number, active: boolean) => {
      if ((cacheStale && t - cacheAt > 100) || t - cacheAt > 250) refreshCache(t);
      const scx = x + CELL_W / 2;
      const scy = y + CELL_H / 2;
      const blend = Math.min(dt * 6, 1);
      for (let i = 0; i < els.length; i++) {
        const g = els[i];
        const b = base[i];
        if (b.w === 0) continue;
        const dist = Math.hypot(scx - b.cx, scy - b.cy);
        const strength = active ? Math.max(0, 1 - dist / REACH) : 0;
        const tug = tugs.get(g) ?? { x: 0, y: 0, o: 0 };
        // Out of reach and fully settled — skip all style work.
        if (strength < 0.005 && tug.o < 0.005 && Math.abs(tug.x) < 0.05 && Math.abs(tug.y) < 0.05) continue;
        const pull = strength * strength * MAX_PULL;
        tug.x += ((dist > 1 ? ((scx - b.cx) / dist) * pull : 0) - tug.x) * blend;
        tug.y += ((dist > 1 ? ((scy - b.cy) / dist) * pull : 0) - tug.y) * blend;
        tug.o = strength;
        tugs.set(g, tug);
        if (Math.abs(tug.x) > 0.05 || Math.abs(tug.y) > 0.05) {
          g.style.translate = `${tug.x.toFixed(2)}px ${tug.y.toFixed(2)}px`;
        } else if (g.style.translate) {
          g.style.translate = '';
        }
        g.style.setProperty('--ufo-x', `${(((scx - b.left) / b.w) * 100).toFixed(1)}%`);
        g.style.setProperty('--ufo-y', `${(((scy - b.top) / b.h) * 100).toFixed(1)}%`);
        g.style.setProperty('--ufo-o', strength.toFixed(3));
      }
    };

    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;

      frameAcc += dt * 1000;
      while (frameAcc >= FRAME_MS) {
        frameAcc -= FRAME_MS;
        frame = (frame + 1) % FRAMES;
      }

      if (t > modeUntil) {
        if (mode === 'wander' && hasMouse && Math.random() < 0.4) {
          mode = 'chase';
          modeUntil = t + 2500 + Math.random() * 2500;
        } else {
          mode = 'wander';
          pickWaypoint();
          modeUntil = t + 4000 + Math.random() * 5000;
        }
      }

      const chasing = mode === 'chase';
      // When chasing, hover just above the cursor rather than on top of it.
      const targetX = chasing ? mouseX - CELL_W / 2 : tx;
      const targetY = chasing ? mouseY - CELL_H - 36 : ty;

      // Spring toward the target with drag, then cap speed — wandering is
      // lazy, the attack run is a dart.
      const spring = chasing ? 4.5 : 1.2;
      vx += (targetX - x) * spring * dt;
      vy += (targetY - y) * spring * dt;
      const drag = Math.exp(-dt * (chasing ? 1.4 : 1.8));
      vx *= drag;
      vy *= drag;
      const cap = chasing ? 560 : 150;
      const speed = Math.hypot(vx, vy);
      if (speed > cap) {
        vx = (vx / speed) * cap;
        vy = (vy / speed) * cap;
      }
      x += vx * dt;
      y += vy * dt;
      x = Math.max(-CELL_W / 2, Math.min(x, window.innerWidth - CELL_W / 2));
      y = Math.max(8, Math.min(y, window.innerHeight - CELL_H - 8));

      // Reached the waypoint early — drift on to the next one.
      if (!chasing && Math.hypot(tx - x, ty - y) < 24) pickWaypoint();

      // "Fly away" when drifting behind bare text — but only if no glass
      // surface sits in front (glass already softens the silhouette enough
      // that the text stays readable).
      const scx = x + CELL_W / 2;
      const scy = y + CELL_H / 2;
      let overText = 0;
      for (let i = 0; i < shyRects.length; i++) {
        const r = shyRects[i];
        if (scx < r.left - SHY_PAD || scx > r.right + SHY_PAD ||
            scy < r.top - SHY_PAD || scy > r.bottom + SHY_PAD) continue;
        const dx = Math.min(scx - (r.left - SHY_PAD), (r.right + SHY_PAD) - scx);
        const dy = Math.min(scy - (r.top - SHY_PAD), (r.bottom + SHY_PAD) - scy);
        const depth = Math.min(1, Math.min(dx, dy) / SHY_PAD);
        if (depth > overText) overText = depth;
      }
      let overGlass = 0;
      for (let i = 0; i < base.length; i++) {
        const b = base[i];
        if (b.w === 0) continue;
        if (scx >= b.left && scx <= b.left + b.w && scy >= b.top && scy <= b.top + b.h) {
          overGlass = 1;
          break;
        }
      }
      const targetScale = 1 - overText * (1 - overGlass) * (1 - MIN_SCALE);
      scale += (targetScale - scale) * Math.min(dt * 5, 1);

      const bank = Math.max(-12, Math.min(12, vx * 0.025));
      const bob = Math.sin(t / 650) * 3;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + bob).toFixed(1)}px, 0) rotate(${bank.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      el.style.backgroundPosition = `${-frame * CELL_W}px 0`;

      // The saucer is display:none in light mode — an invisible UFO must not
      // keep tugging elements, so effects decay to zero there.
      interact(t, dt, document.documentElement.dataset.theme !== 'light');

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
      cancelAnimationFrame(raf);
      document.querySelectorAll<HTMLElement>('.glass').forEach(g => {
        g.style.translate = '';
        g.style.removeProperty('--ufo-o');
      });
    };
  }, []);

  // Initial transform parks it off-screen: identical on server and client, so
  // hydration matches and non-JS visitors never see it stuck in a corner.
  return <div ref={ref} className="ufo" aria-hidden="true" style={{ transform: 'translate3d(-200px, 160px, 0)' }} />;
}
