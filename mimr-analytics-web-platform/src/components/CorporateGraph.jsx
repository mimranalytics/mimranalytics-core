/**
 * CorporateGraph.jsx
 * ─────────────────────────────────────────────────────────────
 * Full-featured Cytoscape.js corporate entity graph.
 *
 * Props:
 *   entityId   (string)   — ID of the root entity to visualise
 *   onNodeSelect (fn)     — called with node data when a node is tapped
 *
 * Features:
 *   • Cytoscape.js with cose-bilkent layout
 *   • Click node  → highlight neighbourhood + show detail panel
 *   • Double-click → expand lazy-loaded connections
 *   • Drag & reposition nodes
 *   • Zoom & pan (mouse wheel / pinch)
 *   • Toolbar: fit, zoom in/out, reset layout
 *   • Legend overlay
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState, useCallback } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import { useEntityGraph }    from "../hooks/useEntityGraph";
import { cytoscapeStylesheet, NODE_COLORS, EDGE_COLORS } from "./cytoscapeStyles";
import NodeDetailPanel       from "./NodeDetailPanel";
import GraphToolbar          from "./GraphToolbar";
import GraphLegend           from "./GraphLegend";
import "./CorporateGraph.css";

/* Cytoscape layout options */
const LAYOUT = {
  name:             "cose",
  animate:          true,
  animationDuration: 600,
  animationEasing:  "ease-out-cubic",
  nodeRepulsion:    () => 6000,
  idealEdgeLength:  () => 140,
  edgeElasticity:   () => 100,
  nestingFactor:    1.2,
  gravity:          0.4,
  numIter:          1000,
  initialTemp:      200,
  coolingFactor:    0.99,
  minTemp:          1.0,
  fit:              true,
  padding:          60,
  randomize:        false,
};

export default function CorporateGraph({ entityId, onNodeSelect }) {
  const cyRef                           = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [expandingId,  setExpandingId]  = useState(null);

  const { graphData, cyElements, loading, error, expandNode } = useEntityGraph(entityId);

  /* ── Wire up Cytoscape event handlers once the instance is ready ── */
  const onCyReady = useCallback((cy) => {
    cyRef.current = cy;

    /* Tap a node → select + highlight neighbourhood */
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const nodeData = node.data();

      // Dim everything else
      cy.elements().addClass("dimmed");
      node.removeClass("dimmed");
      node.neighborhood().removeClass("dimmed");

      setSelectedNode(nodeData);
      setPanelOpen(true);
      onNodeSelect?.(nodeData);
    });

    /* Tap background → clear selection */
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass("dimmed");
        setSelectedNode(null);
        setPanelOpen(false);
      }
    });

    /* Double-tap a node → lazy expand connections */
    cy.on("dbltap", "node", async (evt) => {
      const nodeId = evt.target.id();
      if (expandingId) return;

      evt.target.addClass("expanded");
      setExpandingId(nodeId);
      await expandNode(nodeId);
      setExpandingId(null);

      // Re-run layout after adding new nodes
      cy.layout({ ...LAYOUT, randomize: false, animate: true }).run();
    });

    /* Hover highlight */
    cy.on("mouseover", "node", (evt) => {
      evt.target.addClass("hovered");
      cy.container().style.cursor = "pointer";
    });
    cy.on("mouseout", "node", (evt) => {
      evt.target.removeClass("hovered");
      cy.container().style.cursor = "default";
    });
  }, [expandNode, expandingId, onNodeSelect]);

  /* ── Re-run layout when elements change ── */
  useEffect(() => {
    if (!cyRef.current || cyElements.length === 0) return;
    cyRef.current.layout(LAYOUT).run();
  }, [cyElements]);

  /* ── Toolbar actions ── */
  const fitGraph     = () => cyRef.current?.fit(undefined, 60);
  const zoomIn       = () => cyRef.current?.zoom({ level: cyRef.current.zoom() * 1.25, renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 } });
  const zoomOut      = () => cyRef.current?.zoom({ level: cyRef.current.zoom() * 0.8,  renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 } });
  const resetLayout  = () => cyRef.current?.layout({ ...LAYOUT, randomize: true, animate: true }).run();
  const closePanel   = () => { setPanelOpen(false); setSelectedNode(null); cyRef.current?.elements().removeClass("dimmed"); };

  /* ── Render states ── */
  if (loading) return <GraphSkeleton />;
  if (error)   return <GraphError message={error.message} />;
  if (!cyElements.length) return null;

  return (
    <div className="cg-wrapper">
      {/* Entity header */}
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

      {/* Graph canvas */}
      <div className="cg-canvas-wrap">
        <CytoscapeComponent
          elements={cyElements}
          stylesheet={cytoscapeStylesheet}
          layout={LAYOUT}
          cy={onCyReady}
          className="cg-canvas"
          minZoom={0.15}
          maxZoom={3}
          wheelSensitivity={0.15}
          boxSelectionEnabled={false}
          autounselectify={false}
        />

        {/* Expand spinner */}
        {expandingId && (
          <div className="cg-expand-hint">
            <span className="cg-spinner" />
            Loading connections…
          </div>
        )}

        {/* Toolbar */}
        <GraphToolbar
          onFit={fitGraph}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetLayout}
        />

        {/* Legend */}
        <GraphLegend />
      </div>

      {/* Detail panel */}
      <NodeDetailPanel
        node={selectedNode}
        entity={graphData?.entity}
        open={panelOpen}
        onClose={closePanel}
        onExpand={() => selectedNode && expandNode(selectedNode.id)}
      />

      {/* Hint */}
      <div className="cg-hint">
        Click node to inspect · Double-click to expand · Drag to reposition · Scroll to zoom
      </div>
    </div>
  );
}

/* ── Loading skeleton ─────────────────────────────────────── */
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

/* ── Error state ──────────────────────────────────────────── */
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
