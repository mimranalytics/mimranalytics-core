/**
 * CorporateGraph.jsx
 * ─────────────────────────────────────────────────────────────
 * Full-featured Cytoscape.js corporate entity graph.
 *
 * Fixes applied vs original:
 *  - Canvas given explicit px height (Cytoscape can't measure % in flex)
 *  - cy callback uses useRef not useCallback to avoid stale closures
 *  - ResizeObserver calls cy.resize() + fit() when container size changes
 *  - Layout runs after a tick delay so DOM is settled before positioning
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import { useEntityGraph }  from "../hooks/useEntityGraph";
import { cytoscapeStylesheet } from "./cytoscapeStyles";
import NodeDetailPanel     from "./NodeDetailPanel";
import GraphToolbar        from "./GraphToolbar";
import GraphLegend         from "./GraphLegend";
import "./CorporateGraph.css";

/* ── Layout config ─────────────────────────────────────────── */
const LAYOUT = {
  name:              "cose",
  animate:           true,
  animationDuration: 800,
  nodeRepulsion:     () => 8000,
  idealEdgeLength:   () => 150,
  edgeElasticity:    () => 100,
  gravity:           0.3,
  numIter:           1000,
  initialTemp:       200,
  coolingFactor:     0.99,
  minTemp:           1.0,
  fit:               true,
  padding:           80,
  randomize:         true,
};

export default function CorporateGraph({ entityId, onNodeSelect }) {
  const cyRef          = useRef(null);       // holds the cytoscape instance
  const wrapRef        = useRef(null);       // holds the canvas-wrap DOM node
  const expandRef      = useRef(null);       // keeps expandNode stable in event handlers

  const [selectedNode, setSelectedNode] = useState(null);
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [expandingId,  setExpandingId]  = useState(null);

  const { graphData, cyElements, loading, error, expandNode } = useEntityGraph(entityId);

  // Keep expandRef current without re-wiring Cytoscape events
  expandRef.current = expandNode;

  /* ── Wire Cytoscape events — called once by react-cytoscapejs ── */
  const handleCyInit = (cy) => {
    cyRef.current = cy;

    // Tap node → highlight + open panel
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const data = node.data();
      cy.elements().addClass("dimmed");
      node.removeClass("dimmed");
      node.neighborhood().removeClass("dimmed");
      setSelectedNode(data);
      setPanelOpen(true);
      onNodeSelect?.(data);
    });

    // Tap background → clear
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass("dimmed");
        setSelectedNode(null);
        setPanelOpen(false);
      }
    });

    // Double-tap node → expand connections
    cy.on("dbltap", "node", async (evt) => {
      const nodeId = evt.target.id();
      evt.target.addClass("expanded");
      setExpandingId(nodeId);
      await expandRef.current(nodeId);
      setExpandingId(null);
      setTimeout(() => cy.layout({ ...LAYOUT, randomize: false }).run(), 50);
    });

    // Hover cursor
    cy.on("mouseover", "node", (evt) => {
      evt.target.addClass("hovered");
      cy.container().style.cursor = "pointer";
    });
    cy.on("mouseout", "node", (evt) => {
      evt.target.removeClass("hovered");
      cy.container().style.cursor = "default";
    });
  };

  /* ── Run layout whenever elements are loaded / updated ── */
  useEffect(() => {
    if (!cyRef.current || cyElements.length === 0) return;
    // Small delay lets the DOM finish painting before Cytoscape positions nodes
    const t = setTimeout(() => {
      cyRef.current.resize();
      cyRef.current.layout(LAYOUT).run();
    }, 100);
    return () => clearTimeout(t);
  }, [cyElements]);

  /* ── ResizeObserver: re-fit if the container changes size ── */
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      if (!cyRef.current) return;
      cyRef.current.resize();
      cyRef.current.fit(undefined, 80);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  /* ── Toolbar actions ── */
  const fitGraph    = () => cyRef.current?.fit(undefined, 80);
  const zoomIn      = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() * 1.3, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };
  const zoomOut     = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() * 0.77, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };
  const resetLayout = () => cyRef.current?.layout({ ...LAYOUT, randomize: true }).run();
  const closePanel  = () => {
    setPanelOpen(false);
    setSelectedNode(null);
    cyRef.current?.elements().removeClass("dimmed");
  };

  /* ── Render states ── */
  if (loading) return <GraphSkeleton />;
  if (error)   return <GraphError message={error.message} />;
  if (!cyElements.length) return null;

  return (
    <div className="cg-wrapper">

      {/* Header */}
      {graphData?.entity && (
        <div className="cg-header">
          <div className="cg-header-name">{graphData.entity.name}</div>
          <div className="cg-header-meta">
            <span className="cg-meta-tag">{graphData.entity.regNumber}</span>
            <span className="cg-meta-tag">{graphData.entity.jurisdiction}</span>
            <span className={`cg-status ${graphData.entity.status}`}>
              ● {graphData.entity.status}
            </span>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="cg-canvas-wrap" ref={wrapRef}>
        <CytoscapeComponent
          elements={CytoscapeComponent.normalizeElements(cyElements)}
          stylesheet={cytoscapeStylesheet}
          layout={LAYOUT}
          cy={handleCyInit}
          className="cg-canvas"
          minZoom={0.1}
          maxZoom={4}
          wheelSensitivity={0.1}
          boxSelectionEnabled={false}
          autounselectify={false}
        />

        {expandingId && (
          <div className="cg-expand-hint">
            <span className="cg-spinner" />
            Loading connections…
          </div>
        )}

        <GraphToolbar
          onFit={fitGraph}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetLayout}
        />

        <GraphLegend />
      </div>

      {/* Slide-in detail panel */}
      <NodeDetailPanel
        node={selectedNode}
        entity={graphData?.entity}
        open={panelOpen}
        onClose={closePanel}
        onExpand={() => selectedNode && expandRef.current(selectedNode.id)}
      />

      <div className="cg-hint">
        Click node to inspect · Double-click to expand · Drag to reposition · Scroll to zoom
      </div>
    </div>
  );
}

function GraphSkeleton() {
  return (
    <div className="cg-wrapper">
      <div className="cg-skeleton">
        <div className="cg-skeleton-pulse" />
        <div className="cg-skeleton-label">Loading entity graph…</div>
      </div>
    </div>
  );
}

function GraphError({ message }) {
  return (
    <div className="cg-wrapper">
      <div className="cg-error">
        <div className="cg-error-icon">⚠</div>
        <div className="cg-error-title">Graph failed to load</div>
        <div className="cg-error-msg">{message}</div>
      </div>
    </div>
  );
}
