/**
 * ResultsPage.jsx
 * ─────────────────────────────────────────────────────────────
 * Fixes vs previous version:
 *   - CorporateGraph gets key={selectedEntity.id} so React fully
 *     unmounts + remounts Cytoscape when the user picks a different
 *     entity — without this the graph stays frozen on the first result
 *   - Error state shown if search fails
 *   - "No results" state shown when query returns empty
 * ─────────────────────────────────────────────────────────────
 */

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
        if (results.length > 0) {
          setSelectedEntity(results[0]);
          setActiveResult(0);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setSearchError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingSearch(false);
      });

    return () => { cancelled = true; };
  }, [searchQuery]);

  /* ── Clicking an entity card swaps the graph ── */
  const handleEntityClick = (entity, index) => {
    setSelectedEntity(entity);
    setActiveResult(index);
    setSelectedNodeData(null);   // clear any node selection from the old graph
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
            {!loadingSearch && searchError && `Error: ${searchError}`}
            {!loadingSearch && !searchError && `${searchResults.length} ${searchResults.length === 1 ? "entity" : "entities"} found`}
          </div>
        </div>

        <div className="results-layout">

          {/* LEFT: Graph + entity cards */}
          <div>

            {/* Graph — key forces a full remount when entity changes */}
            {loadingSearch ? (
              <GraphPlaceholder />
            ) : selectedEntity ? (
              <div style={{ marginBottom: 28 }}>
                <CorporateGraph
                  key={selectedEntity.id}
                  entityId={selectedEntity.id}
                  onNodeSelect={setSelectedNodeData}
                />
              </div>
            ) : !loadingSearch && !searchError && searchResults.length === 0 && (
              <NoResults query={searchQuery} />
            )}

            {/* Entity cards */}
            {loadingSearch ? (
              <SkeletonCards />
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
          </div>

          {/* RIGHT: Info panel + legend */}
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

/* ── Sub-components ──────────────────────────────────────── */

function EntityCard({ entity, isActive, onClick }) {
  return (
    <div
      className="entity-card"
      onClick={onClick}
      style={{ borderColor: isActive ? "var(--gold)" : undefined }}
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
    </div>
  );
}

function ConnectionsPanel({ entity, nodeData, onExport }) {
  const displayName = nodeData?.label || entity?.name || "—";
  const isNode      = !!nodeData;

  return (
    <div className="connections-panel">
      <div className="connections-title">
        {isNode ? "Selected node" : "Entity summary"}
      </div>

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
            {nodeData.role      && <PanelField label="Role"       value={nodeData.role} />}
            {nodeData.ownership && <PanelField label="Ownership"  value={nodeData.ownership} />}
            {nodeData.status    && <PanelField label="Status"     value={nodeData.status} />}
          </>
        ) : entity ? (
          <>
            {entity.regNumber    && <PanelField label="Reg. No."     value={entity.regNumber} />}
            {entity.jurisdiction && <PanelField label="Jurisdiction" value={entity.jurisdiction} />}
            {entity.status       && <PanelField label="Status"       value={entity.status} />}
          </>
        ) : (
          <div style={{ color: "var(--text-3)", fontSize: 13, fontFamily: "var(--mono)", padding: "12px 0" }}>
            Select a result or click a graph node to inspect it.
          </div>
        )}
      </div>

      <button className="btn-gold" style={{ width: "100%", marginTop: 4 }} onClick={onExport}>
        Export full graph →
      </button>
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

function GraphPlaceholder() {
  return (
    <div style={{ height: 400, background: "var(--navy-2)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.12em" }}>
        Loading graph…
      </div>
    </div>
  );
}

function NoResults({ query }) {
  return (
    <div style={{ background: "var(--navy-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "48px 32px", textAlign: "center", marginBottom: 28 }}>
      <div style={{ fontSize: 28, marginBottom: 16, color: "var(--text-3)" }}>○</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No results found</div>
      <div style={{ fontSize: 13, color: "var(--text-2)" }}>
        No companies matched "{query}". Try a different name or a 10-digit Swedish org number.
      </div>
    </div>
  );
}

function SkeletonCards() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="entity-card" style={{ opacity: 0.35, pointerEvents: "none" }}>
          <div style={{ height: 16, width: "45%", background: "var(--navy-4)", borderRadius: 4, marginBottom: 10 }} />
          <div style={{ height: 12, width: "65%", background: "var(--navy-3)", borderRadius: 4 }} />
        </div>
      ))}
    </>
  );
}
