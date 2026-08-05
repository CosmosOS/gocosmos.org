interface Spec {
  key: string;
  value: string;
  desc: string;
}

const SPECS: Spec[] = [
  { key: 'build', value: 'dotnet build → bootable ISO', desc: 'The Cosmos build pipeline runs NativeAOT codegen, assemble, link and pack a bootable ISO for the Limine bootloader.' },
  { key: 'plugs', value: 'IL patching with Mono.Cecil', desc: 'Cosmos.Patcher replaces runtime methods at the IL level before NativeAOT compiles them.' },
  { key: 'arch', value: 'x64 · ARM64 — RISC-V planned', desc: 'Target selected by RuntimeIdentifier: APIC interrupts on x64, GIC on ARM64, GAS assembly on both, MMIO where there is no port I/O.' },
  { key: 'bcl', value: 'the real .NET BCL', desc: 'Strings, collections, generics, threading, Console — compiled by NativeAOT, no JIT, no managed runtime.' },
  { key: 'kernel', value: 'GC · scheduler · exceptions', desc: 'Mark-and-sweep GC with precise stack scanning, a preemptive priority-based stride scheduler with lock support, exception handling with unwinding.' },
  { key: 'net', value: 'System.Net.Sockets', desc: 'TCP and UDP sockets over Cosmos’ own network stack: ARP, IPv4, DHCP and DNS. HTTPS/TLS is on the roadmap.' },
  { key: 'disk', value: 'System.IO down to the disk', desc: 'AHCI/SATA and NVMe drivers, MBR/GPT/EBR partitioning, FAT12/16/32 on a Unix-style VFS.' },
  { key: 'gfx', value: 'Canvas · input', desc: 'Double-buffered Canvas API on the UEFI GOP framebuffer (via Limine), keyboard and mouse input.' },
  { key: 'plat', value: 'ACPI · UART', desc: 'ACPI support through the LAI library, plus UART serial for logging and debugging the kernel.' },
];

/* The -hrr- planet, same as the Cosmos VS Code extension prints after
   `dotnet new cosmos-kernel`. Pure ASCII — every glyph exists in JetBrains
   Mono, so it renders identically everywhere (Braille art didn't). */
const ART = [
  '                                              ___',
  '                                          ,o88888',
  "                                       ,o8888888'",
  '                 ,:o:o:oooo.        ,8O88Pd888"',
  "             ,.::.::o:ooooOoOoO. ,oO8O8Pd888'",
  '           ,.:.::o:ooOoOoOO8O8OOo.8OOPd8O8O"',
  '          , ..:.::o:ooOoOOOO8OOOOo.FdO8O8"',
  '         , ..:.::o:ooOoOO8O888O8O,COCOO"',
  '        , . ..:.::o:ooOoOOOO8OOOOCOCO"',
  '        . ..:.::o:ooOoOoOO8O8OCCCC"o',
  '           . ..:.::o:ooooOoCoCCC"oo:o',
  '           . ..:.::o:o:,cooooCo"oo:o:',
  "         `   . . ..:.:cocoooo\"'o:o:::'",
  "         .`   . ..::ccccoc\"'o:o:o:::'",
  '        :.:.    ,c:cccc"\':.:.:.:.:.\'',
  '      ..:.:"\\\'`::::c:"\'..:.:.:.:.:.\'',
  "    ...:.'.:.::::\"'    . . . . .'",
  '   .. . ....:."\' `   .  . . \'\'',
  ' . . . ...."\'',
  ' .. . ."\'',
  '.                                           -hrr-',
].join('\n');

export function Features() {
  return (
    <section className="section section-tinted" id="features">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">// what's inside</div>
          <h2 className="cs-h1">Everything you need to boot C# on bare metal.</h2>
          <p className="section-sub">Gen3 replaces IL2CPU with the official .NET toolchain. Everything above it: GC, scheduler, drivers, network, filesystem is C# you can read, plug or replace.</p>
        </div>
        <div className="term-block" data-reveal>
          <div className="term-cmd" aria-hidden="true">
            <span className="term-user">cosmos@gen3</span>:<span className="term-path">~/HelloWorld</span>$ cosmos --info
          </div>
          <div className="readout">
            <div className="readout-side">
              <pre className="readout-art" aria-hidden="true">{ART}</pre>
              <div className="readout-tags">
                <span className="gen-pill glass">C# 14</span>
                <span className="gen-pill glass">.NET 10</span>
                <span className="gen-pill glass">NativeAOT</span>
                <span className="gen-pill glass">Limine</span>
              </div>
            </div>
            <ul className="readout-specs">
              {SPECS.map(s => (
                <li key={s.key} className="spec-row" tabIndex={0}>
                  <div className="spec-line">
                    <span className="spec-key">{s.key}</span>
                    <span className="spec-value">{s.value}</span>
                  </div>
                  <div className="spec-desc"><p>{s.desc}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
