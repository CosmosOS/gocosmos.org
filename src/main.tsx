import ReactDOM from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

// Production index.html ships prerendered markup (scripts/prerender.mjs);
// the dev server serves it empty, so fall back to a client-only render.
if (container.firstElementChild) {
  ReactDOM.hydrateRoot(container, <App />);
} else {
  ReactDOM.createRoot(container).render(<App />);
}
