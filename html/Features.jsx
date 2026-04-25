/* global React, ICONS */
const FEATURES = [
  { icon: 'code', title: 'Modern C# 14 / .NET 10', desc: 'Full language support — generics, LINQ, async-ready, no reflection trickery required.' },
  { icon: 'zap', title: 'NativeAOT compilation', desc: "Built on Microsoft's official AOT compiler. No JIT, no managed runtime dependency, fast cold boot." },
  { icon: 'cpu', title: 'Dual-architecture', desc: 'x64 and ARM64 from a single C# codebase. Compile-time selection via RuntimeIdentifier.' },
  { icon: 'wrench', title: 'IL Patcher', desc: 'Mono.Cecil-based tool rewrites runtime internals at the IL level. The Cosmos plug system, on AOT.' },
  { icon: 'hardDrive', title: 'Bare-metal ready', desc: 'Limine boot protocol, custom memory manager, mark-and-sweep GC, exception handling, threading.' },
  { icon: 'layers', title: 'Hardware stack', desc: 'PCI · UART · Timer · Keyboard · Mouse · Network · Graphics · Interrupts · Scheduler — all toggleable via MSBuild flags.' },
  { icon: 'globe', title: 'Custom runtime stubs', desc: 'C# replacements for the native C++ runtime — RhpThrowEx, memmove, GC handles, write barriers.' },
  { icon: 'flask', title: '10 kernel test suites', desc: 'HelloWorld, Memory, TypeCasting, Timer, Network, Runtime, Threading, Math, GarbageCollector, Graphics — out of the box.' },
];

function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">// what's inside</div>
          <h2 className="cs-h1">Everything you need to boot C# on bare metal.</h2>
          <p className="section-sub">A cohesive framework — compiler integration, runtime, hardware drivers, GC, scheduler — all written in C#, all open source.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="feature-card" data-reveal style={{ transitionDelay: `${(i % 4) * 60}ms` }}>
              <div className="feature-icon">{ICONS[f.icon]}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
window.Features = Features;
