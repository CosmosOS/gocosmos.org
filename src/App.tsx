import './styles/colors_and_type.css';
import './styles/styles.css';

import { useReveal } from './hooks/useReveal';
import { useGlassLight } from './hooks/useGlassLight';
import { I18nProvider, STRINGS, type Locale } from './i18n';
import { Starfield } from './components/Starfield';
import { Ufo } from './components/Ufo';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Timeline } from './components/Timeline';
import { Contributors } from './components/Contributors';
import { Projects } from './components/Projects';
import { Footer } from './components/Footer';

export function App({ locale }: { locale: Locale }) {
  useReveal();
  useGlassLight();
  const t = STRINGS[locale];
  return (
    <I18nProvider value={locale}>
      <a className="skip-link glass" href="#main">{t.nav.skip}</a>
      <Starfield />
      <Ufo />
      <Nav />
      <main id="main">
        <Hero />
        <Features />
        <Projects />
        <Timeline />
        <Contributors />
      </main>
      <Footer />
    </I18nProvider>
  );
}
