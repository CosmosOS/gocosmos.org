// Builds src/data/contributors.json — the avatar wall's data, baked in at
// build time so visitors never touch api.github.com (60 req/hour per IP
// unauthenticated: a handful of visitors would exhaust it and the wall would
// fall back to the hardcoded snapshot for everyone else).
//
// Why commits and not /repos/{slug}/contributors: that endpoint reports the
// DEFAULT branch from a cache GitHub recomputes on its own schedule. Cosmos
// flipped its default from gen3 back to gen2, and the cache still answers with
// the gen3 list — 15 people, none of the Gen2 era. Walking each branch's
// commits is branch-accurate and picks up all 224 Gen2 authors.
//
// Usage: GITHUB_TOKEN=... node scripts/fetch-contributors.mjs
// Without a token the API allows 60 requests/hour and this needs ~140.
import { writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/data/contributors.json', import.meta.url));
const AVATAR_DIR = fileURLToPath(new URL('../public/assets/avatars/', import.meta.url));

// Branch-scoped: `ref` is what separates the two generations inside the one
// Cosmos repo. valentinbreiz/nativeaot-patcher (where Gen3 began) is NOT
// listed: its main branch is the same commit history as gen3, down to an
// identical HEAD, so including it just counted every Gen3 author twice.
const SOURCES = [
  { repo: 'CosmosOS/Cosmos', ref: 'gen2', gen: 'gen2' },
  { repo: 'CosmosOS/Cosmos', ref: 'gen3', gen: 'gen3' },
];

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const HEADERS = {
  accept: 'application/vnd.github+json',
  'user-agent': 'gocosmos.org-build',
  ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
};

async function api(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: HEADERS });
    // Secondary rate limit / abuse detection asks us to back off; honour it
    // rather than hammering and getting the build's IP blocked outright.
    if (res.status === 403 || res.status === 429) {
      const reset = Number(res.headers.get('x-ratelimit-reset') || 0) * 1000;
      const retryAfter = Number(res.headers.get('retry-after') || 0) * 1000;
      const waitMs = retryAfter || (reset ? Math.max(reset - Date.now(), 0) : 0);
      if (waitMs > 0 && waitMs < 120_000) {
        console.warn(`  rate limited, waiting ${Math.ceil(waitMs / 1000)}s…`);
        await new Promise(r => setTimeout(r, waitMs + 1000));
        continue;
      }
    }
    if (res.status >= 500) {
      await new Promise(r => setTimeout(r, 500 * 2 ** attempt));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
    return { body: await res.json(), link: res.headers.get('link') || '' };
  }
  throw new Error(`giving up after retries — ${url}`);
}

/** Last page number from the Link header, so pages can be fetched in parallel. */
function lastPage(link) {
  const match = link.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/);
  return match ? Number(match[1]) : 1;
}

async function fetchCommits({ repo, ref, gen }) {
  const base = `https://api.github.com/repos/${repo}/commits?sha=${encodeURIComponent(ref)}&per_page=100`;
  const first = await api(`${base}&page=1`);
  const pages = lastPage(first.link);
  const all = [...first.body];
  // Four at a time: fast enough without tripping GitHub's secondary limits.
  for (let page = 2; page <= pages; page += 4) {
    const batch = [];
    for (let i = page; i < page + 4 && i <= pages; i++) batch.push(api(`${base}&page=${i}`));
    for (const r of await Promise.all(batch)) all.push(...r.body);
  }
  console.log(`  ${repo}@${ref} → ${all.length} commits (${pages} pages) [${gen}]`);
  return all;
}

const BOT = /\[bot\]$|^copilot(-|$)/i;
/**
 * CodePlex-era imports landed as "kudzu_cp" etc.; same human as "Kudzu".
 * Some authors also committed with an email as their name — keep only the
 * local part, both to match the account and so no address can reach the page.
 */
const normName = n => (n || '').trim().toLowerCase().replace(/_cp$/, '').replace(/@.*$/, '');
/** Punctuation-free form, so "charles.betros" finds the @charlesbetros account. */
const compact = n => normName(n).replace(/[^a-z0-9]/g, '');
/** Last guard: an email must never become a display name on the page. */
const displayName = n => (n || '').replace(/@.*$/, '').replace(/_cp$/, '').trim();

/**
 * Every avatar slot gets an image, including the authors GitHub never linked
 * to an account.
 *
 * GitHub cannot supply one for them. Its identicon is drawn from an account
 * id, so with no account there is nothing to draw: the public fallback
 * (avatars.githubusercontent.com/u/e?email=...) answers with one generic grey
 * placeholder for every identity it cannot resolve — tried it, and 76 of
 * these 82 came back byte-identical. Hot-linking it would also have put the
 * hashed identity in the page, and for 25 of these authors that identity is a
 * personal email address.
 *
 * So the identicon is drawn here instead: a GitHub-style 5x5 grid, mirrored
 * down the middle, cells and hue taken from a digest of the person's identity.
 * Deterministic (the same person keeps their avatar across builds), unique per
 * person, and it costs no request at build time or in the browser.
 */
/** HSL to #rrggbb, so the identicon needs no CSS Color 4 support to render. */
function hslHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}

function writeIdenticons(people) {
  const targets = people.filter(p => !p.avatar_url);
  if (targets.length === 0) return;
  mkdirSync(AVATAR_DIR, { recursive: true });

  const wanted = new Set();
  for (const person of targets) {
    const digest = createHash('sha256').update(person.seed || person.login).digest();

    // Muted mid-tone: legible on --bg-3 in both themes without competing with
    // the cream accent. Saturation and lightness are fixed; only hue varies.
    // Emitted as hex, not hsl(): the space-separated CSS Color 4 form is not
    // understood by older browsers or by SVG rasterisers.
    const fill = hslHex(((digest[0] << 8) | digest[1]) % 360, 0.38, 0.62);

    // Left three columns come from the digest, then mirror for a symmetric
    // face — the same construction GitHub uses.
    let cells = '';
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 3; x++) {
        if ((digest[2 + y * 3 + x] & 1) === 0) continue;
        cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
        if (x < 2) cells += `<rect x="${4 - x}" y="${y}" width="1" height="1"/>`;
      }
    }
    // viewBox is inset by half a cell so the pattern sits inside the circular
    // crop the avatar applies, rather than being clipped at the corners.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 6 6" `
      + `width="120" height="120" shape-rendering="crispEdges">`
      + `<g fill="${fill}">${cells}</g></svg>`;

    const slug = person.login.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
    const file = `${slug || 'contributor'}-${digest.toString('hex').slice(0, 8)}.svg`;
    writeFileSync(`${AVATAR_DIR}${file}`, svg);
    person.avatar_url = `/assets/avatars/${file}`;
    wanted.add(file);
  }

  // Drop identicons for authors no longer in the history (a rewritten branch,
  // an account that got linked since) so the directory cannot grow forever.
  for (const file of readdirSync(AVATAR_DIR)) {
    if (!wanted.has(file)) rmSync(`${AVATAR_DIR}${file}`);
  }
  console.log(`  identicons: ${wanted.size} generated into public/assets/avatars/`);
}

async function main() {
  if (!TOKEN) console.warn('No GITHUB_TOKEN — 60 req/hour, this will likely fail.\n');

  const commits = [];
  for (const source of SOURCES) {
    for (const c of await fetchCommits(source)) commits.push({ c, gen: source.gen });
  }

  // Pass 1 — learn which git identities GitHub has already linked to accounts,
  // so the same human's unlinked commits can be folded into the same entry.
  const byEmail = new Map();
  const byName = new Map();
  const byCompact = new Map();
  const accounts = new Map();
  for (const { c } of commits) {
    const login = c.author?.login;
    if (!login || BOT.test(login)) continue;
    accounts.set(login, {
      login,
      html_url: c.author.html_url || `https://github.com/${login}`,
      avatar_url: c.author.avatar_url || null,
    });
    const email = c.commit?.author?.email?.toLowerCase();
    if (email) byEmail.set(email, login);
    const name = normName(c.commit?.author?.name);
    if (name && !byName.has(name)) byName.set(name, login);
  }
  // The login itself is a name an unlinked commit may have been authored
  // under: "mterwoord_cp" from the CodePlex import is the @mterwoord who
  // later committed as "Matthijs ter Woord". Without this the same person
  // lands on the wall twice, once linked and once not.
  for (const login of accounts.keys()) {
    const key = normName(login);
    if (key && !byName.has(key)) byName.set(key, login);
    const tight = compact(login);
    if (tight && !byCompact.has(tight)) byCompact.set(tight, login);
  }

  // Pass 2 — tally per generation against the resolved identity.
  const people = new Map();
  for (const { c, gen } of commits) {
    const name = c.commit?.author?.name;
    const email = c.commit?.author?.email?.toLowerCase();
    let login = c.author?.login;
    if (!login && email) login = byEmail.get(email);
    if (!login) login = byName.get(normName(name));
    if (!login) login = byCompact.get(compact(name));
    if (login && BOT.test(login)) continue;
    if (!login && (BOT.test(name || '') || !name)) continue;

    // Unlinked CodePlex-era authors have no GitHub account to point at; they
    // still built Gen2, so they stay on the wall under their git name. Key
    // them on the email rather than that name: the same person shows up under
    // several spellings ("Freddie" and "Freddie Poser" on one address), and
    // the CodePlex import gave each author a stable synthetic address, so the
    // email is the steadier identity of the two.
    const key = login ? `@${login}` : email ? `email:${email}` : `name:${normName(name)}`;
    let person = people.get(key);
    if (!person) {
      const account = login ? accounts.get(login) : null;
      person = {
        login: login || displayName(name),
        linked: Boolean(login),
        html_url: account?.html_url || (login ? `https://github.com/${login}` : null),
        avatar_url: account?.avatar_url || null,
        // What GitHub hashes to draw the identicon for an unlinked commit, so
        // the avatar here matches the one on the commit page. The CodePlex
        // import left an opaque hash in the email field for most of them;
        // GitHub hashes that just the same. Never written to the JSON.
        seed: email || normName(name),
        gen2: 0,
        gen3: 0,
      };
      people.set(key, person);
    } else if (!person.linked) {
      // "Freddie" then "Freddie Poser" — prefer the fuller spelling.
      const candidate = displayName(name);
      if (candidate.length > person.login.length) person.login = candidate;
    }
    person[gen] += 1;
  }

  const ranked = [...people.values()]
    .map(p => ({ ...p, contributions: p.gen2 + p.gen3 }))
    .sort((a, b) => b.contributions - a.contributions || a.login.localeCompare(b.login));

  writeIdenticons(ranked);

  // seed is a build-time detail — for 25 of these authors it is a personal
  // email address, and the JSON ships to the browser. Drop it here.
  const contributors = ranked.map(({ seed, ...rest }) => rest);

  mkdirSync(fileURLToPath(new URL('../src/data', import.meta.url)), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify({
    generatedAt: new Date().toISOString().slice(0, 10),
    contributors,
  }, null, 2)}\n`);

  const g2 = contributors.filter(p => p.gen2 > 0).length;
  const g3 = contributors.filter(p => p.gen3 > 0).length;
  console.log(`\ncontributors: ${contributors.length} total — ${g2} Gen2, ${g3} Gen3, ` +
    `${contributors.filter(p => !p.linked).length} without a GitHub account, ` +
    `${contributors.filter(p => !p.avatar_url).length} without any avatar`);
}

await main();
