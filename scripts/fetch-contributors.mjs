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
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/data/contributors.json', import.meta.url));

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
/** CodePlex-era imports landed as "kudzu_cp" etc.; same human as "Kudzu". */
const normName = n => (n || '').trim().toLowerCase().replace(/_cp$/, '');

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
  }

  // Pass 2 — tally per generation against the resolved identity.
  const people = new Map();
  for (const { c, gen } of commits) {
    const name = c.commit?.author?.name;
    const email = c.commit?.author?.email?.toLowerCase();
    let login = c.author?.login;
    if (!login && email) login = byEmail.get(email);
    if (!login) login = byName.get(normName(name));
    if (login && BOT.test(login)) continue;
    if (!login && (BOT.test(name || '') || !name)) continue;

    // Unlinked CodePlex-era authors have no GitHub account to point at; they
    // still built Gen2, so they stay on the wall under their git name.
    const key = login ? `@${login}` : `name:${normName(name)}`;
    let person = people.get(key);
    if (!person) {
      const account = login ? accounts.get(login) : null;
      person = {
        login: login || name.replace(/_cp$/, ''),
        linked: Boolean(login),
        html_url: account?.html_url || (login ? `https://github.com/${login}` : null),
        avatar_url: account?.avatar_url || null,
        gen2: 0,
        gen3: 0,
      };
      people.set(key, person);
    }
    person[gen] += 1;
  }

  const contributors = [...people.values()]
    .map(p => ({ ...p, contributions: p.gen2 + p.gen3 }))
    .sort((a, b) => b.contributions - a.contributions || a.login.localeCompare(b.login));

  mkdirSync(fileURLToPath(new URL('../src/data', import.meta.url)), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify({
    generatedAt: new Date().toISOString().slice(0, 10),
    contributors,
  }, null, 2)}\n`);

  const g2 = contributors.filter(p => p.gen2 > 0).length;
  const g3 = contributors.filter(p => p.gen3 > 0).length;
  console.log(`\ncontributors: ${contributors.length} total — ${g2} Gen2, ${g3} Gen3, ` +
    `${contributors.filter(p => !p.linked).length} without a GitHub account`);
}

await main();
