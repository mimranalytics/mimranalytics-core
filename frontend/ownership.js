// frontend/ownership.js (safe panel rendering + Ownership/Governance toggle)
(function () {
  const API = "http://localhost:8000";

  const select = document.getElementById("companySelect");
  const renderBtn = document.getElementById("renderBtn");
  const effectiveToggle = document.getElementById("effectiveToggle");
  const panelTitle = document.getElementById("panelTitle");
  const panelBody = document.getElementById("panelBody");
  const viewRadios = document.querySelectorAll('input[name="view"]');

  // ---- helpers --------------------------------------------------------------

  function getView() {
    const v = [...viewRadios].find(r => r.checked)?.value;
    return v || "ownership";
  }

  function setEffectiveToggleVisibility() {
    const show = getView() === "ownership";
    const labelEl = effectiveToggle?.closest("label");
    if (labelEl) labelEl.style.display = show ? "inline-flex" : "none";
  }

  async function fetchCompanies() {
    const res = await fetch(`${API}/ownership/companies`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function fetchOwnership(companyId) {
    const url = `${API}/ownership/graph?company_id=${encodeURIComponent(companyId)}&include_holders=true&include_subs=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json(); // {nodes, edges}
  }

  async function fetchGovernance(companyId, limit = 200) {
    const url = `${API}/governance/full-graph?company_id=${encodeURIComponent(companyId)}&max_other_companies=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json(); // {nodes, edges}
  }

  function toCytoscape(cy, nodes, edges) {
    cy.elements().remove();
    cy.add(nodes || []);
    cy.add(edges || []);
    cy.layout({ name: 'breadthfirst', directed: true, padding: 24, spacingFactor: 1.1 }).run();
  }

  // Safe label helpers (NO split())
  function safeEl(cy, id) {
    if (!id) return null;
    const el = cy.getElementById(id);
    return (el && !el.empty()) ? el : null;
  }
  function safeLabelFromEl(el) {
    if (!el) return null;
    const lbl = el.data && el.data('label');
    return (lbl == null) ? null : String(lbl);
  }
  function nodeName(cy, id) {
    const el = safeEl(cy, id);
    const lbl = safeLabelFromEl(el);
    if (!lbl) return id || "(unknown)";
    const nl = lbl.indexOf('\n'); // labels look like "Name\n(id)"
    return nl >= 0 ? lbl.slice(0, nl) : lbl;
  }
  function edgeLabel(e) {
    const lbl = e?.data?.label;
    return (lbl == null) ? "" : String(lbl);
  }

  // Compute effective person ownership of the seed from % edge labels
  function computeEffectiveFromGraph(cy, seedId) {
    const out = {};
    cy.edges().forEach(e => {
      const src = e.data('source');
      const dst = e.data('target');
      const lbl = edgeLabel(e).trim();
      const pct = lbl.endsWith("%") ? parseFloat(lbl.replace("%", "")) : NaN;
      if (Number.isFinite(pct)) {
        (out[src] ||= []).push({ to: dst, w: pct / 100 });
      }
    });

    const persons = new Set(cy.nodes('[type = "person"]').map(n => n.id()));
    const effective = {};

    function dfs(curr, target, w, seen) {
      if (w <= 0 || seen.has(curr)) return;
      seen.add(curr);
      for (const nx of (out[curr] || [])) {
        const w2 = w * nx.w;
        if (nx.to === target) {
          effective[curr] = (effective[curr] || 0) + w2;
        } else {
          dfs(nx.to, target, w2, new Set(seen));
        }
      }
    }

    persons.forEach(pid => dfs(pid, seedId, 1.0, new Set()));

    return Object.entries(effective)
      .map(([pid, val]) => ({ id: pid, name: nodeName(cy, pid), percent: +(val * 100).toFixed(2) }))
      .sort((a, b) => b.percent - a.percent);
  }

  // ---- cytoscape ------------------------------------------------------------

  const cy = cytoscape({
    container: document.getElementById('cy'),
    layout: { name: 'breadthfirst', directed: true, padding: 24 },
    style: [
      { selector: 'node', style: {
        'label': 'data(label)',
        'text-wrap': 'wrap',
        'text-max-width': 160,
        'text-valign': 'center',
        'font-size': 11,
        'color': '#0f172a',
        'border-width': 1,
        'border-color': '#94a3b8',
        'background-color': '#e2e8f0'
      }},
      { selector: 'node[type="company"]', style: {
        'background-color': '#bfdbfe',
        'border-color': '#1e3a8a'
      }},
      { selector: 'node[type="person"]', style: {
        'background-color': '#bbf7d0',
        'border-color': '#166534'
      }},
      { selector: 'edge', style: {
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#64748b',
        'line-color': '#94a3b8',
        'width': 2,
        'label': 'data(label)',
        'font-size': 10,
        'text-background-color': '#ffffff',
        'text-background-opacity': 0.85,
        'text-background-padding': 2
      }},
      { selector: 'node:selected', style: {
        'border-width': 2, 'border-color': '#0ea5e9'
      }},
      { selector: '.dim', style: { 'opacity': 0.25 } }
    ],
    elements: []
  });

  cy.on('tap', 'node', (evt) => {
    const n = evt.target;
    cy.$('node,edge').addClass('dim');
    n.closedNeighborhood().removeClass('dim');
  });

  // ---- rendering ------------------------------------------------------------

  async function render(seedId) {
    setEffectiveToggleVisibility();
    panelBody.innerHTML = "Loading…";

    let nodes = [], edges = [];
    const view = getView();

    if (view === "governance") {
      ({ nodes, edges } = await fetchGovernance(seedId, 200));
    } else {
      ({ nodes, edges } = await fetchOwnership(seedId));
    }

    toCytoscape(cy, nodes, edges);

    // Title
    const title = nodeName(cy, seedId);
    panelTitle.textContent = `${title} (${seedId})`;

    if (view === "governance") {
      // People with roles on the seed company (person -> seed)
      const rolesOnSeed = (edges || [])
        .filter(e => e?.data?.target === seedId)
        .map(e => {
          const personId = e?.data?.source;
          const personName = nodeName(cy, personId);
          const label = edgeLabel(e) || "(role)";
          return `• ${personName} (${personId}) — ${label}`;
        })
        .join("<br/>") || "—";

      // Other mandates (person -> other company), exclude seed
      const otherMandates = (edges || [])
        .filter(e => e?.data?.target && e?.data?.target !== seedId)
        .map(e => {
          const pid = e?.data?.source;
          const oid = e?.data?.target;
          const personName = nodeName(cy, pid);
          const companyName = nodeName(cy, oid);
          const label = edgeLabel(e) || "(role)";
          return `• ${personName} → ${companyName} (${oid}) — ${label}`;
        })
        .join("<br/>") || "—";

      panelBody.innerHTML = `
        <h4>Board/Management on this company</h4>
        ${rolesOnSeed}
        <h4 style="margin-top:10px">Other mandates of those people</h4>
        ${otherMandates}
        <div style="margin-top:10px;color:#64748b;font-size:12px">
          Roles include Chair, CEO, BoardMember, Auditor, etc.
        </div>
      `;
    } else {
      // Ownership view: cap table (owner -> seed) and subsidiaries (seed -> sub)
      const cap = (edges || [])
        .filter(e => e?.data?.target === seedId && edgeLabel(e).trim().endsWith("%"))
        .map(e => {
          const ownerId = e?.data?.source;
          const ownerName = nodeName(cy, ownerId);
          return `• ${ownerName} (${ownerId}) — ${edgeLabel(e)}`;
        })
        .join("<br/>") || "—";

      const subs = (edges || [])
        .filter(e => e?.data?.source === seedId && edgeLabel(e).trim().endsWith("%"))
        .map(e => {
          const subId = e?.data?.target;
          const subName = nodeName(cy, subId);
          return `• ${subName} (${subId}) — ${edgeLabel(e)}`;
        })
        .join("<br/>") || "—";

      let effHtml = "";
      if (effectiveToggle?.checked) {
        const eff = computeEffectiveFromGraph(cy, seedId);
        const rows = eff.map(x => `<tr><td>${x.name} (${x.id})</td><td style="text-align:right">${x.percent}%</td></tr>`).join("");
        effHtml = `
          <h4>Effective ownership (persons)</h4>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr><th align="left">Owner</th><th align="right">Percent</th></tr></thead>
            <tbody>${rows || "<tr><td colspan='2'>—</td></tr>"}</tbody>
          </table>`;
      }

      panelBody.innerHTML = `
        <h4>Cap table (direct)</h4>
        ${cap}
        <h4 style="margin-top:10px">Subsidiaries</h4>
        ${subs}
        ${effHtml}
        <div style="margin-top:10px;color:#64748b;font-size:12px">
          Note: Effective ownership is computed via path-multiplication on % edges.
        </div>
      `;
    }
  }

  // ---- init ----------------------------------------------------------------

  (async () => {
    try {
      setEffectiveToggleVisibility();

      // Populate companies dropdown
      const list = await fetchCompanies();
      list.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.id})`;
        select.appendChild(opt);
      });
      if (list[0]) select.value = list[0].id;

      if (select.value) await render(select.value);
    } catch (err) {
      console.error(err);
      panelBody.textContent = "Could not load companies. Is the API running?";
    }
  })();

  renderBtn.addEventListener("click", () => {
    const seed = select.value;
    if (seed) { render(seed); }
  });

  viewRadios.forEach(r => r.addEventListener('change', () => {
    setEffectiveToggleVisibility();
    if (select.value) { render(select.value); }
  }));

  effectiveToggle?.addEventListener("change", () => {
    if (getView() === "ownership" && select.value) { render(select.value); }
  });

})(); // <— important: closes the IIFE
