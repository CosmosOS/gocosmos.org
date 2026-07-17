import ReactDOM from 'react-dom/client';

import './styles/colors_and_type.css';
import './styles/styles.css';

import { useReveal } from './hooks/useReveal';
import { Starfield } from './components/Starfield';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Timeline } from './components/Timeline';
import { GettingStarted } from './components/GettingStarted';
import { Projects } from './components/Projects';
import { Contributors } from './components/Contributors';
import { Community } from './components/Community';
import { Footer } from './components/Footer';

function App() {
  useReveal();
  return (
    <>
      <Starfield />
      <Nav />
      <main>
        <Hero />
        <Features />
        <Timeline />
        <GettingStarted />
        <Projects />
        <Contributors />
        <Community />
      </main>
      <Footer />
    </>
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');
ReactDOM.createRoot(container).render(<App />);
