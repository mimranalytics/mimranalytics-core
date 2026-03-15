import Navbar    from "../components/Navbar";
import Footer    from "../components/Footer";
import CtaBanner from "../components/CtaBanner";
import { useApp } from "../context/AppContext";
import { TEAM, VALUES, COVERAGE } from "../data/mockData";

export default function AboutPage() {
  const { navigate, setAuthMode } = useApp();

  return (
    <div className="page">
      <div className="grid-bg" />
      <Navbar />

      {/* ── HERO ── */}
      <section style={{ padding: "160px 48px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="section-label">About MIMR Analytics</div>
        <h1 style={{
          fontFamily: "var(--serif)", fontSize: 60, fontWeight: 900,
          lineHeight: 1.0, letterSpacing: "-0.03em", maxWidth: 800, marginBottom: 24,
        }}>
          We make corporate<br />
          opacity{" "}
          <em style={{ color: "var(--gold)" }}>
            a thing<br />of the past.
          </em>
        </h1>
        <p style={{ fontSize: 18, color: "var(--text-2)", maxWidth: 600, lineHeight: 1.8, fontWeight: 300 }}>
          Founded by intelligence analysts, data scientists, and former
          regulators — MIMR Analytics was built to answer one question:{" "}
          <em style={{ color: "var(--text)" }}>who really controls what?</em>
        </p>
      </section>

      <hr className="divider" />

      {/* ── STORY + COVERAGE ── */}
      <section className="section">
        <div className="about-grid">
          <div>
            <div className="section-label">Our story</div>
            <h2 className="section-title">
              Built from<br /><em>inside the industry.</em>
            </h2>
            <div className="about-body">
              <p>
                MIMR Analytics was founded in 2025 by a team frustrated with the
                fragmentation of corporate data across jurisdictions, registries, and
                legacy databases. Manual research that should take minutes was taking
                weeks.
              </p>
              <p>
                We built the graph infrastructure we wished we'd had — connecting
                Companies House, SEC Edgar, OpenCorporates, sanctions lists, and
                hundreds of other sources into a single, navigable intelligence layer.
              </p>
              <div className="about-highlight">
                "The corporate world is a graph. Everyone else was giving analysts
                spreadsheets."
              </div>
              <p>
                Today MIMR aim to serve Audting firms, financial institutions, law firms, investigative
                journalists, and regulators across 40+ countries — processing over
                2 billion entity relationship queries per year.
              </p>
            </div>
          </div>

          <CoveragePanel />
        </div>
      </section>

      <hr className="divider" />

      {/* ── VALUES ── */}
      <section className="section">
        <div className="section-label">What we stand for</div>
        <h2 className="section-title">Our <em>values.</em></h2>
        <div className="values-list" style={{ maxWidth: 720 }}>
          {VALUES.map((v) => (
            <div className="value-item" key={v.n}>
              <div className="value-num">{v.n}</div>
              <div>
                <div className="value-title">{v.title}</div>
                <div className="value-desc">{v.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* ── TEAM ── */}
      <section className="section">
        <div className="section-label">The team</div>
        <h2 className="section-title">
          The people who<br /><em>built this.</em>
        </h2>
        <div className="team-grid">
          {TEAM.map((member) => (
            <TeamCard key={member.name} member={member} />
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <CtaBanner
        title="Start mapping the"
        titleEm="connections that matter."
        sub="Free trial. No card required. Full API access on paid plans."
        primaryLabel="Get started free"
        primaryAction={() => { setAuthMode("signup"); navigate("auth"); }}
        secondaryLabel="Search now"
        secondaryAction={() => navigate("home")}
      />

      <Footer />
    </div>
  );
}

/* ── Platform coverage bars ── */
function CoveragePanel() {
  return (
    <div className="about-visual">
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em",
        textTransform: "uppercase", color: "var(--text-3)", marginBottom: 20,
      }}>
        Platform coverage
      </div>

      {COVERAGE.map(({ label, pct, color }) => (
        <div key={label} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>{label}</span>
            <span style={{ fontSize: 12, fontFamily: "var(--mono)", color }}>{pct}%</span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              background: color, borderRadius: 2, opacity: 0.8,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Team member card ── */
function TeamCard({ member }) {
  return (
    <div className="team-card">
      <div
        className="team-avatar"
        style={{ background: member.bg, color: member.fg }}
      >
        {member.initials}
      </div>
      <div className="team-name">{member.name}</div>
      <div className="team-role">{member.role}</div>
      <p className="team-bio">{member.bio}</p>
    </div>
  );
}
