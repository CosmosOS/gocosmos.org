import { ICONS } from '../icons';

/**
 * Logarithmic spiral strand, drawn from the outer edge in toward the core in
 * a 100x100 viewBox. The button stretches the square viewBox into its own
 * ellipse (preserveAspectRatio="none"), so the strands swirl elliptically.
 * Deterministic — prerendered markup matches hydration.
 */
const spiralPath = (thetaOffset: number, turns: number, rOuter: number): string => {
  const pts: string[] = [];
  const N = 56;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const theta = thetaOffset + t * turns * 2 * Math.PI;
    const r = rOuter * Math.pow(0.13, t); // log spiral: outer edge -> core
    pts.push(`${i ? 'L' : 'M'}${(50 + r * Math.cos(theta)).toFixed(1)} ${(50 + r * Math.sin(theta)).toFixed(1)}`);
  }
  return pts.join(' ');
};
const THIRD = (2 * Math.PI) / 3;
/* Dash periods are all 13 or 26 units so the shared -26 dashoffset loop in
   styles.css wraps seamlessly on every strand; per-strand flow speeds (fd)
   and dash patterns make the tangle organic instead of mechanical. */
const ARMS = [
  { d: spiralPath(0, 1.7, 49), o: 0.70, w: 2.0, da: '18 8', fd: '0.8s' },
  { d: spiralPath(THIRD, 1.7, 46), o: 0.46, w: 1.6, da: '14 12', fd: '0.95s' },
  { d: spiralPath(2 * THIRD, 1.7, 48), o: 0.58, w: 1.8, da: '16 10', fd: '0.72s' },
  { d: spiralPath(0.9, 2.0, 43), o: 0.30, w: 1.2, da: '9 4', fd: '0.66s' },
  { d: spiralPath(0.9 + THIRD, 2.0, 41), o: 0.24, w: 1.1, da: '11 2', fd: '1.05s' },
  { d: spiralPath(0.9 + 2 * THIRD, 2.0, 44), o: 0.27, w: 1.2, da: '13 13', fd: '0.88s' },
  { d: spiralPath(1.9, 1.45, 50), o: 0.36, w: 1.4, da: '20 6', fd: '0.78s' },
  { d: spiralPath(1.9 + Math.PI, 1.45, 47), o: 0.32, w: 1.4, da: '17 9', fd: '0.92s' },
];

/**
 * Label for the black-hole primary button in the nav. Every glyph
 * is its own element so that, during the reality glitch, gravity can drag
 * them one after the other: all glyphs run the same 2.7s `letter-spaghetti`
 * cycle as the horizon glitch (identity outside the burst), each delayed by
 * ~20ms per position. At rest the label is perfectly still; when the glitch
 * fires, the pull whips through the text (arrow included) in the rotation
 * direction of the vortex — each glyph swings along the arc, stretches
 * radially (spaghettification) and snaps back.
 * Screen readers get the plain text; the glyph spans are aria-hidden.
 */
export function VortexLabel({ text }: { text: string }) {
  const chars = [...text];
  const delay = (i: number) => `${(i * 0.021).toFixed(3)}s`;
  return (
    <>
      {/* The swirl itself: curved strands wrapping into the core, spinning
          (vx-spin) while their dashes stream inward along the curve
          (vx-flow) — matter spiralling down the drain. */}
      <span className="vx-swirl" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <g className="vx-spin">
            {ARMS.map((a, i) => (
              <path key={i} d={a.d} fill="none" stroke="#F2EBDA" strokeOpacity={a.o}
                strokeWidth={a.w} strokeLinecap="round" className="vx-strand"
                vectorEffect="non-scaling-stroke"
                style={{ strokeDasharray: a.da, animationDuration: a.fd }} />
            ))}
          </g>
        </svg>
      </span>
      <span className="vx-label" aria-hidden="true">
        {chars.map((c, i) => (
          <i key={i} className="vx-l" style={{ animationDelay: delay(i) }}>
            {c === ' ' ? ' ' : c}
          </i>
        ))}
        <span className="vx-l vx-arrow" style={{ animationDelay: delay(chars.length) }}>
          {ICONS.arrow}
        </span>
      </span>
      <span className="sr-only">{text}</span>
    </>
  );
}
