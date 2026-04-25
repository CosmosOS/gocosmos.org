/* global React */
const { useEffect, useState } = React;

const FALLBACK = [
  'zarlo', 'kumja1', 'Guillermo-Santos', 'valentinbreiz', 'ascpixi', 'ilobilo',
  'MishaProductions', 'placeholder1', 'placeholder2', 'placeholder3', 'placeholder4', 'placeholder5',
];

const REPOS = [
  { slug: 'CosmosOS/Cosmos', gen: 'gen2' },
  { slug: 'valentinbreiz/nativeaot-patcher', gen: 'gen3' },
];

function mergeContributors(results) {
  const byLogin = new Map();
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
          html_url: c.html_url,
          avatar_url: c.avatar_url,
          contributions: c.contributions || 0,
          gens: new Set([gen]),
        });
      }
    }
  }
  return Array.from(byLogin.values()).sort((a, b) => b.contributions - a.contributions);
}

function Contributors() {
  const [list, setList] = useState(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all(REPOS.map(({ slug, gen }) =>
      fetch(`https://api.github.com/repos/${slug}/contributors?per_page=100`)
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
        .then(list => ({ list, gen }))
    )).then(results => {
      if (cancelled) return;
      const merged = mergeContributors(results);
      if (merged.length === 0) { setErrored(true); setList([]); }
      else setList(merged);
    });
    return () => { cancelled = true; };
  }, []);

  const display = list && list.length > 0
    ? list
    : FALLBACK.map(login => ({ login, html_url: `https://github.com/${login}`, avatar_url: null, gens: new Set() }));

  return (
    <section className="section" id="contributors">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">// the people</div>
          <h2 className="cs-h1">Built by the community.</h2>
          <p className="section-sub">{errored
            ? 'Avatars couldn’t load — placeholder grid below. Live on the marketing site.'
            : 'Pulled live from the Cosmos (Gen2) and nativeaot-patcher (Gen3) repos. Click to visit a profile.'}</p>
        </div>
        <div className="avatar-wall" data-reveal>
          {display.map((c, i) => {
            const isGen3 = c.gens && c.gens.has('gen3');
            return (
              <a
                key={c.login + i}
                className={'avatar' + (isGen3 ? ' avatar-gen3' : '')}
                href={c.html_url}
                target="_blank"
                rel="noreferrer"
                title={c.login + (isGen3 ? ' (Gen3 contributor)' : '')}
              >
                {c.avatar_url
                  ? <img src={c.avatar_url} alt={c.login} loading="lazy" />
                  : <span className="avatar-fallback">{c.login.slice(0, 2).toUpperCase()}</span>}
                {isGen3 && <span className="avatar-badge" aria-label="Gen3 contributor">G3</span>}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
window.Contributors = Contributors;
