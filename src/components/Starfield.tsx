import { useEffect, useRef } from 'react';
import { useMotionOff } from '../hooks/useMotion';

type RGB = readonly [number, number, number];

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  vx: number;
  vy: number;
  tw: number;
  twSpeed: number;
  sprite: HTMLCanvasElement;
}

interface Layer {
  stars: Star[];
  parallax: number;
}

interface Nebula {
  x: number;
  y: number;
  rx: number;
  ry: number;
  color: RGB;
  a: number;
  vx: number;
  vy: number;
  t: number;
  bmp?: HTMLCanvasElement;
}

interface Galaxy {
  cx: number;
  cy: number;
  r: number;
  rot: number;
  bmp?: HTMLCanvasElement;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

const COLORS = {
  cream:    [242, 235, 218],
  iceBlue:  [180, 200, 230],
  white:    [245, 245, 250],
  nebulaA:  [120, 95, 180],   // muted violet
  nebulaB:  [70, 130, 180],   // muted teal
  galaxyHi: [242, 235, 218],
} satisfies Record<string, RGB>;

function rgba(c: RGB, a: number): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/**
 * Cosmos — animated background.
 * Layers (back → front):
 *   1. Two slow-drifting nebula clouds (soft radial gradients)
 *   2. A faint rotating galaxy disc near the top-right
 *   3. Three parallax star layers (small/medium/large) with twinkle
 *   4. Occasional shooting stars (~every 6–10s)
 * Palette: cream halo + cool blue-white, lifted from the logo.
 * Respects prefers-reduced-motion (renders one static frame, no rAF).
 */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);
  // Reactive: OS setting or the nav pause toggle restarts/stops the effect.
  const reduced = useMotionOff();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    let layers: Layer[] = [];
    let nebulae: Nebula[] = [];
    let galaxy: Galaxy | null = null;
    let shooting: ShootingStar | null = null;
    let nextShooting = 0;
    let mouseX = 0, mouseY = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Everything static is rasterized once and drawImage'd per frame —
    // per-frame gradient allocation + path rasterization for ~600 shapes was
    // the main CPU cost of this component. Star/galaxy output is identical.
    // Nebulae: the old per-frame version evaluated its gradient under the
    // ellipse transform, which offset the glow by (x·rx/R, y·ry/R) — leaving
    // the teal nebula fully transparent. The baked version centers the glow
    // in its ellipse, i.e. what the layer list above always described.
    function makeStarSprite(c: RGB): HTMLCanvasElement {
      const s = document.createElement('canvas');
      const R = 8;
      s.width = s.height = R * 2;
      const g = s.getContext('2d');
      if (g) {
        g.fillStyle = rgba(c, 1);
        g.beginPath();
        g.arc(R, R, R, 0, Math.PI * 2);
        g.fill();
      }
      return s;
    }
    const SPRITES = {
      white: makeStarSprite(COLORS.white),
      cream: makeStarSprite(COLORS.cream),
      iceBlue: makeStarSprite(COLORS.iceBlue),
    };

    function makeLayer(density: number, sizeMin: number, sizeMax: number, speedMul: number, parallax: number): Layer {
      const count = Math.floor((w * h) / density);
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        const tint = Math.random();
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: sizeMin + Math.random() * (sizeMax - sizeMin),
          a: 0.35 + Math.random() * 0.5,
          vx: (Math.random() - 0.5) * 0.02 * speedMul,
          vy: (Math.random() - 0.5) * 0.02 * speedMul,
          tw: Math.random() * Math.PI * 2,
          twSpeed: 0.004 + Math.random() * 0.012,
          sprite: tint < 0.7 ? SPRITES.white : (tint < 0.9 ? SPRITES.cream : SPRITES.iceBlue),
        });
      }
      return { stars, parallax };
    }

    // Bake a nebula's gradient once (at half resolution — it's a soft blur by
    // nature, the upscale is invisible and saves memory).
    function bakeNebula(n: Nebula) {
      const R = Math.max(n.rx, n.ry);
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.ceil(n.rx));
      c.height = Math.max(1, Math.ceil(n.ry));
      const g = c.getContext('2d');
      if (!g) return;
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, R);
      grd.addColorStop(0, rgba(n.color, n.a));
      grd.addColorStop(0.55, rgba(n.color, n.a * 0.35));
      grd.addColorStop(1, rgba(n.color, 0));
      g.scale(0.5, 0.5);
      g.translate(n.rx, n.ry);
      g.scale(n.rx / R, n.ry / R);
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, 0, R, 0, Math.PI * 2);
      g.fill();
      n.bmp = c;
    }

    function bakeGalaxy(gal: Galaxy) {
      const r = gal.r;
      const c = document.createElement('canvas');
      c.width = c.height = Math.max(1, Math.ceil(r * 2 * dpr));
      const g = c.getContext('2d');
      if (!g) return;
      g.scale(dpr, dpr);
      g.translate(r, r);
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
      grd.addColorStop(0, rgba(COLORS.galaxyHi, 0.18));
      grd.addColorStop(0.25, rgba(COLORS.galaxyHi, 0.08));
      grd.addColorStop(0.6, rgba(COLORS.nebulaA, 0.05));
      grd.addColorStop(1, rgba(COLORS.nebulaA, 0));
      g.fillStyle = grd;
      g.save();
      g.scale(1, 0.32); // flat disc
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.fill();
      // Bright core — inside the same flatten transform, like the disc.
      g.fillStyle = rgba(COLORS.galaxyHi, 0.30);
      g.beginPath();
      g.arc(0, 0, r * 0.10, 0, Math.PI * 2);
      g.fill();
      g.restore();
      gal.bmp = c;
    }

    function resize() {
      if (!canvas || !ctx) return;
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 3 depth layers — far/mid/near
      layers = [
        makeLayer(20000, 0.3, 0.7, 0.4, 4),    // far  – tiny, slow, big parallax
        makeLayer(12000, 0.5, 1.2, 1.0, 8),    // mid
        makeLayer(8000,  0.8, 1.8, 1.6, 14),   // near – bigger, fastest
      ];

      // Two slow nebulae positioned in different corners
      nebulae = [
        { x: w * 0.25, y: h * 0.30, rx: w * 0.45, ry: h * 0.35, color: COLORS.nebulaA, a: 0.10, vx: 0.015, vy: 0.008, t: 0 },
        { x: w * 0.78, y: h * 0.65, rx: w * 0.38, ry: h * 0.30, color: COLORS.nebulaB, a: 0.08, vx: -0.012, vy: -0.006, t: Math.PI },
      ];
      nebulae.forEach(bakeNebula);

      // Single rotating galaxy disc, top-right region
      galaxy = { cx: w * 0.78, cy: h * 0.22, r: Math.min(w, h) * 0.14, rot: 0 };
      bakeGalaxy(galaxy);
    }

    function drawNebula(n: Nebula) {
      if (!ctx || !n.bmp) return;
      // Slow drift + breathing alpha so it doesn't look static
      n.t += 0.002;
      n.x += n.vx; n.y += n.vy;
      // Wrap softly
      if (n.x < -n.rx) n.x = w + n.rx;
      if (n.x > w + n.rx) n.x = -n.rx;
      if (n.y < -n.ry) n.y = h + n.ry;
      if (n.y > h + n.ry) n.y = -n.ry;
      ctx.globalAlpha = 0.85 + Math.sin(n.t) * 0.15;
      ctx.drawImage(n.bmp, n.x - n.rx, n.y - n.ry, n.rx * 2, n.ry * 2);
      ctx.globalAlpha = 1;
    }

    function drawGalaxy() {
      if (!ctx || !galaxy || !galaxy.bmp) return;
      galaxy.rot += 0.0008;
      ctx.save();
      ctx.translate(galaxy.cx, galaxy.cy);
      ctx.rotate(galaxy.rot);
      ctx.drawImage(galaxy.bmp, -galaxy.r, -galaxy.r, galaxy.r * 2, galaxy.r * 2);
      ctx.restore();
    }

    function drawStars() {
      if (!ctx) return;
      // Mouse parallax target (smoothly lerped via mouseX/mouseY which are -1..1)
      for (const layer of layers) {
        const ox = mouseX * layer.parallax;
        const oy = mouseY * layer.parallax;
        for (const s of layer.stars) {
          s.x += s.vx; s.y += s.vy; s.tw += s.twSpeed;
          if (s.x < 0) s.x = w; else if (s.x > w) s.x = 0;
          if (s.y < 0) s.y = h; else if (s.y > h) s.y = 0;
          const a = s.a * (0.55 + Math.sin(s.tw) * 0.45);
          ctx.globalAlpha = a;
          ctx.drawImage(s.sprite, s.x + ox - s.r, s.y + oy - s.r, s.r * 2, s.r * 2);
          // Glow halo on the bigger near-layer stars
          if (s.r > 1.3) {
            const hr = s.r * 2.6;
            ctx.globalAlpha = a * 0.18;
            ctx.drawImage(s.sprite, s.x + ox - hr, s.y + oy - hr, hr * 2, hr * 2);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    function spawnShootingStar() {
      // Random angle that sweeps top-left → bottom-right area, gentle
      const fromLeft = Math.random() < 0.5;
      const startX = fromLeft ? -40 : w + 40;
      const startY = Math.random() * h * 0.6;
      const angle = fromLeft ? (Math.PI / 6 + (Math.random() - 0.5) * 0.4)
                             : (Math.PI - Math.PI / 6 + (Math.random() - 0.5) * 0.4);
      const speed = 8 + Math.random() * 4;
      shooting = {
        x: startX, y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        max: 60 + Math.random() * 20,
      };
    }

    function drawShooting() {
      if (!ctx || !shooting) return;
      shooting.life++;
      shooting.x += shooting.vx;
      shooting.y += shooting.vy;
      const lifeFrac = shooting.life / shooting.max;
      // Fade in/out envelope
      const env = lifeFrac < 0.2 ? lifeFrac / 0.2
                : lifeFrac > 0.7 ? (1 - lifeFrac) / 0.3
                : 1;
      const tailLen = 80;
      const grd = ctx.createLinearGradient(
        shooting.x, shooting.y,
        shooting.x - shooting.vx * tailLen * 0.12,
        shooting.y - shooting.vy * tailLen * 0.12
      );
      grd.addColorStop(0, rgba(COLORS.cream, 0.95 * env));
      grd.addColorStop(0.4, rgba(COLORS.cream, 0.4 * env));
      grd.addColorStop(1, rgba(COLORS.cream, 0));
      ctx.strokeStyle = grd;
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shooting.x, shooting.y);
      ctx.lineTo(shooting.x - shooting.vx * tailLen * 0.12, shooting.y - shooting.vy * tailLen * 0.12);
      ctx.stroke();
      // Bright head
      ctx.fillStyle = rgba(COLORS.cream, env);
      ctx.beginPath();
      ctx.arc(shooting.x, shooting.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
      if (shooting.life >= shooting.max
          || shooting.x < -100 || shooting.x > w + 100
          || shooting.y < -100 || shooting.y > h + 100) {
        shooting = null;
      }
    }

    let smoothMx = 0, smoothMy = 0;
    function tick(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      // Smoothly approach target mouse offset
      smoothMx += (mouseX - smoothMx) * 0.04;
      smoothMy += (mouseY - smoothMy) * 0.04;
      // Background layers
      for (const n of nebulae) drawNebula(n);
      drawGalaxy();
      // Stars (use smoothed values)
      const realMx = mouseX, realMy = mouseY;
      mouseX = smoothMx; mouseY = smoothMy;
      drawStars();
      mouseX = realMx; mouseY = realMy;
      // Shooting star
      if (!shooting && t > nextShooting) {
        spawnShootingStar();
        nextShooting = t + 6000 + Math.random() * 5000;
      }
      drawShooting();
      raf = requestAnimationFrame(tick);
    }

    function onMouse(e: MouseEvent) {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      // Normalize to -1..1 around center
      mouseX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouseY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }

    resize();
    if (reduced) {
      // Single static frame
      for (const n of nebulae) drawNebula(n);
      drawGalaxy();
      drawStars();
    } else {
      nextShooting = performance.now() + 3000;
      raf = requestAnimationFrame(tick);
      window.addEventListener('mousemove', onMouse, { passive: true });
    }
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [reduced]);
  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
