/* global React */
const ERAS = [
  {
    tag: 'Gen1',
    year: '2007',
    title: 'The proof.',
    body: 'Original Cosmos. Proof that you could compile C# down to something that boots on bare metal. A small project with a big idea.',
    accent: 'fg-3',
  },
  {
    tag: 'Gen2',
    year: '2010s — 2024',
    title: 'IL2CPU era.',
    body: "A custom IL-to-x86 compiler — built and maintained by the community for over a decade. IL2CPU translated .NET bytecode straight to assembly, and powered hobby OSes for years.",
    accent: 'fg-3',
  },
  {
    tag: 'Gen3',
    year: 'Today',
    title: 'NativeAOT.',
    body: "We retired 15 years of custom compiler work and stood on the shoulders of NativeAOT. Cosmos now patches .NET's official AOT pipeline at the IL level — modern language features, faster builds, less code to maintain.",
    accent: 'gradient',
    current: true,
  },
];

function Timeline() {
  return (
    <section className="section section-tinted" id="timeline">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">// three generations</div>
          <h2 className="cs-h1">Eighteen years of C# on the metal.</h2>
          <p className="section-sub">Cosmos has had three lives. Gen3 is the largest re-foundation since the project began.</p>
        </div>
        <ol className="timeline">
          {ERAS.map((era, i) => (
            <li key={era.tag} className={`era ${era.current ? 'era-current' : ''}`} data-reveal>
              <div className="era-rail">
                <span className="era-node" />
                {i < ERAS.length - 1 && <span className="era-line" />}
              </div>
              <div className="era-body">
                <div className="era-meta">
                  <span className={`era-tag ${era.current ? 'era-tag-current' : ''}`}>{era.tag}</span>
                  <span className="era-year">{era.year}</span>
                </div>
                <h3 className={`era-title ${era.accent === 'gradient' ? 'hero-accent' : ''}`}>{era.title}</h3>
                <p className="era-desc">{era.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
window.Timeline = Timeline;
