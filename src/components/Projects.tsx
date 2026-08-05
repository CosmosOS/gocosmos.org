import { useEffect, useState } from 'react';
import { ICONS } from '../icons';

type Gen = 'gen2' | 'gen3';

/** Shape returned by the GitHub /search/repositories endpoint (fields we use). */
interface ApiRepo {
  full_name?: string;
  name?: string;
  owner?: { login?: string };
  html_url?: string;
  description?: string | null;
  stargazers_count?: number;
  topics?: string[];
}

interface Project {
  owner: string;
  name: string;
  html_url: string;
  description: string;
  stars: number;
  topics: string[];
  gens: Set<Gen>;
}

const MAX_PROJECTS = 12;

const SEARCHES: { q: string; gen: Gen }[] = [
  { q: 'cosmos-os in:topics OR cosmosos in:topics', gen: 'gen2' },
  // No Gen3 project has published yet — repos tagged cosmos-gen3 show up here
  // automatically once they do.
  { q: 'cosmos-gen3 in:topics', gen: 'gen3' },
];

const PINNED: { slug: string; gen: Gen }[] = [
  { slug: 'valentinbreiz/nativeaot-patcher', gen: 'gen3' },
];

const FALLBACK: Project[] = ([
  { owner: 'valentinbreiz', name: 'nativeaot-patcher', description: 'POC of CosmosOS gen3', stars: 120, topics: ['dotnet', 'nativeaot', 'kernel'], gens: new Set<Gen>(['gen3']) },
  { owner: 'Project-Prism', name: 'Prism-OS', description: 'An operating system written in C#, Made possible by the cosmos community!', stars: 89, topics: ['csharp', 'operating-system', 'os'], gens: new Set<Gen>(['gen2']) },
  { owner: 'LumaTechnologies', name: 'SphereOS', description: 'SphereOS - An operating system written in C#, powered by Cosmos.', stars: 74, topics: ['operating-system'], gens: new Set<Gen>(['gen2']) },
  { owner: 'Ncleardev', name: 'NclearOS-2', description: 'Cosmos based Operating System with GUI.', stars: 41, topics: ['operating-system', 'os'], gens: new Set<Gen>(['gen2']) },
  { owner: 'Adisol07', name: 'SaphireOS', description: 'New operating system', stars: 25, topics: ['csharp'], gens: new Set<Gen>(['gen2']) },
  { owner: 'ascpixi', name: 'cosmos-coroutines', description: 'A simple, non-preemptive coroutine scheduler that allows for cooperative multitasking within Cosmos kernels', stars: 22, topics: ['coroutines', 'multitasking', 'csharp'], gens: new Set<Gen>(['gen2']) },
  { owner: 'AAM1075', name: 'XenOS', description: 'XenOS is an operating system written in .NET C# and is made possible by the Cosmos OS project.', stars: 15, topics: ['c-sharp', 'dotnet', 'operating-system'], gens: new Set<Gen>(['gen2']) },
  { owner: 'mirage-desktop', name: 'Mirage-classic', description: 'Mirage Desktop Environment (Classic)', stars: 12, topics: ['csharp', 'desktop'], gens: new Set<Gen>(['gen2']) },
  { owner: 'DogOSdev', name: 'DogOS', description: 'A Operating System made with Cosmos and in C#.', stars: 9, topics: ['csharp', 'dotnet'], gens: new Set<Gen>(['gen2']) },
] satisfies Omit<Project, 'html_url'>[]).map(p => ({ ...p, html_url: `https://github.com/${p.owner}/${p.name}` }));

function toProject(repo: ApiRepo, gen: Gen): Project | null {
  if (!repo || !repo.name || !repo.owner?.login) return null;
  return {
    owner: repo.owner.login,
    name: repo.name,
    html_url: repo.html_url ?? `https://github.com/${repo.owner.login}/${repo.name}`,
    description: repo.description ?? '',
    stars: repo.stargazers_count ?? 0,
    topics: (repo.topics ?? []).filter(t => !t.includes('cosmos')).slice(0, 3),
    gens: new Set([gen]),
  };
}

function mergeProjects(results: { list: ApiRepo[]; gen: Gen }[]): Project[] {
  const bySlug = new Map<string, Project>();
  for (const { list, gen } of results) {
    if (!Array.isArray(list)) continue;
    for (const repo of list) {
      const project = toProject(repo, gen);
      if (!project) continue;
      const slug = `${project.owner}/${project.name}`.toLowerCase();
      const existing = bySlug.get(slug);
      if (existing) existing.gens.add(gen);
      else bySlug.set(slug, project);
    }
  }
  return Array.from(bySlug.values())
    .sort((a, b) => b.stars - a.stars)
    .slice(0, MAX_PROJECTS);
}

export function Projects() {
  const [list, setList] = useState<Project[] | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      ...SEARCHES.map(({ q, gen }) =>
        fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${MAX_PROJECTS}`)
          .then(r => (r.ok ? r.json() : { items: [] }) as Promise<{ items?: ApiRepo[] }>)
          .catch(() => ({ items: [] as ApiRepo[] }))
          .then(x => ({ list: x.items ?? [], gen }))
      ),
      ...PINNED.map(({ slug, gen }) =>
        fetch(`https://api.github.com/repos/${slug}`)
          .then(r => (r.ok ? r.json() : null) as Promise<ApiRepo | null>)
          .catch(() => null)
          .then(repo => ({ list: repo ? [repo] : [], gen }))
      ),
    ]).then(results => {
      if (cancelled) return;
      const merged = mergeProjects(results);
      if (merged.length === 0) { setErrored(true); setList([]); }
      else setList(merged);
    });
    return () => { cancelled = true; };
  }, []);

  const display = list && list.length > 0 ? list : FALLBACK;

  return (
    <section className="section" id="projects">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">// built with cosmos</div>
          <h2 className="cs-h1">Featured projects</h2>
          <p className="section-sub">{errored
            ? 'Projects couldn’t load from GitHub — showing a snapshot. Live on the marketing site.'
            : 'Don’t know where to start? See these projects to learn Cosmos by example and for inspiration!'}</p>
        </div>
        <div className="term-block" data-reveal>
          <div className="term-cmd" aria-hidden="true">
            ls community/ --sort=stars
          </div>
          <ol className="proj-list">
            {display.map((p, i) => (
              <li key={`${p.owner}/${p.name}`}>
                <a className="proj-row" href={p.html_url} target="_blank" rel="noreferrer">
                  <span className="proj-idx" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <span className="proj-main">
                    <span className="proj-line">
                      <span className="proj-slug">
                        <span className="proj-owner">{p.owner}/</span>
                        <span className="proj-name">{p.name}</span>
                      </span>
                      <span className="proj-stars">{ICONS.star}{p.stars}</span>
                    </span>
                    <span className="proj-desc">
                      {p.description}
                      {p.topics.length > 0 && (
                        <span className="proj-topics">{' '}{p.topics.map(t => `#${t}`).join(' ')}</span>
                      )}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
          <div className="proj-foot" aria-hidden="true">
            {display.length} repos · {errored ? 'snapshot' : 'live from GitHub'} · tag yours <span className="proj-foot-topic">cosmos-os</span> to appear here
          </div>
        </div>
      </div>
    </section>
  );
}
