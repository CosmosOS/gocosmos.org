# gocosmos.org

React 18 + TypeScript + Vite. The Docker container (php:8.2-apache) serves the
static build output from `html/`.

## Develop

```bash
npm install
npm run dev        # Vite dev server with HMR
```

## Build & deploy

```bash
npm run build      # fetch projects + tsc --noEmit + vite build + prerender → html/
docker compose up -d
```

`html/` is generated — never edit it by hand (it is gitignored). Sources live
in `src/`, static assets in `public/assets/`.

## Build-time GitHub data

Visitors never call api.github.com: its unauthenticated limits (60 requests
per hour, 10 searches per minute, per IP) would empty the page for everyone
after the first few visits. Two scripts bake the data into `src/data/` instead:

- `npm run projects` (`scripts/fetch-projects.mjs`, also the first step of
  `npm run build`) writes `projects.json`: every repository under the
  `cosmos-os`, `cosmosos` or `cosmos-gen3` topic, most starred first. When
  GitHub is unreachable the committed file stands in, with a warning.
- `npm run contributors` (`scripts/fetch-contributors.mjs`) writes
  `contributors.json` from the gen2 and gen3 commit history. It needs ~140
  requests, so run it with `GITHUB_TOKEN=...`; it is not part of the build.

Both files are committed so a fresh clone builds offline.

## Languages

The site is served in English (`/`), French (`/fr/`) and Simplified Chinese
(`/zh/`). Every visible string lives in `src/i18n/<locale>.ts`, typed by
`src/i18n/types.ts` so a missing translation fails `tsc`. `scripts/prerender.mjs`
writes one prerendered `index.html` per locale with its own `<html lang>`,
title, description, canonical and `hreflang` links; there is no automatic
redirect, the visitor picks a language from the nav or footer switcher.
Terminal output (prompts, commands, readout keys) stays as the shell prints it.
The dev server serves `/fr/` and `/zh/` from the English template and the
client picks the locale from the URL, so translations can be previewed with
`npm run dev` too.
