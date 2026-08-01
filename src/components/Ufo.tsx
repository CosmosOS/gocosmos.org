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
    // reveal/hover transforms. Smoothed per frame; radius in px.
    const REACH = 240;
    const MAX_PULL = 9;
    const tugs = new WeakMap<HTMLElement, { x: number; y: number }>();
    const interact = (dt: number, active: boolean) => {
      const cx = x + CELL_W / 2;
      const cy = y + CELL_H / 2;
      const blend = Math.min(dt * 6, 1);
      document.querySelectorAll<HTMLElement>('.glass').forEach(g => {
        const r = g.getBoundingClientRect();
        const ex = r.left + r.width / 2;
        const ey = r.top + r.height / 2;
        const dist = Math.hypot(cx - ex, cy - ey);
        const strength = active && r.width > 0 ? Math.max(0, 1 - dist / REACH) : 0;
        const pull = strength * strength * MAX_PULL;
        const tug = tugs.get(g) ?? { x: 0, y: 0 };
        tug.x += ((dist > 1 ? ((cx - ex) / dist) * pull : 0) - tug.x) * blend;
        tug.y += ((dist > 1 ? ((cy - ey) / dist) * pull : 0) - tug.y) * blend;
        tugs.set(g, tug);
        if (Math.abs(tug.x) > 0.05 || Math.abs(tug.y) > 0.05) {
          g.style.translate = `${tug.x.toFixed(2)}px ${tug.y.toFixed(2)}px`;
        } else if (g.style.translate) {
          g.style.translate = '';
        }
        g.style.setProperty('--ufo-x', `${(((cx - r.left) / r.width) * 100).toFixed(1)}%`);
        g.style.setProperty('--ufo-y', `${(((cy - r.top) / r.height) * 100).toFixed(1)}%`);
        g.style.setProperty('--ufo-o', strength.toFixed(3));
      });
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

      const bank = Math.max(-12, Math.min(12, vx * 0.025));
      const bob = Math.sin(t / 650) * 3;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + bob).toFixed(1)}px, 0) rotate(${bank.toFixed(1)}deg)`;
      el.style.backgroundPosition = `${-frame * CELL_W}px 0`;

      // The saucer is display:none in light mode — an invisible UFO must not
      // keep tugging elements, so effects decay to zero there.
      interact(dt, document.documentElement.dataset.theme !== 'light');

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', onPointer);
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
