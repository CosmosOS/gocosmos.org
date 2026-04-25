/* global React, ICONS, useTheme */
function Nav() {
  const [theme, setTheme] = useTheme();
  return (
    <header className="nav">
      <div className="nav-inner">
        <a className="nav-brand" href="#top">
          <img src="assets/cosmos-logo.png" alt="Cosmos" />
        </a>
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#timeline">History</a>
          <a href="#start">Get started</a>
          <a href="#community">Community</a>
        </nav>
        <div className="nav-actions">
          <button className="icon-btn" aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? ICONS.sun : ICONS.moon}
          </button>
          <a className="btn btn-secondary" href="https://github.com/valentinbreiz/nativeaot-patcher" target="_blank" rel="noreferrer">
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
window.Nav = Nav;
