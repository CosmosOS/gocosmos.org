// Injects the server-rendered app into the built index.html, then removes the
// throwaway SSR bundle. Runs as the last step of `npm run build`.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const indexPath = `${root}html/index.html`;

const { render } = await import(new URL('../dist-ssr/entry-server.js', import.meta.url).href);

const marker = '<div id="root"></div>';
const html = readFileSync(indexPath, 'utf8');
if (!html.includes(marker)) {
  throw new Error(`prerender: ${marker} not found in ${indexPath}`);
}
writeFileSync(indexPath, html.replace(marker, `<div id="root">${render()}</div>`));
rmSync(`${root}dist-ssr`, { recursive: true, force: true });
console.log('prerender: injected server-rendered markup into html/index.html');
