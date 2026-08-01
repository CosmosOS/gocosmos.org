import { ICONS } from '../icons';

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
