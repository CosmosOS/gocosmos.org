import { ICONS, type IconName } from '../icons';

interface Feature {
  icon: IconName;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  { icon: 'zap', title: 'dotnet build → bootable ISO', desc: "IL2CPU is gone. Microsoft's own NativeAOT compiler does the codegen; MSBuild targets assemble, link with GCC and pack a Limine-bootable image." },
  { icon: 'wrench', title: 'The plug system, on AOT', desc: 'Cosmos.Build.Patcher rewrites runtime internals at the IL level with Mono.Cecil — swap any runtime method for your own C# before it gets compiled.' },
  { icon: 'cpu', title: 'x64 and ARM64', desc: 'One C# codebase, two architectures, selected by RuntimeIdentifier. APIC interrupts on x64, GIC on ARM64, MMIO drivers where port I/O doesn’t exist.' },
  { icon: 'code', title: 'The BCL, not a dialect', desc: 'String, List, Dictionary, generics, threading, DateTime, Random, Console — backed by C# runtime stubs instead of the C++ runtime.' },
  { icon: 'layers', title: 'A runtime you can read', desc: 'Mark-and-sweep GC, priority-based stride scheduler, exception handling with stack unwinding — kernel internals in C#, not a black box.' },
  { icon: 'globe', title: 'Real System.Net.Sockets', desc: 'TCP and UDP sockets on the kernel’s own network stack — ARP, IPv4, DHCP, DNS. Network code reads exactly like user-land .NET.' },
  { icon: 'hardDrive', title: 'System.IO down to the disk', desc: 'AHCI/SATA and NVMe drivers, MBR/GPT/EBR partitioning, FAT12/16/32 on a Unix-style VFS — mounted and used through plain File and Directory APIs.' },
  { icon: 'monitor', title: 'Pixels, keys and ACPI', desc: 'Double-buffered Canvas API (shapes, fonts, images) on the UEFI GOP framebuffer, keyboard and mouse input, ACPI via LAI, UART for serial debugging.' },
];

export function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">// what's inside</div>
          <h2 className="cs-h1">Everything you need to boot C# on bare metal.</h2>
          <p className="section-sub">No custom compiler left to maintain: Gen3 builds on the official .NET toolchain, and everything above it — GC, scheduler, drivers, network, filesystem — is C# you can read, plug and replace.</p>
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
