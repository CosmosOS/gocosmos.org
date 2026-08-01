import { useEffect, useState } from 'react';
import { ICONS } from '../icons';
import { useTheme } from '../hooks/useTheme';
import { VortexLabel } from './VortexLabel';

export function Nav() {
  const [theme, setTheme] = useTheme();
  // The page's only "Get started": the hero deliberately has none, so the
  // button slides into the nav once the visitor scrolls past the hero CTA
  // row. False on the server too: every visit starts at the top of the page
  // with that row on screen.
  const [ctaShown, setCtaShown] = useState(false);

  useEffect(() => {
    const heroCtas = document.querySelector('.hero-ctas');
    if (!heroCtas) {
      setCtaShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => setCtaShown(!entry.isIntersecting),
      // The row is already unreadable once it slides under the nav pill
      // (12px offset + 56px height) — treat that band as off-screen.
      { rootMargin: '-80px 0px 0px 0px' },
    );
    io.observe(heroCtas);
    return () => io.disconnect();
  }, []);

  return (
    <header className="nav">
      <div className="nav-inner glass">
        <a className="nav-brand" href="#top">
          <img src="/assets/cosmos-logo.png" alt="Cosmos" />
        </a>
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#timeline">History</a>
          <a href="#community">Community</a>
        </nav>
        <div className="nav-actions">
          {/* Both icons are always in the markup and CSS picks one via [data-theme],
              so the prerendered HTML matches on hydration whatever the stored theme. */}
          <button className="icon-btn theme-toggle" aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <span className="icon-sun">{ICONS.sun}</span>
            <span className="icon-moon">{ICONS.moon}</span>
          </button>
          <a className="btn btn-secondary glass" href="https://github.com/valentinbreiz/nativeaot-patcher" target="_blank" rel="noreferrer">
            {ICONS.github}<span>GitHub</span>
          </a>
          <div className={`nav-cta${ctaShown ? ' is-visible' : ''}`}>
            <div className="nav-cta-inner">
              <a className="btn btn-primary" href="https://valentinbreiz.github.io/nativeaot-patcher/index.html" target="_blank" rel="noreferrer">
                <VortexLabel text="Get started" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
