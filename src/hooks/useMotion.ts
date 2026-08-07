import { useSyncExternalStore } from 'react';

export type MotionPref = 'on' | 'off';

const STORAGE_KEY = 'cosmos-motion';
const EVT = 'cosmos-motionchange';

/* One source of truth for "should things move?": the OS reduced-motion
   preference, overridable both ways by the nav pause toggle (data-motion on
   <html>, restored pre-paint by the inline script in index.html — same
   pattern as the theme). The CSS kill switches in colors_and_type.css /
   styles.css key off the same attribute and media query. */

function osReduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when animations should not run right now. */
export function motionOff(): boolean {
  if (typeof window === 'undefined') return true;
  const explicit = document.documentElement.dataset.motion;
  if (explicit === 'off') return true;
  if (explicit === 'on') return false;
  return osReduced();
}

export function subscribeMotion(cb: () => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  window.addEventListener(EVT, cb);
  return () => {
    mq.removeEventListener('change', cb);
    window.removeEventListener(EVT, cb);
  };
}

/** Reactive motionOff() — a dependency for the Starfield/Ufo/glass effects,
 *  so flipping the toggle (or the OS setting) tears them down or restarts
 *  them without a reload. */
export function useMotionOff(): boolean {
  return useSyncExternalStore(subscribeMotion, motionOff, () => true);
}

/** Nav toggle: reflects the effective state, writes an explicit override. */
export function useMotionToggle() {
  const off = useSyncExternalStore(subscribeMotion, motionOff, () => false);
  const setOff = (v: boolean) => {
    document.documentElement.dataset.motion = v ? 'off' : 'on';
    try {
      localStorage.setItem(STORAGE_KEY, v ? 'off' : 'on');
    } catch {}
    window.dispatchEvent(new Event(EVT));
  };
  return [off, setOff] as const;
}
