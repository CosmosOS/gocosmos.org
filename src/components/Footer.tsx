import { LOCALES, useI18n } from '../i18n';

export function Footer() {
  const { t, locale } = useI18n();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <img src="/assets/cosmos-logo.png" alt="Cosmos" />
          <p className="footer-tagline">{t.footer.tagline}</p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>{t.footer.project}</h4>
            <a href="#features">{t.footer.features}</a>
            <a href="#projects">{t.footer.projects}</a>
            <a href="#timeline">{t.footer.history}</a>
          </div>
          <div>
            <h4>{t.footer.community}</h4>
            <a href="https://github.com/CosmosOS/Cosmos/tree/gen3" target="_blank" rel="noreferrer">{t.footer.github}</a>
            <a href="https://github.com/CosmosOS/Cosmos/issues" target="_blank" rel="noreferrer">{t.footer.issues}</a>
            <a href="https://github.com/users/valentinbreiz/projects/2/views/2" target="_blank" rel="noreferrer">{t.footer.board}</a>
          </div>
          <div>
            <h4>{t.footer.resources}</h4>
            <a href="https://cosmosos.github.io/" target="_blank" rel="noreferrer">{t.footer.docs}</a>
            <a href="https://valentin.bzh/posts/3" target="_blank" rel="noreferrer">{t.footer.article}</a>
            <a href="https://github.com/CosmosOS/Cosmos" target="_blank" rel="noreferrer">{t.footer.gen2}</a>
          </div>
        </div>
      </div>
      <div className="container footer-fine">
        {/* The licence line is the same in every language: a legal notice,
            not copy. */}
        <span>BSD 3-Clause · © 2007-2026, CosmosOS, COSMOS Project and Cosmos contributors</span>
        <span className="footer-fine-right">
          {/* Second copy of the nav switcher: the nav hides its own under
              480px, this one is reachable at every width. */}
          <nav className="lang-switch" aria-label={t.nav.language}>
            {LOCALES.map(l => (
              <a key={l.code} href={l.path} hrefLang={l.lang} lang={l.lang} aria-label={l.name} aria-current={l.code === locale ? 'page' : undefined}>
                {l.label}
              </a>
            ))}
          </nav>
          <span>Gen3</span>
        </span>
      </div>
    </footer>
  );
}
