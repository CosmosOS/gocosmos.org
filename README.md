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
npm run build      # tsc --noEmit + vite build → html/
docker compose up -d
```

`html/` is generated — never edit it by hand (it is gitignored). Sources live
in `src/`, static assets in `public/assets/`.

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
