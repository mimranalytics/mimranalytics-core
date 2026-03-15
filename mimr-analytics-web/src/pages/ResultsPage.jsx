import Navbar    from "../components/Navbar";
import Footer    from "../components/Footer";
import GraphViz  from "../components/GraphViz";
import SearchBar from "../components/SearchBar";
import { useApp } from "../context/AppContext";
import { MOCK_ENTITIES, CONNECTION_LEGEND } from "../data/mockData";

export default function ResultsPage() {
  const { searchQuery, activeResult, setActiveResult, navigate, setAuthMode } = useApp();
  const activeEntity = MOCK_ENTITIES[activeResult];

  return (
    <div className="page">
      <div className="grid-bg" />
      <Navbar />

      <div className="results-page">

        {/* Inline search bar */}
        <div style={{ marginBottom: 40 }}>
          <SearchBar />
        </div>

        {/* Results header */}
        <div className="results-header">
          <div className="results-query">Results for "{searchQuery}"</div>
          <div className="results-meta" style={{ marginTop: 6 }}>
            {MOCK_ENTITIES.length} entities found · Graph depth: 2 hops · Last updated: 2 hours ago
          </div>
        </div>

        <div className="results-layout">

          {/* ── LEFT: graph + entity cards ── */}
          <div>
            <div className="graph-preview" style={{ marginBottom: 28, marginTop: 0 }}>
              <div className="graph-preview-label">
                Entity relationship graph — {searchQuery}
              </div>
              <GraphViz query={searchQuery} />
            </div>

            {MOCK_ENTITIES.map((entity, i) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                active={i === activeResult}
                onClick={() => setActiveResult(i)}
              />
            ))}
          </div>

          {/* ── RIGHT: connections panel ── */}
          <div>
            <ConnectionsPanel
              entity={activeEntity}
              onExport={() => { setAuthMode("signup"); navigate("auth"); }}
            />
            <LegendPanel />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* ── Entity card ── */
function EntityCard({ entity, active, onClick }) {
  return (
    <div
      className="entity-card"
      onClick={onClick}
      style={{ borderColor: active ? "var(--gold)" : undefined }}
    >
      <div className="entity-head">
        <div>
          <div className="entity-name">{entity.name}</div>
          <div className="entity-type">{entity.type}</div>
        </div>
        <div className={`entity-badge${entity.status === "active" ? " active" : ""}`}>
          {entity.status === "active" ? "● Active" : "● Dissolved"}
        </div>
      </div>

      <div className="entity-meta">
        <div className="entity-meta-item"><strong>Reg No.</strong> {entity.number}</div>
        <div className="entity-meta-item"><strong>Incorporated</strong> {entity.incorporated}</div>
        <div className="entity-meta-item"><strong>Jurisdiction</strong> {entity.jurisdiction}</div>
        <div className="entity-meta-item"><strong>SIC</strong> {entity.sic}</div>
      </div>
    </div>
  );
}

/* ── Connections panel ── */
function ConnectionsPanel({ entity, onExport }) {
  return (
    <div className="connections-panel">
      <div className="connections-title">Connected entities</div>

      <div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
        {entity.name}
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-2)", marginBottom: 20, letterSpacing: "0.06em" }}>
        {entity.connections ? entity.connections.length : 0} connections mapped
      </div>

      {entity.connections ? (
        entity.connections.map((conn, i) => (
          <div className="conn-item" key={i}>
            <div
              className="conn-dot"
              style={{ background: conn.color, boxShadow: `0 0 6px ${conn.color}60` }}
            />
            <div>
              <div className="conn-name">{conn.name}</div>
              <div className="conn-rel">{conn.rel}</div>
            </div>
          </div>
        ))
      ) : (
        <div style={{ color: "var(--text-3)", fontSize: 13, fontFamily: "var(--mono)", padding: "20px 0" }}>
          Select a parent entity to view connections.
        </div>
      )}

      {entity.connections && (
        <button
          className="btn-gold"
          style={{ width: "100%", marginTop: 24 }}
          onClick={onExport}
        >
          Export full graph →
        </button>
      )}
    </div>
  );
}

/* ── Legend panel ── */
function LegendPanel() {
  return (
    <div style={{
      background: "var(--navy-2)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 24,
      marginTop: 16,
    }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em",
        textTransform: "uppercase", color: "var(--text-2)", marginBottom: 14,
      }}>
        Connection types
      </div>

      {CONNECTION_LEGEND.map(({ color, label }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "var(--text-2)" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
