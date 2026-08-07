import { useEffect } from 'react';

/** Adds .is-visible to [data-reveal] elements as they scroll into view. */
export function useReveal(): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
    // Keyboard: tabbing into a block that hasn't scrolled into view yet must
    // reveal it — focus must never land on an invisible element.
    const onFocusIn = (e: FocusEvent) => {
      const el = (e.target as Element).closest?.('[data-reveal]');
      if (el && !el.classList.contains('is-visible')) {
        el.classList.add('is-visible');
        io.unobserve(el);
      }
    };
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      io.disconnect();
    };
  }, []);
}
