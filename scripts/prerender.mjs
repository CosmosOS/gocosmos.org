// Turns the built index.html into one prerendered page per locale: html/
// index.html (English), html/fr/index.html and html/zh/index.html, each with
// its own <html lang>, title, description, canonical and hreflang links. Then
// removes the throwaway SSR bundle. Runs as the last step of `npm run build`.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://gocosmos.org';
const root = fileURLToPath(new URL('..', import.meta.url));
const indexPath = `${root}html/index.html`;

const { render, LOCALES, STRINGS } = await import(new URL('../dist-ssr/entry-server.js', import.meta.url).href);

const marker = '<div id="root"></div>';
const template = readFileSync(indexPath, 'utf8');
for (const needle of [marker, '<html lang="en"', '<title>', '<meta name="description" content="', '</head>']) {
  if (!template.includes(needle)) throw new Error(`prerender: ${needle} not found in ${indexPath}`);
}

const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Every page lists every language (plus x-default → English) so search
// engines pair the three copies instead of indexing them as duplicates.
const alternates = LOCALES.map(l => `  <link rel="alternate" hreflang="${l.lang}" href="${SITE}${l.path}">`)
  .concat(`  <link rel="alternate" hreflang="x-default" href="${SITE}/">`)
  .join('\n');

for (const locale of LOCALES) {
  const { meta } = STRINGS[locale.code];
  const webfont = locale.webfont ? `  <link rel="stylesheet" href="${locale.webfont}">\n` : '';
  const head = `${webfont}  <link rel="canonical" href="${SITE}${locale.path}">\n${alternates}\n</head>`;
  const html = template
    .replace('<html lang="en"', `<html lang="${locale.lang}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(meta.description)}">`)
    .replace('</head>', head)
    .replace(marker, `<div id="root">${render(locale.code)}</div>`);
  const out = `${root}html${locale.path}index.html`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log(`prerender: ${locale.code} → ${out.slice(root.length)}`);
}
rmSync(`${root}dist-ssr`, { recursive: true, force: true });
