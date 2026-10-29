import ReactDOM from 'react-dom/client';
import { App } from './App';
import { localeFromPath, localeInfo } from './i18n';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

// The locale is the URL: / is English, /fr/ and /zh/ the translations. The
// prerendered pages were rendered with the same rule, so hydration matches.
const locale = localeFromPath(window.location.pathname);
// The dev server answers /fr/ and /zh/ with the root index.html (lang="en",
// no locale webfont); production pages already carry both.
const { lang, webfont } = localeInfo(locale);
if (document.documentElement.lang !== lang) document.documentElement.lang = lang;
if (webfont && !document.querySelector(`link[href="${webfont}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = webfont;
  document.head.appendChild(link);
}

// Production index.html ships prerendered markup (scripts/prerender.mjs);
// the dev server serves it empty, so fall back to a client-only render.
if (container.firstElementChild) {
  ReactDOM.hydrateRoot(container, <App locale={locale} />);
} else {
  ReactDOM.createRoot(container).render(<App locale={locale} />);
}
