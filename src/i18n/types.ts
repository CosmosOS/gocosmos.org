/* Every string a visitor reads, typed so a language file cannot miss one.
   Terminal output (prompts, commands, `commit`/`Date:` lines, readout keys,
   the ASCII art) is not here: it stays as the shell prints it. */

export type SpecKey = 'build' | 'plugs' | 'arch' | 'bcl' | 'kernel' | 'net' | 'disk' | 'gfx' | 'plat';
export type Era = 'gen1' | 'gen2' | 'gen3';

export interface Strings {
  meta: { title: string; description: string };
  nav: {
    skip: string;
    features: string;
    projects: string;
    history: string;
    pauseMotion: string;
    resumeMotion: string;
    toLight: string;
    toDark: string;
    toggleTheme: string;
    github: string;
    getStarted: string;
    getStartedLabel: string;
    language: string;
  };
  hero: {
    /** "NativeAOT release" — the version tag follows it. */
    release: string;
    titleBefore: string;
    /** The glass-pill words of the headline ("modern C#"). */
    titleAccent: string;
    titleAfter: string;
    titleLine2: string;
    titleLine3: string;
    sub: string;
    join: string;
    star: string;
    /** aria-label of the boot-log recording. */
    recording: string;
  };
  features: {
    eyebrow: string;
    title: string;
    sub: string;
    specs: Record<SpecKey, { value: string; desc: string }>;
  };
  projects: {
    eyebrow: string;
    title: string;
    sub: string;
    /** Screen-reader suffix after a star count (" stars"). */
    stars: string;
    repos: (n: number) => string;
    /** "updated 2026-10-29" — the build date of the list, ISO as the shell would print it. */
    updated: (date: string) => string;
    /** "tag yours <cosmos-os> to appear here", split around the topic. */
    tagBefore: string;
    tagAfter: string;
  };
  timeline: {
    eyebrow: string;
    title: string;
    sub: string;
    eras: Record<Era, { date: string; subject: string; body: string }>;
  };
  contributors: {
    eyebrow: string;
    title: string;
    sub: (people: string) => string;
    /** "2,907 commits": n for the plural rule, formatted for display. */
    commits: (n: number, formatted: string) => string;
    /** Avatar link name: the tooltip text plus where the link goes. */
    profile: (who: string) => string;
  };
  footer: {
    tagline: string;
    project: string;
    community: string;
    resources: string;
    features: string;
    projects: string;
    history: string;
    github: string;
    issues: string;
    board: string;
    docs: string;
    article: string;
    gen2: string;
  };
}
