import { useEffect, useState } from 'react';

type Gen = 'gen2' | 'gen3';

/** Shape returned by the GitHub /contributors endpoint (fields we use). */
interface ApiContributor {
  login?: string;
  html_url?: string;
  avatar_url?: string;
  contributions?: number;
  type?: string;
}

interface Contributor {
  login: string;
  html_url: string;
  avatar_url: string | null;
  contributions: number;
  gens: Set<Gen>;
}

const FALLBACK = [
  'zarlo', 'kumja1', 'Guillermo-Santos', 'valentinbreiz', 'ascpixi', 'ilobilo',
  'MishaProductions',
];

const REPOS: { slug: string; gen: Gen }[] = [
  { slug: 'CosmosOS/Cosmos', gen: 'gen2' },
  { slug: 'valentinbreiz/nativeaot-patcher', gen: 'gen3' },
];

function mergeContributors(results: { list: ApiContributor[]; gen: Gen }[]): Contributor[] {
  const byLogin = new Map<string, Contributor>();
  for (const { list, gen } of results) {
    if (!Array.isArray(list)) continue;
    for (const c of list) {
      if (!c || c.type === 'Bot' || !c.login) continue;
      const existing = byLogin.get(c.login);
      if (existing) {
        existing.contributions += c.contributions || 0;
        existing.gens.add(gen);
      } else {
        byLogin.set(c.login, {
          login: c.login,
          html_url: c.html_url ?? `https://github.com/${c.login}`,
          avatar_url: c.avatar_url ?? null,
          contributions: c.contributions || 0,
          gens: new Set([gen]),
        });
      }
    }
  }
  return Array.from(byLogin.values()).sort((a, b) => b.contributions - a.contributions);
}

export function Contributors() {
  const [list, setList] = useState<Contributor[] | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all(REPOS.map(({ slug, gen }) =>
      fetch(`https://api.github.com/repos/${slug}/contributors?per_page=100`)
        .then(r => (r.ok ? r.json() : []) as Promise<ApiContributor[]>)
        .catch(() => [] as ApiContributor[])
        .then(list => ({ list, gen }))
    )).then(results => {
      if (cancelled) return;
      const merged = mergeContributors(results);
      if (merged.length === 0) { setErrored(true); setList([]); }
      else setList(merged);
    });
    return () => { cancelled = true; };
  }, []);

  const display: Contributor[] = list && list.length > 0
    ? list
    : FALLBACK.map(login => ({
        login,
        html_url: `https://github.com/${login}`,
        avatar_url: null,
        contributions: 0,
        gens: new Set<Gen>(),
      }));

  return (
    <section className="section" id="contributors">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">// the people</div>
          <h2 className="cs-h1">Built by the community.</h2>
          <p className="section-sub" role="status">{errored
            ? 'Avatars couldn’t load — showing a snapshot. Live data returns when GitHub is reachable again.'
            : 'Pulled live from the Cosmos Gen2 and Gen3 histories.'}</p>
        </div>
        <div className="avatar-wall" data-reveal>
          {display.map((c, i) => {
            const isGen3 = c.gens.has('gen3');
            return (
              <a
                key={c.login + i}
                className={'avatar' + (isGen3 ? ' avatar-gen3' : '')}
                href={c.html_url}
                target="_blank"
                rel="noreferrer"
                // The label names the link (title alone is mouse-only and the
                // fallback initials would otherwise be the accessible name).
                aria-label={`${c.login} — GitHub profile${isGen3 ? ' (Gen3 contributor)' : ''}`}
                title={c.login + (isGen3 ? ' (Gen3 contributor)' : '')}
              >
                {c.avatar_url
                  ? <img src={c.avatar_url} alt="" loading="lazy" />
                  : <span className="avatar-fallback">{c.login.slice(0, 2).toUpperCase()}</span>}
                {isGen3 && <span className="avatar-badge" aria-hidden="true">G3</span>}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
