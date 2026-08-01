import { ICONS, type IconName } from '../icons';

interface CommunityLink {
  icon: IconName;
  title: string;
  desc: string;
  href: string;
}

const LINKS: CommunityLink[] = [
  { icon: 'github', title: 'GitHub repo', desc: 'Source, releases, and discussion.', href: 'https://github.com/valentinbreiz/nativeaot-patcher' },
  { icon: 'bug', title: 'Issues', desc: 'Bug reports and feature requests.', href: 'https://github.com/valentinbreiz/nativeaot-patcher/issues' },
  { icon: 'list', title: 'Priority board', desc: 'What we’re working on, in what order.', href: 'https://github.com/users/valentinbreiz/projects/2/views/2' },
  { icon: 'book', title: 'Documentation', desc: 'Install, build, plugs, GC, testing.', href: 'https://valentinbreiz.github.io/nativeaot-patcher/index.html' },
  { icon: 'msg', title: 'Discord', desc: 'Chat with the team and other kernel devs.', href: 'https://discord.com/invite/kwtBwv6jhD' },
];

export function Community() {
  return (
    <section className="section section-tinted" id="community">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">// community &amp; links</div>
          <h2 className="cs-h1">Find us, file issues, jump in.</h2>
          <p className="section-sub">Cosmos is open source and community-led. Pull requests welcome, start with the priority board.</p>
        </div>
        <div className="link-grid">
          {LINKS.map(l => (
            <a key={l.title} className="link-card" href={l.href} target="_blank" rel="noreferrer" data-reveal>
              <div className="link-icon">{ICONS[l.icon]}</div>
              <div className="link-text">
                <h3>{l.title}</h3>
                <p>{l.desc}</p>
              </div>
              <div className="link-arrow">{ICONS.arrow}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
