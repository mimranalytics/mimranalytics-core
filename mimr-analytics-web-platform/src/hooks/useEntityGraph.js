/**
 * useEntityGraph.js
 * ─────────────────────────────────────────────────────────────
 * Manages fetching, caching, and expanding the corporate graph
 * for a given entity ID.
 *
 * Returns:
 *   graphData   – { entity, nodes, edges } from the API
 *   cyElements  – Cytoscape-formatted elements array
 *   loading     – boolean
 *   error       – Error | null
 *   expandNode  – (nodeId) => Promise — lazy-loads deeper connections
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchEntityGraph, expandNode as apiExpandNode } from "../services/graphApi";

export function useEntityGraph(entityId) {
  const [graphData,   setGraphData]   = useState(null);
  const [cyElements,  setCyElements]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  // Track which node IDs have already been expanded so we don't re-fetch
  const expandedIds = useRef(new Set());

  /* ── Build Cytoscape element list from API payload ── */
  const buildElements = useCallback((nodes, edges) => {
    const nodeEls = nodes.map((n) => ({
      group: "nodes",
      data: {
        id:           n.id,
        label:        n.label,
        type:         n.type,         // company | director | shareholder | subsidiary | parent
        status:       n.status || "",
        role:         n.role || "",
        ownership:    n.ownership || "",
      },
    }));

    const edgeEls = edges.map((e) => ({
      group: "edges",
      data: {
        id:           e.id,
        source:       e.source,
        target:       e.target,
        relationship: e.relationship, // SUBSIDIARY_OF | DIRECTOR_OF | SHAREHOLDER_OF | PARENT_OF
        label:        formatEdgeLabel(e.relationship),
      },
    }));

    return [...nodeEls, ...edgeEls];
  }, []);

  /* ── Initial load ── */
  useEffect(() => {
    if (!entityId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
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
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [entityId, buildElements]);

  /* ── Lazy expand a node ── */
  const expandNode = useCallback(async (nodeId) => {
    if (expandedIds.current.has(nodeId)) return; // already expanded
    expandedIds.current.add(nodeId);

    try {
      const { nodes: newNodes, edges: newEdges } = await apiExpandNode(nodeId);
      const newElements = buildElements(newNodes, newEdges);

      setCyElements((prev) => {
        // Deduplicate by ID before merging
        const existingIds = new Set(prev.map((el) => el.data.id));
        const fresh = newElements.filter((el) => !existingIds.has(el.data.id));
        return [...prev, ...fresh];
      });
    } catch (err) {
      console.error("Expand node failed:", err);
    }
  }, [buildElements]);

  return { graphData, cyElements, loading, error, expandNode };
}

/* ── Helpers ─────────────────────────────────────────────── */
function formatEdgeLabel(relationship) {
  const map = {
    SUBSIDIARY_OF:  "Subsidiary",
    DIRECTOR_OF:    "Director",
    SHAREHOLDER_OF: "Shareholder",
    PARENT_OF:      "Parent",
  };
  return map[relationship] || relationship;
}
