import { ICONS } from '../icons';
import { useTheme } from '../hooks/useTheme';

export function Nav() {
  const [theme, setTheme] = useTheme();
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
          <a className="btn btn-primary" href="https://valentinbreiz.github.io/nativeaot-patcher/index.html" target="_blank" rel="noreferrer">
            <span>Get started</span>{ICONS.arrow}
          </a>
        </div>
      </div>
    </header>
  );
}
