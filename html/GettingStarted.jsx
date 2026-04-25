/* global React, ICONS */
const { useState } = React;

const SNIPPET = `dotnet tool install -g Cosmos.Tools && cosmos install`;

function GettingStarted() {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(SNIPPET).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <section className="section" id="start">
      <div className="container container-narrow">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">// get started</div>
          <h2 className="cs-h1">Four lines, one running kernel.</h2>
          <p className="section-sub">The dev container provisions everything — .NET 10, the patcher, QEMU, Limine. Then run a kernel.</p>
        </div>
        <div className="snippet" data-reveal>
          <div className="snippet-bar">
            <span className="snippet-lang">bash</span>
            <button className="snippet-copy" onClick={copy} aria-label="Copy to clipboard">
              {copied ? ICONS.check : ICONS.copy}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="snippet-body"><code>{`${'\u00a0'}`}<span className="tok-prompt">$</span> git <span className="tok-arg">clone</span> https://github.com/valentinbreiz/nativeaot-patcher
{'\u00a0'}<span className="tok-prompt">$</span> <span className="tok-arg">cd</span> nativeaot-patcher
{'\u00a0'}<span className="tok-prompt">$</span> ./.devcontainer/postCreateCommand.sh
{'\u00a0'}<span className="tok-prompt">$</span> <span className="tok-cmd">make run</span> KERNEL=<span className="tok-val">HelloWorld</span></code></pre>
        </div>
        <div className="docs-link" data-reveal>
          <a href="https://valentinbreiz.github.io/nativeaot-patcher/index.html" target="_blank" rel="noreferrer">
            {ICONS.book}<span>Read the full docs</span>{ICONS.arrow}
          </a>
        </div>
      </div>
    </section>
  );
}
window.GettingStarted = GettingStarted;
