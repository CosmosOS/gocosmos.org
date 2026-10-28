import { useI18n, type Era } from '../i18n';

interface Commit {
  era: Era;
  /* Decorative abbreviated SHA: the eras predate the GitHub history, so
     there is no real object to point at. */
  sha: string;
  ref: { kind: 'tag' | 'head'; name: string };
  current?: boolean;
}

/* Oldest first, like `git log --reverse`. The dated, worded part of each
   commit comes from the locale strings. */
const COMMITS: Commit[] = [
  { era: 'gen1', sha: '1d0c7a3', ref: { kind: 'tag', name: 'gen1' } },
  { era: 'gen2', sha: '7b2e94f', ref: { kind: 'tag', name: 'gen2' } },
  { era: 'gen3', sha: 'e3a9c01', ref: { kind: 'head', name: 'gen3' }, current: true },
];

export function Timeline() {
  const { t } = useI18n();
  return (
    <section className="section section-tinted" id="timeline">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">{t.timeline.eyebrow}</div>
          <h2 className="cs-h1">{t.timeline.title}</h2>
          <p className="section-sub">{t.timeline.sub}</p>
        </div>
        <div className="term-block" data-reveal>
          <div className="term-cmd" aria-hidden="true">
            <span className="term-user">cosmos@gen3</span>:<span className="term-path">~/HelloWorld</span>$ git log --reverse
          </div>
          <ol className="git-log">
            {COMMITS.map(c => {
              const era = t.timeline.eras[c.era];
              return (
                <li key={c.ref.name} className={`commit${c.current ? ' commit-current' : ''}`}>
                  <div className="commit-line">
                    {/* The SHA is set dressing; the decoration carries the name. */}
                    <span aria-hidden="true">commit {c.sha} </span>
                    <span className="commit-decor">
                      (
                      {c.ref.kind === 'head'
                        ? <><span className="commit-head">HEAD -&gt; </span><span className="commit-branch">{c.ref.name}</span></>
                        : <span className="commit-tag">tag: {c.ref.name}</span>}
                      )
                    </span>
                  </div>
                  <div className="commit-date">Date:   {era.date}</div>
                  <div className="commit-msg">
                    <h3 className="commit-subject">{era.subject}</h3>
                    <p className="commit-body">{era.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
