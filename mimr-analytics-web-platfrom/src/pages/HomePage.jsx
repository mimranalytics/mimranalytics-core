import Navbar    from "../components/Navbar";
import Footer    from "../components/Footer";
import SearchBar from "../components/SearchBar";
import GraphViz  from "../components/GraphViz";
import CtaBanner from "../components/CtaBanner";
import { useApp } from "../context/AppContext";
import { STATS, SERVICES } from "../data/mockData";

export default function HomePage() {
  const { navigate, setAuthMode } = useApp();

  return (
    <div className="page">
      <div className="grid-bg" />
      <Navbar />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" />
          Graph-Based Corporate Intelligence Platform
        </div>

        <h1 className="hero-title">
          Uncover the <em>hidden</em> connections<br />
          behind every <span className="cyan">organisation.</span>
        </h1>

        <p className="hero-sub">
          MIMR Analytics maps corporate ownership, directorship networks, and
          entity relationships — transforming opaque structures into navigable
          intelligence.
        </p>

        <SearchBar />

        <div className="graph-preview">
          <div className="graph-preview-label">
            Live entity relationship graph — BP PLC example
          </div>
          <GraphViz query="BP PLC" />
        </div>
      </section>

      {/* ── STATS ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px" }}>
        <div className="stats-row">
          {STATS.map(({ num, label }) => (
            <div className="stat-cell" key={label}>
              <div className="stat-num">{num}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICES ── */}
      <section className="section" id="services-section" style={{ paddingTop: 120 }}>
        <div className="section-label">What we do</div>
        <h2 className="section-title">
          Intelligence services<br />built for <em>serious analysis.</em>
        </h2>
        <p className="section-sub">
          From compliance screening to investigative journalism — MIMR gives you
          the full corporate picture.
        </p>

        <div className="services-grid">
          {SERVICES.map((s) => (
            <div className="service-card" key={s.title}>
              <div className="service-icon">{s.icon}</div>
              <div className="service-title">{s.title}</div>
              <p className="service-desc">{s.desc}</p>
              <span className="service-link">Learn more →</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <CtaBanner
        title="Ready to see what's"
        titleEm="really connected?"
        sub="Start your free trial. No credit card required."
        primaryLabel="Create free account"
        primaryAction={() => { setAuthMode("signup"); navigate("auth"); }}
        secondaryLabel="Learn about us"
        secondaryAction={() => navigate("about")}
      />

      <Footer />
    </div>
  );
}
