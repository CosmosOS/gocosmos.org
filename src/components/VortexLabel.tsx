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
const ARMS = [
  { d: spiralPath(0, 1.25, 49), o: 0.70, w: 2.0 },
  { d: spiralPath(THIRD, 1.25, 47), o: 0.48, w: 1.6 },
  { d: spiralPath(2 * THIRD, 1.25, 48), o: 0.60, w: 1.8 },
  { d: spiralPath(0.7, 1.4, 44), o: 0.30, w: 1.1 },
  { d: spiralPath(0.7 + THIRD, 1.4, 43), o: 0.24, w: 1.1 },
  { d: spiralPath(0.7 + 2 * THIRD, 1.4, 45), o: 0.27, w: 1.1 },
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
                vectorEffect="non-scaling-stroke" />
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
      <span className="vx-sr">{text}</span>
    </>
  );
}
