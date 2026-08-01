import './styles/colors_and_type.css';
import './styles/styles.css';

import { useReveal } from './hooks/useReveal';
import { useGlassGlare } from './hooks/useGlassGlare';
import { Starfield } from './components/Starfield';
import { Ufo } from './components/Ufo';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Timeline } from './components/Timeline';
import { Contributors } from './components/Contributors';
import { Community } from './components/Community';
import { Footer } from './components/Footer';

export function App() {
  useReveal();
  useGlassGlare();
  return (
    <>
      <Starfield />
      <Ufo />
      <Nav />
      <main>
        <Hero />
        <Features />
        <Timeline />
        <Contributors />
        <Community />
      </main>
      <Footer />
    </>
  );
}
