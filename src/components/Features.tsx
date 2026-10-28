import { useState } from 'react';
import { useI18n, type SpecKey } from '../i18n';

/* The readout keys are what `cosmos --info` prints: they stay as they are in
   every language. Values and descriptions come from the locale strings. */
const SPEC_KEYS: SpecKey[] = ['build', 'plugs', 'arch', 'bcl', 'kernel', 'net', 'disk', 'gfx', 'plat'];

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
  const { t } = useI18n();
  const [open, setOpen] = useState<string | null>(null);
  const SPECS = SPEC_KEYS.map(key => ({ key, ...t.features.specs[key] }));
  return (
    <section className="section section-tinted" id="features">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">{t.features.eyebrow}</div>
          <h2 className="cs-h1">{t.features.title}</h2>
          <p className="section-sub">{t.features.sub}</p>
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
              {/* Each row is a real disclosure: click/Enter/Space toggles and
                  aria-expanded reports it. Hover and focus still preview the
                  description (sighted-only sugar via CSS). */}
              {SPECS.map(s => (
                <li key={s.key} className="spec-row" data-open={open === s.key || undefined}>
                  <button
                    type="button"
                    className="spec-btn"
                    aria-expanded={open === s.key}
                    aria-controls={`spec-${s.key}`}
                    onClick={() => setOpen(o => (o === s.key ? null : s.key))}
                  >
                    <span className="spec-line">
                      <span className="spec-key">{s.key}</span>
                      <span className="spec-value">{s.value}</span>
                    </span>
                  </button>
                  <div className="spec-desc" id={`spec-${s.key}`}><p>{s.desc}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
