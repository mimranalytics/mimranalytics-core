/**
 * GraphLegend.jsx
 * ─────────────────────────────────────────────────────────────
 * Compact overlay legend for node types and edge relationships.
 * ─────────────────────────────────────────────────────────────
 */

import { NODE_COLORS, EDGE_COLORS } from "./cytoscapeStyles";

const NODE_LEGEND = [
  { type: "company",     label: "Company"     },
  { type: "subsidiary",  label: "Subsidiary"  },
  { type: "parent",      label: "Parent"      },
  { type: "director",    label: "Director"    },
  { type: "shareholder", label: "Shareholder" },
];

const EDGE_LEGEND = [
  { rel: "SUBSIDIARY_OF",  label: "Subsidiary of",  style: "dashed" },
  { rel: "PARENT_OF",      label: "Parent of",      style: "solid"  },
  { rel: "DIRECTOR_OF",    label: "Director of",    style: "dotted" },
  { rel: "SHAREHOLDER_OF", label: "Shareholder of", style: "dotted" },
];

export default function GraphLegend() {
  return (
    <div className="gl-legend">
      <div className="gl-section-title">Nodes</div>
      {NODE_LEGEND.map(({ type, label }) => {
        const c = NODE_COLORS[type];
        return (
          <div className="gl-item" key={type}>
            <div className="gl-node-dot" style={{ background: c.bg, borderColor: c.border }} />
            <span className="gl-label">{label}</span>
          </div>
        );
      })}

      <div className="gl-divider" />

      <div className="gl-section-title">Edges</div>
      {EDGE_LEGEND.map(({ rel, label, style }) => (
        <div className="gl-item" key={rel}>
          <div className="gl-edge-line" style={{ borderColor: EDGE_COLORS[rel], borderStyle: style }} />
          <span className="gl-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
