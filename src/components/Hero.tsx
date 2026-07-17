import { useEffect, useState } from 'react';
import { ICONS } from '../icons';

type BootLineKind = 'cmd' | 'log' | 'boot' | 'k' | 'cursor';

interface BootLine {
  t: BootLineKind;
  text: string;
}

const BOOT_LINES: BootLine[] = [
  { t: 'cmd', text: 'make run KERNEL=HelloWorld' },
  { t: 'log', text: '→ patcher: rewriting 142 IL methods (Mono.Cecil)' },
  { t: 'log', text: '→ ilc: 18.2s · gcc-link: 2.1s · xorriso: 0.4s' },
  { t: 'log', text: '→ qemu-system-x86_64: starting (KVM accel, 512M)' },
  { t: 'boot', text: '[boot]   Limine 8.4 — x64' },
  { t: 'boot', text: '[boot]   framebuffer 1024×768 · UEFI GOP' },
  { t: 'k', text: '[kernel] memory: 491.4 MiB usable · GC online' },
  { t: 'k', text: '[kernel] interrupts: APIC up · scheduler: stride' },
  { t: 'k', text: '[kernel] hello, bare metal.' },
  { t: 'cursor', text: '' },
];

export function Hero() {
  const [shown, setShown] = useState<BootLine[]>([]);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduced) { setShown(BOOT_LINES); return; }
    let i = 0;
    let cancelled = false;
    function next() {
      if (cancelled) return;
      setShown(BOOT_LINES.slice(0, i + 1));
      i++;
      if (i < BOOT_LINES.length) {
        const delay = BOOT_LINES[i - 1].t === 'cmd' ? 700 : 380 + Math.random() * 200;
        setTimeout(next, delay);
      }
    }
    setTimeout(next, 600);
    return () => { cancelled = true; };
  }, [reduced]);

  return (
    <section className="hero" id="top">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-inner">
        <div className="hero-eyebrow">
          <span className="gen-pill">GEN3</span>
          <span>NativeAOT release · v3.0.54</span>
        </div>
        <h1 className="hero-title">
          Write an OS in <span className="hero-accent">modern&nbsp;C#</span>.<br />
          Compiled ahead-of-time.<br />
          Runs on every hardware.
        </h1>
        <p className="hero-sub">
          Cosmos is an open-source C# operating system framework. Author your kernel in C# 14, compile it with NativeAOT, and boot it on x64 or ARM64 — bare metal, no JIT, no managed runtime.
        </p>
        <div className="hero-ctas">
          <a className="btn btn-primary btn-lg" href="https://valentinbreiz.github.io/nativeaot-patcher/index.html" target="_blank" rel="noreferrer">
            <span>Get started</span>{ICONS.arrow}
          </a>
          <a className="btn btn-secondary btn-lg" href="https://github.com/valentinbreiz/nativeaot-patcher" target="_blank" rel="noreferrer">
            {ICONS.github}<span>Star on GitHub</span>
          </a>
        </div>

        <div className="terminal" role="img" aria-label="Terminal showing make run KERNEL=HelloWorld booting in QEMU">
          <div className="term-bar">
            <span className="term-dot" style={{ background: '#FF6B6B' }} />
            <span className="term-dot" style={{ background: '#FFB454' }} />
            <span className="term-dot" style={{ background: '#3DDC84' }} />
            <span className="term-title">cosmos@gen3 — qemu</span>
          </div>
          <div className="term-body">
            {shown.map((line, idx) => (
              <div key={idx} className={`term-line term-${line.t}`}>
                {line.t === 'cmd' && <span className="term-prompt">$</span>}
                {line.t === 'cursor'
                  ? <span className="term-prompt">$<span className="term-caret" /></span>
                  : <span>{line.text}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
