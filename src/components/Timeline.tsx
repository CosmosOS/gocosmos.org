interface Commit {
  /* Decorative abbreviated SHA: the eras predate the GitHub history, so
     there is no real object to point at. */
  sha: string;
  ref: { kind: 'tag' | 'head'; name: string };
  date: string;
  subject: string;
  body: string;
  current?: boolean;
}

/* Oldest first, like `git log --reverse`. */
const COMMITS: Commit[] = [
  {
    sha: '1d0c7a3',
    ref: { kind: 'tag', name: 'gen1' },
    date: '2007',
    subject: 'The proof.',
    body: 'Original Cosmos. Proof that you could compile C# down to something that boots on bare metal. A small project with a big idea.',
  },
  {
    sha: '7b2e94f',
    ref: { kind: 'tag', name: 'gen2' },
    date: '2010s — 2024',
    subject: 'IL2CPU era.',
    body: "A custom IL-to-x86 compiler, built and maintained by the community for over a decade. IL2CPU translated .NET bytecode straight to assembly, and powered hobby OSes for years.",
  },
  {
    sha: 'e3a9c01',
    ref: { kind: 'head', name: 'gen3' },
    date: 'Today',
    subject: 'NativeAOT.',
    body: "We retired 15 years of custom compiler work and stood on the shoulders of NativeAOT. Cosmos now patches .NET's official AOT pipeline at the IL level, modern language features, faster builds, less code to maintain.",
    current: true,
  },
];

export function Timeline() {
  return (
    <section className="section section-tinted" id="timeline">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">// three generations</div>
          <h2 className="cs-h1">Eighteen years of C# on the metal.</h2>
          <p className="section-sub">Cosmos has had three lives. Gen3 is the largest re-foundation since the project began.</p>
        </div>
        <div className="term-block" data-reveal>
          <div className="term-cmd" aria-hidden="true">
            <span className="term-user">cosmos@gen3</span>:<span className="term-path">~/HelloWorld</span>$ git log --reverse
          </div>
          <ol className="git-log">
            {COMMITS.map(c => (
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
                <div className="commit-date">Date:   {c.date}</div>
                <div className="commit-msg">
                  <h3 className="commit-subject">{c.subject}</h3>
                  <p className="commit-body">{c.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
