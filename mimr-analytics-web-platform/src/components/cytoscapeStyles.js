/**
 * cytoscapeStyles.js
 * ─────────────────────────────────────────────────────────────
 * Cytoscape.js stylesheet for the MIMR corporate graph.
 *
 * Node types and their colours:
 *   company     → gold   (#c9a84c)  — the root / searched entity
 *   subsidiary  → cyan   (#4fc3c3)  — child companies
 *   parent      → amber  (#e8a838)  — owning entities
 *   director    → violet (#9b7fe8)  — individuals / officers
 *   shareholder → rose   (#e87f9b)  — investors
 *
 * Edge relationships:
 *   SUBSIDIARY_OF  → cyan dashed
 *   PARENT_OF      → amber solid
 *   DIRECTOR_OF    → violet dotted
 *   SHAREHOLDER_OF → rose dotted
 * ─────────────────────────────────────────────────────────────
 */

export const NODE_COLORS = {
  company:     { bg: "rgba(201,168,76,0.18)",  border: "#c9a84c", text: "#c9a84c" },
  subsidiary:  { bg: "rgba(79,195,195,0.15)",  border: "#4fc3c3", text: "#4fc3c3" },
  parent:      { bg: "rgba(232,168,56,0.15)",  border: "#e8a838", text: "#e8a838" },
  director:    { bg: "rgba(155,127,232,0.15)", border: "#9b7fe8", text: "#9b7fe8" },
  shareholder: { bg: "rgba(232,127,155,0.15)", border: "#e87f9b", text: "#e87f9b" },
};

export const EDGE_COLORS = {
  SUBSIDIARY_OF:  "#4fc3c3",
  PARENT_OF:      "#e8a838",
  DIRECTOR_OF:    "#9b7fe8",
  SHAREHOLDER_OF: "#e87f9b",
};

export const cytoscapeStylesheet = [
  /* ── Base node ── */
  {
    selector: "node",
    style: {
      width:                     60,
      height:                    60,
      shape:                     "ellipse",
      "background-color":        "#0e1724",
      "border-width":            2,
      "border-color":            "#c9a84c",
      "border-opacity":          0.6,
      label:                     "data(label)",
      "text-valign":             "bottom",
      "text-halign":             "center",
      "text-margin-y":           8,
      color:                     "#8a97aa",
      "font-size":               11,
      "font-family":             "'IBM Plex Sans', sans-serif",
      "font-weight":             500,
      "text-wrap":               "wrap",
      "text-max-width":          100,
      "text-overflow-wrap":      "whitespace",
      "overlay-padding":         6,
      "z-index":                 10,
      "transition-property":     "background-color, border-color, border-width, width, height",
      "transition-duration":     "0.2s",
    },
  },

  /* ── Node type variants ── */
  {
    selector: "node[type='company']",
    style: {
      width:              80,
      height:             80,
      "background-color": NODE_COLORS.company.bg,
      "border-color":     NODE_COLORS.company.border,
      "border-width":     2.5,
      color:              NODE_COLORS.company.text,
      "font-size":        12,
      "font-weight":      600,
    },
  },
  {
    selector: "node[type='subsidiary']",
    style: {
      "background-color": NODE_COLORS.subsidiary.bg,
      "border-color":     NODE_COLORS.subsidiary.border,
      color:              NODE_COLORS.subsidiary.text,
    },
  },
  {
    selector: "node[type='parent']",
    style: {
      width:              72,
      height:             72,
      "background-color": NODE_COLORS.parent.bg,
      "border-color":     NODE_COLORS.parent.border,
      color:              NODE_COLORS.parent.text,
    },
  },
  {
    selector: "node[type='director']",
    style: {
      shape:              "roundrectangle",
      width:              64,
      height:             40,
      "background-color": NODE_COLORS.director.bg,
      "border-color":     NODE_COLORS.director.border,
      color:              NODE_COLORS.director.text,
    },
  },
  {
    selector: "node[type='shareholder']",
    style: {
      shape:              "diamond",
      width:              56,
      height:             56,
      "background-color": NODE_COLORS.shareholder.bg,
      "border-color":     NODE_COLORS.shareholder.border,
      color:              NODE_COLORS.shareholder.text,
    },
  },

  /* ── Hover state ── */
  {
    selector: "node:active, node.hovered",
    style: {
      "border-width":  3,
      "border-opacity": 1,
      width:           76,
      height:          76,
    },
  },

  /* ── Selected node ── */
  {
    selector: "node:selected",
    style: {
      "border-width":     3,
      "border-color":     "#e2c57a",
      "border-opacity":   1,
      "background-color": "rgba(201,168,76,0.28)",
      color:              "#e2c57a",
      "z-index":          20,
    },
  },

  /* ── Expanded node indicator ── */
  {
    selector: "node.expanded",
    style: {
      "border-style": "double",
      "border-width":  4,
    },
  },

  /* ── Dimmed nodes (when another is selected) ── */
  {
    selector: "node.dimmed",
    style: {
      opacity: 0.25,
    },
  },

  /* ── Base edge ── */
  {
    selector: "edge",
    style: {
      width:                   1.5,
      "line-color":            "#2a3a52",
      "target-arrow-color":    "#2a3a52",
      "target-arrow-shape":    "triangle",
      "arrow-scale":           0.9,
      "curve-style":           "bezier",
      label:                   "data(label)",
      "font-size":             9,
      "font-family":           "'IBM Plex Mono', monospace",
      color:                   "#4a5568",
      "text-rotation":         "autorotate",
      "text-margin-y":         -8,
      "overlay-padding":       4,
      "transition-property":   "line-color, opacity, width",
      "transition-duration":   "0.2s",
    },
  },

  /* ── Edge relationship variants ── */
  {
    selector: "edge[relationship='SUBSIDIARY_OF']",
    style: {
      "line-color":         EDGE_COLORS.SUBSIDIARY_OF,
      "target-arrow-color": EDGE_COLORS.SUBSIDIARY_OF,
      "line-style":         "dashed",
      "line-dash-pattern":  [6, 3],
    },
  },
  {
    selector: "edge[relationship='PARENT_OF']",
    style: {
      "line-color":         EDGE_COLORS.PARENT_OF,
      "target-arrow-color": EDGE_COLORS.PARENT_OF,
      "line-style":         "solid",
      width:                2,
    },
  },
  {
    selector: "edge[relationship='DIRECTOR_OF']",
    style: {
      "line-color":         EDGE_COLORS.DIRECTOR_OF,
      "target-arrow-color": EDGE_COLORS.DIRECTOR_OF,
      "line-style":         "dotted",
      "line-dash-pattern":  [2, 4],
    },
  },
  {
    selector: "edge[relationship='SHAREHOLDER_OF']",
    style: {
      "line-color":         EDGE_COLORS.SHAREHOLDER_OF,
      "target-arrow-color": EDGE_COLORS.SHAREHOLDER_OF,
      "line-style":         "dotted",
      "line-dash-pattern":  [2, 4],
    },
  },

  /* ── Selected / highlighted edges ── */
  {
    selector: "edge:selected, edge.highlighted",
    style: {
      width:     2.5,
      opacity:   1,
      "z-index": 20,
    },
  },
  {
    selector: "edge.dimmed",
    style: {
      opacity: 0.1,
    },
  },
];
