import { useEffect, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import { useEntityGraph }  from "../hooks/useEntityGraph";
import { cytoscapeStylesheet } from "./cytoscapeStyles";
import NodeDetailPanel     from "./NodeDetailPanel";
import GraphToolbar        from "./GraphToolbar";
import GraphLegend         from "./GraphLegend";
import "./CorporateGraph.css";

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
  padding:           120,
  randomize:         true,
};

// After layout runs, clamp zoom so a single node doesn't fill the canvas
function clampZoom(cy) {
  if (cy.zoom() > 1.2) cy.zoom({ level: 1.2, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  cy.center();
}

export default function CorporateGraph({ entityId, onNodeSelect }) {
  const cyRef          = useRef(null);
  const wrapRef        = useRef(null);
  const expandRef      = useRef(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [expandingId,  setExpandingId]  = useState(null);

  const { graphData, cyElements, loading, error, expandNode } = useEntityGraph(entityId);

  expandRef.current = expandNode;

  /* ── Wire Cytoscape events ── */
  const handleCyInit = (cy) => {
    cyRef.current = cy;

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

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass("dimmed");
        setSelectedNode(null);
        setPanelOpen(false);
      }
    });

    cy.on("dbltap", "node", async (evt) => {
      const nodeId = evt.target.id();
      evt.target.addClass("expanded");
      setExpandingId(nodeId);
      await expandRef.current(nodeId);
      setExpandingId(null);
      setTimeout(() => cy.layout({ ...LAYOUT, randomize: false }).run(), 50);
    });

    cy.on("mouseover", "node", (evt) => {
      evt.target.addClass("hovered");
      cy.container().style.cursor = "pointer";
    });
    cy.on("mouseout", "node", (evt) => {
      evt.target.removeClass("hovered");
      cy.container().style.cursor = "default";
    });
  };

  /* ── Run layout when elements load ── */
  useEffect(() => {
    if (!cyRef.current || cyElements.length === 0) return;
    const t = setTimeout(() => {
      cyRef.current.resize();
      const layout = cyRef.current.layout(LAYOUT);
      layout.on("layoutstop", () => clampZoom(cyRef.current));
      layout.run();
    }, 100);
    return () => clearTimeout(t);
  }, [cyElements]);

  /* ── ResizeObserver ── */
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

  /* ── Toolbar ── */
  const fitGraph    = () => cyRef.current?.fit(undefined, 80);
  const zoomIn      = () => { const cy = cyRef.current; if (!cy) return; cy.zoom({ level: cy.zoom() * 1.3, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }); };
  const zoomOut     = () => { const cy = cyRef.current; if (!cy) return; cy.zoom({ level: cy.zoom() * 0.77, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }); };
  const resetLayout = () => cyRef.current?.layout({ ...LAYOUT, randomize: true }).run();
  const closePanel  = () => { setPanelOpen(false); setSelectedNode(null); cyRef.current?.elements().removeClass("dimmed"); };

  /* ── Render states ── */
  if (loading) return <GraphSkeleton entityId={entityId} />;
  if (error)   return <GraphError message={error.message} entityId={entityId} />;

  // Graph loaded but came back empty — show a clear message instead of blank space
  if (!cyElements.length) return (
    <div className="cg-wrapper">
      <div className="cg-error">
        <div className="cg-error-icon">◎</div>
        <div className="cg-error-title">No graph data returned</div>
        <div className="cg-error-msg">
          The API returned no nodes for <code style={{ color: "var(--gold)", fontFamily: "var(--mono)", fontSize: 11 }}>{entityId}</code>.
          <br />Check the browser console for the raw API response.
        </div>
      </div>
    </div>
  );

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

        <GraphToolbar onFit={fitGraph} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetLayout} />
        <GraphLegend />
      </div>

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

function GraphSkeleton({ entityId }) {
  return (
    <div className="cg-wrapper">
      <div className="cg-skeleton">
        <div className="cg-skeleton-pulse" />
        <div className="cg-skeleton-label">
          Loading graph for {entityId}…
        </div>
      </div>
    </div>
  );
}

function GraphError({ message, entityId }) {
  return (
    <div className="cg-wrapper">
      <div className="cg-error">
        <div className="cg-error-icon">⚠</div>
        <div className="cg-error-title">Graph failed to load</div>
        <div className="cg-error-msg">
          <code style={{ color: "var(--gold)", fontFamily: "var(--mono)", fontSize: 11 }}>{entityId}</code>
          <br />{message}
          <br /><br />
          <span style={{ color: "var(--text-3)", fontSize: 11 }}>
            Check the browser console for the full API response.
          </span>
        </div>
      </div>
    </div>
  );
}
