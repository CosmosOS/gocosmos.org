// Builds src/data/projects.json — the Featured projects list, baked in at
// build time so visitors never touch api.github.com. The search endpoint
// allows 10 requests/minute per IP unauthenticated: a classroom opening the
// page at once would have emptied the list for everyone after the first few.
//
// Runs as the first step of `npm run build`. When GitHub cannot be reached
// the committed JSON stands in (warning, not failure), so an offline build
// still ships the last known list.
//
// Usage: [GITHUB_TOKEN=...] node scripts/fetch-projects.mjs
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/data/projects.json', import.meta.url));

// Every topic a Cosmos project has been published under. `topic:` is the
// exact qualifier (an `in:topics` text match also catches unrelated repos
// whose topics merely contain the word).
const TOPICS = ['cosmos-os', 'cosmosos', 'cosmos-gen3'];
// This is the official site — the framework itself is not a community project.
const EXCLUDE = new Set(['cosmosos/cosmos']);

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const HEADERS = {
  accept: 'application/vnd.github+json',
  'user-agent': 'gocosmos.org-build',
  ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
};

async function api(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: HEADERS });
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
    return res.json();
  }
  throw new Error(`giving up after retries — ${url}`);
}

/** Every repository carrying the topic (the search API pages at 100, caps at 1000). */
async function searchTopic(topic) {
  const items = [];
  for (let page = 1; page <= 10; page++) {
    const q = encodeURIComponent(`topic:${topic}`);
    const body = await api(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=100&page=${page}`);
    items.push(...(body.items ?? []));
    if (items.length >= (body.total_count ?? 0) || (body.items ?? []).length < 100) break;
  }
  console.log(`  topic:${topic} → ${items.length} repos`);
  return items;
}

async function main() {
  let found;
  try {
    found = [];
    for (const topic of TOPICS) found.push(...await searchTopic(topic));
  } catch (err) {
    if (existsSync(OUT)) {
      console.warn(`projects: GitHub unreachable (${err.message}); keeping the committed ${OUT}`);
      return;
    }
    throw err;
  }

  // One entry per repository whatever the number of topics it matched.
  const bySlug = new Map();
  for (const repo of found) {
    if (!repo?.name || !repo.owner?.login) continue;
    const slug = repo.full_name?.toLowerCase() ?? `${repo.owner.login}/${repo.name}`.toLowerCase();
    if (EXCLUDE.has(slug) || bySlug.has(slug)) continue;
    bySlug.set(slug, {
      owner: repo.owner.login,
      name: repo.name,
      html_url: repo.html_url ?? `https://github.com/${repo.owner.login}/${repo.name}`,
      description: (repo.description ?? '').trim(),
      stars: repo.stargazers_count ?? 0,
      // The cosmos topics are implied by being listed; the first three others
      // tell what the project is about.
      topics: (repo.topics ?? []).filter(t => !t.includes('cosmos')).slice(0, 3),
    });
  }

  const projects = [...bySlug.values()]
    .sort((a, b) => b.stars - a.stars || `${a.owner}/${a.name}`.localeCompare(`${b.owner}/${b.name}`));

  mkdirSync(fileURLToPath(new URL('../src/data', import.meta.url)), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify({
    generatedAt: new Date().toISOString().slice(0, 10),
    projects,
  }, null, 2)}\n`);
  console.log(`\nprojects: ${projects.length} repos, ${projects.filter(p => p.stars === 0).length} with no stars, `
    + `${projects.filter(p => !p.description).length} without a description`);
}

await main();
