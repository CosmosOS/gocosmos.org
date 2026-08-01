import { useEffect, useRef, useState } from 'react';
import type * as AsciinemaPlayer from 'asciinema-player';
import 'asciinema-player/dist/bundle/asciinema-player.css';
import { ICONS } from '../icons';

/** Shown until the GitHub API answers (and if it never does). */
const FALLBACK_VERSION = 'v3.0.79';

export function Hero() {
  const playerRef = useRef<HTMLDivElement>(null);
  const [version, setVersion] = useState(FALLBACK_VERSION);

  useEffect(() => {
    let cancelled = false;
    fetch('https://api.github.com/repos/valentinbreiz/nativeaot-patcher/releases/latest')
      .then(r => (r.ok ? r.json() : null) as Promise<{ tag_name?: string } | null>)
      .then(release => {
        if (!cancelled && release?.tag_name) setVersion(release.tag_name);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const node = playerRef.current;
    if (!node) return undefined;
    let player: ReturnType<typeof AsciinemaPlayer.create> | undefined;
    let observer: IntersectionObserver | undefined;
    let cancelled = false;
    let timer = 0;
    let started = false;
    let inView = false;
    let userPaused = false; // paused via the player's own keyboard bindings
    let wantPlaying = false; // what this component last asked of the player

    // play()/pause() reject forever once the cast fails to load — keep the
    // control calls from spamming unhandled-rejection errors.
    const quiet = (p?: Promise<unknown>) => { p?.catch(() => {}); };
    const play = () => { wantPlaying = true; quiet(player?.play()); };
    const pause = () => { wantPlaying = false; quiet(player?.pause()); };

    // Also stop the loop while the tab is in the background.
    const onVisibility = () => {
      if (!started) return;
      if (document.hidden) pause();
      else if (inView && !userPaused) play();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // The player sizes its type to fill the width by measuring glyphs at
    // creation time and never re-measures on font swap — so wait for the mono
    // webfont (with a timeout fallback) before creating it. The player module
    // itself is dynamically imported (it can't run during prerendering and
    // this keeps it out of the main bundle); the fetch overlaps the font wait.
    const fontsReady = 'fonts' in document
      ? Promise.all([document.fonts.load("14px 'JetBrains Mono'"), document.fonts.ready]).catch(() => undefined)
      : Promise.resolve(undefined);
    const fallback = new Promise(resolve => { timer = window.setTimeout(resolve, 1500); });

    Promise.all([import('asciinema-player'), Promise.race([fontsReady, fallback])]).then(([{ create }]) => {
      if (cancelled) return;
      player = create('/assets/helloworld.cast', node, {
        cols: 100,
        rows: 20,
        preload: true,
        loop: true,
        controls: false,
        theme: 'cosmos',
        terminalFontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
        terminalLineHeight: 1.5,
        poster: 'npt:0.3',
      });
      // A pause we didn't ask for is the user's (the player binds space/etc.
      // even with controls:false) — never auto-resume over it.
      player.addEventListener('pause', () => { if (wantPlaying) userPaused = true; });
      player.addEventListener('play', () => { userPaused = false; });
      // Start once the terminal is fully on screen. Geometry comes from each
      // entry, so late player resizing can't skew the decision; if the terminal
      // is taller than the viewport, settle for the largest reachable share.
      // After the first start the same observer pauses the loop whenever the
      // terminal leaves the viewport — otherwise it animates its DOM forever
      // while the visitor scrolls the rest of the page.
      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (!started) {
              const height = entry.boundingClientRect.height || 1;
              const viewport = entry.rootBounds?.height ?? window.innerHeight;
              const needed = Math.min(0.95, (viewport * 0.9) / height);
              if (entry.intersectionRatio >= needed) {
                started = true;
                inView = true;
                play();
              }
            } else {
              inView = entry.intersectionRatio > 0;
              if (!inView) pause();
              else if (!document.hidden && !userPaused) play();
            }
          }
        },
        { threshold: [0, 0.25, 0.5, 0.65, 0.8, 0.9, 0.95, 1] },
      );
      observer.observe(node);
    });

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearTimeout(timer);
      observer?.disconnect();
      player?.dispose();
    };
  }, []);

  return (
    <section className="hero" id="top">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-inner">
        <div className="hero-eyebrow glass">
          <span className="gen-pill glass">GEN3</span>
          <span>NativeAOT release · {version}</span>
        </div>
        <h1 className="hero-title">
          Write an OS in <span className="hero-accent glass">modern&nbsp;C#</span>.<br />
          Compiled ahead-of-time.<br />
          Runs on every hardware.
        </h1>
        <p className="hero-sub">
          Cosmos is an open-source C# operating system framework. Author your kernel in C# 14, compile it with NativeAOT, and boot it on x64 or ARM64, no JIT, no managed runtime.
        </p>
        <div className="hero-ctas">
          <a className="btn btn-secondary btn-lg glass" href="https://discord.com/invite/kwtBwv6jhD" target="_blank" rel="noreferrer">
            {ICONS.msg}<span>Join community</span>
          </a>
          <a className="btn btn-secondary btn-lg glass" href="https://github.com/valentinbreiz/nativeaot-patcher" target="_blank" rel="noreferrer">
            {ICONS.github}<span>Star on GitHub</span>
          </a>
        </div>
      </div>

      <div className="container">
        <div className="terminal glass">
          <div className="term-bar">
            <span className="term-dot" style={{ background: '#FF6B6B' }} />
            <span className="term-dot" style={{ background: '#FFB454' }} />
            <span className="term-dot" style={{ background: '#3DDC84' }} />
            <span className="term-title">cosmos@gen3 — make run KERNEL=HelloWorld</span>
          </div>
          <div
            className="term-player"
            ref={playerRef}
            aria-label="Recording of make run KERNEL=HelloWorld building the kernel and booting it in QEMU"
          />
        </div>
      </div>
    </section>
  );
}
