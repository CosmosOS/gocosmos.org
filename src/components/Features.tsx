import { ICONS, type IconName } from '../icons';

interface Feature {
  icon: IconName;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  { icon: 'zap', title: 'dotnet build → bootable ISO', desc: 'The Cosmos build pipeline runs NativeAOT codegen, assemble, link and pack a bootable ISO for the Limine bootloader.' },
  { icon: 'wrench', title: 'Plug system', desc: 'Cosmos.Patcher replaces runtime methods at the IL level with Mono.Cecil before NativeAOT compiles them.' },
  { icon: 'cpu', title: 'x64 and ARM64', desc: 'Target selected by RuntimeIdentifier: APIC interrupts on x64, GIC on ARM64, GAS assembly on both, MMIO where there is no port I/O. RISC-V is planned.' },
  { icon: 'code', title: 'Core BCL support', desc: 'Strings, collections, generics, threading, Console. The real .NET BCL compiled by NativeAOT.' },
  { icon: 'layers', title: 'GC, scheduler, exceptions', desc: 'Mark-and-sweep GC with precise stack scanning, a preemptive priority-based stride scheduler with lock support, exception handling with unwinding.' },
  { icon: 'globe', title: 'System.Net.Sockets', desc: 'TCP and UDP sockets over Cosmos own network stack: ARP, IPv4, DHCP and DNS. HTTPS/TLS is on the roadmap.' },
  { icon: 'hardDrive', title: 'System.IO down to the disk', desc: 'AHCI/SATA and NVMe drivers, MBR/GPT/EBR partitioning, FAT12/16/32 on a Unix-style VFS.' },
  { icon: 'monitor', title: 'Graphics, input and ACPI', desc: 'Double-buffered Canvas API on the UEFI GOP framebuffer (via Limine), keyboard and mouse input, ACPI through LAI, UART for serial debugging.' },
];

export function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">// what's inside</div>
          <h2 className="cs-h1">Everything you need to boot C# on bare metal.</h2>
          <p className="section-sub">Gen3 replaces IL2CPU with the official .NET toolchain. Everything above it: GC, scheduler, drivers, network, filesystem is C# you can read, plug or replace.</p>
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
