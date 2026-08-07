import './styles/colors_and_type.css';
import './styles/styles.css';

import { useReveal } from './hooks/useReveal';
import { useGlassLight } from './hooks/useGlassLight';
import { Starfield } from './components/Starfield';
import { Ufo } from './components/Ufo';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Timeline } from './components/Timeline';
import { Contributors } from './components/Contributors';
import { Projects } from './components/Projects';
import { Community } from './components/Community';
import { Footer } from './components/Footer';

export function App() {
  useReveal();
  useGlassLight();
  return (
    <>
      <a className="skip-link glass" href="#main">Skip to content</a>
      <Starfield />
      <Ufo />
      <Nav />
      <main id="main">
        <Hero />
        <Features />
        <Projects />
        <Timeline />
        <Contributors />
        <Community />
      </main>
      <Footer />
    </>
  );
}
