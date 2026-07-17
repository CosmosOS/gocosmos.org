import { useEffect, useRef } from 'react';

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
  color: RGB;
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
}

interface Galaxy {
  cx: number;
  cy: number;
  r: number;
  rot: number;
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
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
          color: tint < 0.7 ? COLORS.white : (tint < 0.9 ? COLORS.cream : COLORS.iceBlue),
        });
      }
      return { stars, parallax };
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

      // Single rotating galaxy disc, top-right region
      galaxy = { cx: w * 0.78, cy: h * 0.22, r: Math.min(w, h) * 0.14, rot: 0 };
    }

    function drawNebula(n: Nebula) {
      if (!ctx) return;
      // Slow drift + breathing alpha so it doesn't look static
      n.t += 0.002;
      n.x += n.vx; n.y += n.vy;
      // Wrap softly
      if (n.x < -n.rx) n.x = w + n.rx;
      if (n.x > w + n.rx) n.x = -n.rx;
      if (n.y < -n.ry) n.y = h + n.ry;
      if (n.y > h + n.ry) n.y = -n.ry;
      const breathe = 0.85 + Math.sin(n.t) * 0.15;
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, Math.max(n.rx, n.ry));
      grd.addColorStop(0,    rgba(n.color, n.a * breathe));
      grd.addColorStop(0.55, rgba(n.color, n.a * 0.35 * breathe));
      grd.addColorStop(1,    rgba(n.color, 0));
      ctx.fillStyle = grd;
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(n.rx / Math.max(n.rx, n.ry), n.ry / Math.max(n.rx, n.ry));
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(n.rx, n.ry), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawGalaxy() {
      if (!ctx || !galaxy) return;
      galaxy.rot += 0.0008;
      ctx.save();
      ctx.translate(galaxy.cx, galaxy.cy);
      ctx.rotate(galaxy.rot);
      // Disc — flattened oval glow
      const r = galaxy.r;
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grd.addColorStop(0,    rgba(COLORS.galaxyHi, 0.18));
      grd.addColorStop(0.25, rgba(COLORS.galaxyHi, 0.08));
      grd.addColorStop(0.6,  rgba(COLORS.nebulaA, 0.05));
      grd.addColorStop(1,    rgba(COLORS.nebulaA, 0));
      ctx.fillStyle = grd;
      ctx.scale(1, 0.32); // flat disc
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      // Bright core
      ctx.fillStyle = rgba(COLORS.galaxyHi, 0.30);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.10, 0, Math.PI * 2);
      ctx.fill();
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
          ctx.fillStyle = rgba(s.color, a);
          ctx.beginPath();
          ctx.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);
          ctx.fill();
          // Glow halo on the bigger near-layer stars
          if (s.r > 1.3) {
            ctx.fillStyle = rgba(s.color, a * 0.18);
            ctx.beginPath();
            ctx.arc(s.x + ox, s.y + oy, s.r * 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
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
  }, []);
  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
