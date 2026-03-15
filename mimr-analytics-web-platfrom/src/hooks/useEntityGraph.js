/**
 * useEntityGraph.js
 * Fetches entity graph data and converts it to Cytoscape elements.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchEntityGraph, expandNode as apiExpandNode } from "../services/graphApi";

/* Convert API node/edge arrays → Cytoscape element objects */
function buildElements(nodes = [], edges = []) {
  const nodeEls = nodes.map((n) => ({
    group: "nodes",
    data: {
      id:        n.id,
      label:     n.label,
      type:      n.type      || "company",
      status:    n.status    || "",
      role:      n.role      || "",
      ownership: n.ownership || "",
    },
  }));

  const edgeEls = edges.map((e) => ({
    group: "edges",
    data: {
      id:           e.id,
      source:       e.source,
      target:       e.target,
      relationship: e.relationship,
      label:        REL_LABELS[e.relationship] || e.relationship,
    },
  }));

  return [...nodeEls, ...edgeEls];
}

const REL_LABELS = {
  SUBSIDIARY_OF:  "Subsidiary",
  DIRECTOR_OF:    "Director",
  SHAREHOLDER_OF: "Shareholder",
  PARENT_OF:      "Parent",
};

export function useEntityGraph(entityId) {
  const [graphData,  setGraphData]  = useState(null);
  const [cyElements, setCyElements] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const expandedIds = useRef(new Set());

  /* ── Initial fetch ── */
  useEffect(() => {
    if (!entityId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setCyElements([]);
    expandedIds.current.clear();

    fetchEntityGraph(entityId)
      .then((data) => {
        if (cancelled) return;
        setGraphData(data);
        setCyElements(buildElements(data.nodes, data.edges));
        expandedIds.current.add(entityId);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("fetchEntityGraph error:", err);
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [entityId]);

  /* ── Lazy node expansion ── */
  const expandNode = useCallback(async (nodeId) => {
    if (expandedIds.current.has(nodeId)) return;
    expandedIds.current.add(nodeId);

    try {
      const { nodes: newNodes, edges: newEdges } = await apiExpandNode(nodeId);
      const newEls = buildElements(newNodes, newEdges);

      setCyElements((prev) => {
        const existingIds = new Set(prev.map((el) => el.data.id));
        const fresh = newEls.filter((el) => !existingIds.has(el.data.id));
        return [...prev, ...fresh];
      });
    } catch (err) {
      console.error("expandNode error:", err);
    }
  }, []);

  return { graphData, cyElements, loading, error, expandNode };
}
