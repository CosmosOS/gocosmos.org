export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <img src="/assets/cosmos-logo.png" alt="Cosmos" />
          <p className="footer-tagline">Made with C# on bare metal.</p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Project</h4>
            <a href="#features">Features</a>
            <a href="#projects">Projects</a>
            <a href="#timeline">History</a>
          </div>
          <div>
            <h4>Community</h4>
            <a href="https://github.com/CosmosOS/Cosmos/tree/gen3" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://github.com/CosmosOS/Cosmos/issues" target="_blank" rel="noreferrer">Issues</a>
            <a href="https://github.com/users/valentinbreiz/projects/2/views/2" target="_blank" rel="noreferrer">Priority board</a>
          </div>
          <div>
            <h4>Resources</h4>
            <a href="https://cosmosos.github.io/" target="_blank" rel="noreferrer">Documentation</a>
            <a href="https://valentin.bzh/posts/3" target="_blank" rel="noreferrer">Gen3 article</a>
            <a href="https://github.com/CosmosOS/Cosmos" target="_blank" rel="noreferrer">Cosmos Gen2</a>
          </div>
        </div>
      </div>
      <div className="container footer-fine">
        <span>MIT licensed · © 2024 Kaleb McGhie (zarlo) and Cosmos contributors</span>
        <span className="footer-fine-right">Gen3</span>
      </div>
    </footer>
  );
}
