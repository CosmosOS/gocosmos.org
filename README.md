# gocosmos.org — Cosmos marketing site

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
