import { useEffect, type RefObject } from 'react';

/**
 * Keeps a terminal block's height fixed while its .term-row descriptions
 * open and close, so an expanding row never pushes the page below it.
 *
 * The `cosmos --info` readout gets this for free on wide screens: its art
 * column is taller than the spec list, so a spec opening inside it never
 * changes the block's height. The other readouts have no such column, so
 * this pins the block's min-height to its tallest layout with one row open.
 * Rows inside the block still slide down into that reserve, exactly as the
 * specs do next to the art.
 *
 * Measured on a hidden clone (transitions off, each row opened in turn), so
 * the live rows never flicker. The hover CSS keeps at most one row open at
 * a time, which is what makes a one-row reserve enough. Re-measured when
 * the block's width changes (text rewraps) and once the web fonts land.
 */
export function useSteadyHeight(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const block = ref.current;
    if (!block) return;
    let alive = true;

    const measure = () => {
      const parent = block.parentElement;
      if (!alive || !parent) return;
      const clone = block.cloneNode(true) as HTMLElement;
      clone.classList.add('term-measure');
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('inert', '');
      // Same box as the block (same class, same box-sizing), out of flow.
      clone.style.cssText = `position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;width:${getComputedStyle(block).width}`;
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      const rows = Array.from(clone.querySelectorAll<HTMLElement>('.term-row'));
      rows.forEach(row => row.removeAttribute('data-open'));
      parent.appendChild(clone);
      let tallest = clone.getBoundingClientRect().height;
      for (const row of rows) {
        row.setAttribute('data-open', '');
        tallest = Math.max(tallest, clone.getBoundingClientRect().height);
        row.removeAttribute('data-open');
      }
      clone.remove();
      block.style.minHeight = `${Math.ceil(tallest)}px`;
    };

    // Width only: the block's own height changes when min-height is set.
    let width = -1;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w !== width) { width = w; measure(); }
    });
    ro.observe(block);
    document.fonts?.ready.then(measure);
    return () => { alive = false; ro.disconnect(); };
  }, [ref]);
}
