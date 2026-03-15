import { useState, useEffect } from "react";
import Navbar          from "../components/Navbar";
import Footer          from "../components/Footer";
import SearchBar       from "../components/SearchBar";
import CorporateGraph  from "../components/CorporateGraph";
import { useApp }      from "../context/AppContext";
import { searchEntities } from "../services/graphApi";
import { CONNECTION_LEGEND } from "../data/mockData";

export default function ResultsPage() {
  const { searchQuery, activeResult, setActiveResult, setAuthMode, navigate } = useApp();

  const [searchResults,    setSearchResults]    = useState([]);
  const [loadingSearch,    setLoadingSearch]    = useState(false);
  const [searchError,      setSearchError]      = useState(null);
  const [selectedEntity,   setSelectedEntity]   = useState(null);
  const [selectedNodeData, setSelectedNodeData] = useState(null);

  /* ── Run search whenever the query changes ── */
  useEffect(() => {
    if (!searchQuery) return;

    let cancelled = false;
    setLoadingSearch(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedEntity(null);
    setSelectedNodeData(null);

    searchEntities(searchQuery)
      .then((results) => {
        if (cancelled) return;
        setSearchResults(results);
        // Do NOT auto-select here — let the user click a card to trigger the graph
        // This makes the interaction obvious and avoids a silent graph failure on load
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[MIMR] searchEntities error:", err);
        setSearchError(err.message);
      })
      .finally(() => { if (!cancelled) setLoadingSearch(false); });

    return () => { cancelled = true; };
  }, [searchQuery]);

  const handleEntityClick = (entity, index) => {
    setSelectedEntity(entity);
    setActiveResult(index);
    setSelectedNodeData(null);
  };

  return (
    <div className="page">
      <div className="grid-bg" />
      <Navbar />

      <div className="results-page">

        {/* Search bar */}
        <div style={{ marginBottom: 32, maxWidth: 680 }}>
          <SearchBar />
        </div>

        {/* Header */}
        <div className="results-header">
          <div className="results-query">Results for "{searchQuery}"</div>
          <div className="results-meta" style={{ marginTop: 6 }}>
            {loadingSearch && "Searching…"}
            {!loadingSearch && searchError && `Search error: ${searchError}`}
            {!loadingSearch && !searchError && (
              searchResults.length === 0
                ? "No results found"
                : `${searchResults.length} ${searchResults.length === 1 ? "entity" : "entities"} found — click a result to load its graph`
            )}
          </div>
        </div>

        <div className="results-layout">

          {/* LEFT column */}
          <div>

            {/* ── Entity cards — always shown first ── */}
            {loadingSearch ? (
              <SkeletonCards />
            ) : searchResults.length === 0 && !searchError ? (
              <NoResults query={searchQuery} />
            ) : (
              searchResults.map((entity, i) => (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  isActive={i === activeResult}
                  onClick={() => handleEntityClick(entity, i)}
                />
              ))
            )}

            {/* ── Graph — rendered below cards, only after a card is clicked ── */}
            {selectedEntity && (
              <div style={{ marginTop: 28 }}>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em",
                  textTransform: "uppercase", color: "var(--text-3)",
                  marginBottom: 12, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", display: "inline-block" }} />
                  Entity relationship graph — {selectedEntity.name}
                </div>
                <CorporateGraph
                  key={selectedEntity.id}
                  entityId={selectedEntity.id}
                  onNodeSelect={setSelectedNodeData}
                />
              </div>
            )}

          </div>

          {/* RIGHT column — info panel + legend */}
          <div>
            <ConnectionsPanel
              entity={selectedEntity}
              nodeData={selectedNodeData}
              onExport={() => { setAuthMode("signup"); navigate("auth"); }}
            />
            <Legend />
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function EntityCard({ entity, isActive, onClick }) {
  return (
    <div
      className="entity-card"
      onClick={onClick}
      style={{ borderColor: isActive ? "var(--gold)" : undefined, cursor: "pointer" }}
    >
      <div className="entity-head">
        <div>
          <div className="entity-name">{entity.name}</div>
          <div className="entity-type">{entity.type || "Company"}</div>
        </div>
        <div className={`entity-badge${entity.status === "active" ? " active" : ""}`}>
          {entity.status === "active" ? "● Active" : "● Dissolved"}
        </div>
      </div>
      <div className="entity-meta">
        {entity.regNumber    && <div className="entity-meta-item"><strong>Reg No.</strong> {entity.regNumber}</div>}
        {entity.jurisdiction && <div className="entity-meta-item"><strong>Jurisdiction</strong> {entity.jurisdiction}</div>}
      </div>

      {/* Explicit visual affordance so user knows it's clickable */}
      {!isActive && (
        <div style={{
          marginTop: 14, fontSize: 11, fontFamily: "var(--mono)",
          color: "var(--text-3)", letterSpacing: "0.08em",
        }}>
          Click to view graph →
        </div>
      )}
    </div>
  );
}

function ConnectionsPanel({ entity, nodeData, onExport }) {
  const displayName = nodeData?.label || entity?.name || "—";
  const isNode      = !!nodeData;

  return (
    <div className="connections-panel">
      <div className="connections-title">
        {isNode ? "Selected node" : entity ? "Entity summary" : "Select a result"}
      </div>

      {!entity && !nodeData && (
        <div style={{ color: "var(--text-3)", fontSize: 13, fontFamily: "var(--mono)", padding: "12px 0", lineHeight: 1.7 }}>
          Search for a company above, then click a result card to load its graph.
        </div>
      )}

      {(entity || nodeData) && (
        <>
          <div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            {displayName}
          </div>

          {isNode && (
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-2)", marginBottom: 16, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {nodeData.type}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {isNode ? (
              <>
                {nodeData.role      && <PanelField label="Role"      value={nodeData.role} />}
                {nodeData.ownership && <PanelField label="Ownership" value={nodeData.ownership} />}
                {nodeData.status    && <PanelField label="Status"    value={nodeData.status} />}
              </>
            ) : (
              <>
                {entity.regNumber    && <PanelField label="Reg. No."     value={entity.regNumber} />}
                {entity.jurisdiction && <PanelField label="Jurisdiction" value={entity.jurisdiction} />}
                {entity.status       && <PanelField label="Status"       value={entity.status} />}
              </>
            )}
          </div>

          <button className="btn-gold" style={{ width: "100%", marginTop: 4 }} onClick={onExport}>
            Export full graph →
          </button>
        </>
      )}
    </div>
  );
}

function PanelField({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--text-2)" }}>{value}</div>
    </div>
  );
}

function Legend() {
  return (
    <div style={{ background: "var(--navy-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginTop: 16 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-2)", marginBottom: 14 }}>
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

function NoResults({ query }) {
  return (
    <div style={{ background: "var(--navy-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "48px 32px", textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 16, color: "var(--text-3)" }}>○</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No results found</div>
      <div style={{ fontSize: 13, color: "var(--text-2)" }}>
        No companies matched "{query}". Try a different name or Swedish org number.
      </div>
    </div>
  );
}

function SkeletonCards() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="entity-card" style={{ opacity: 0.35, pointerEvents: "none", marginBottom: 16 }}>
          <div style={{ height: 16, width: "45%", background: "var(--navy-4)", borderRadius: 4, marginBottom: 10 }} />
          <div style={{ height: 12, width: "65%", background: "var(--navy-3)", borderRadius: 4 }} />
        </div>
      ))}
    </>
  );
}
