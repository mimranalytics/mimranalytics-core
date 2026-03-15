/**
 * graphApi.js
 * ─────────────────────────────────────────────────────────────
 * Service layer for the MIMR Analytics corporate graph API.
 *
 * REAL API USAGE
 * ──────────────
 * Set your base URL in .env:
 *   VITE_API_BASE_URL=https://your-api.com
 *
 * Every function throws on non-2xx so callers can catch and
 * display errors without extra null-checking.
 *
 * MOCK FALLBACK
 * ─────────────
 * If VITE_API_BASE_URL is not set, all functions return
 * realistic mock data so the UI works without a live server.
 * ─────────────────────────────────────────────────────────────
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || null;

/* ── helpers ──────────────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res.json();
}

/* ─────────────────────────────────────────────────────────────
   EXPECTED API RESPONSE SHAPES
   ─────────────────────────────────────────────────────────────

   GET /search?q=BP+PLC
   → SearchResult[]
     { id, name, regNumber, type, status, jurisdiction, incorporated, sic }

   GET /entity/:id/graph
   → GraphPayload
     {
       entity:  EntityDetail,
       nodes:   GraphNode[],
       edges:   GraphEdge[],
     }

   EntityDetail:
     { id, name, regNumber, type, status, jurisdiction, incorporated, sic,
       address, sicCode, sicDescription, latestAccounts, officers[] }

   GraphNode:
     { id, label, type, status?, role? }
     type: "company" | "director" | "shareholder" | "subsidiary" | "parent"

   GraphEdge:
     { id, source, target, relationship }
     relationship: "SUBSIDIARY_OF" | "DIRECTOR_OF" | "SHAREHOLDER_OF" | "PARENT_OF"

   ─────────────────────────────────────────────────────────────
*/

/* ── SEARCH ───────────────────────────────────────────────── */
export async function searchEntities(query) {
  if (BASE_URL) return apiFetch(`/search?q=${encodeURIComponent(query)}`);
  return mockSearch(query);
}

/* ── ENTITY GRAPH ─────────────────────────────────────────── */
export async function fetchEntityGraph(entityId) {
  if (BASE_URL) return apiFetch(`/entity/${entityId}/graph`);
  return mockEntityGraph(entityId);
}

/* ── EXPAND NODE (lazy-load deeper connections) ───────────── */
export async function expandNode(nodeId) {
  if (BASE_URL) return apiFetch(`/entity/${nodeId}/connections`);
  return mockExpandNode(nodeId);
}

/* ══════════════════════════════════════════════════════════════
   MOCK DATA — remove once real API is wired
══════════════════════════════════════════════════════════════ */

const MOCK_DB = {
  "bp-plc": {
    entity: {
      id: "bp-plc",
      name: "BP PLC",
      regNumber: "00102498",
      type: "company",
      status: "active",
      jurisdiction: "England & Wales",
      incorporated: "1909-04-14",
      address: "1 St James's Square, London, SW1Y 4PD",
      sicCode: "0610",
      sicDescription: "Extraction of crude petroleum",
      latestAccounts: "2023-12-31",
      officers: [
        { name: "Helge Lund",       role: "Chairman",           appointed: "2019-11-01" },
        { name: "Murray Auchincloss", role: "Chief Executive",  appointed: "2023-01-13" },
        { name: "Kate Thomson",     role: "CFO",               appointed: "2023-10-01" },
      ],
    },
    nodes: [
      { id: "bp-plc",             label: "BP PLC",                         type: "company",     status: "active" },
      { id: "bp-exploration",     label: "BP Exploration Operating Co Ltd", type: "subsidiary",  status: "active" },
      { id: "bp-global-inv",      label: "BP Global Investments Ltd",      type: "subsidiary",  status: "active" },
      { id: "bp-pension",         label: "BP Pension Trustees Ltd",        type: "subsidiary",  status: "active" },
      { id: "bp-north-america",   label: "BP North America Inc",           type: "subsidiary",  status: "active" },
      { id: "helge-lund",         label: "Helge Lund",                     type: "director",    role: "Chairman" },
      { id: "murray-auchincloss", label: "Murray Auchincloss",             type: "director",    role: "CEO" },
      { id: "kate-thomson",       label: "Kate Thomson",                   type: "director",    role: "CFO" },
      { id: "blackrock",          label: "BlackRock Inc",                  type: "shareholder", ownership: "6.2%" },
      { id: "vanguard",           label: "Vanguard Group",                 type: "shareholder", ownership: "4.8%" },
    ],
    edges: [
      { id: "e1",  source: "bp-plc",         target: "bp-exploration",     relationship: "SUBSIDIARY_OF" },
      { id: "e2",  source: "bp-plc",         target: "bp-global-inv",      relationship: "SUBSIDIARY_OF" },
      { id: "e3",  source: "bp-plc",         target: "bp-pension",         relationship: "SUBSIDIARY_OF" },
      { id: "e4",  source: "bp-plc",         target: "bp-north-america",   relationship: "SUBSIDIARY_OF" },
      { id: "e5",  source: "helge-lund",     target: "bp-plc",             relationship: "DIRECTOR_OF" },
      { id: "e6",  source: "murray-auchincloss", target: "bp-plc",         relationship: "DIRECTOR_OF" },
      { id: "e7",  source: "kate-thomson",   target: "bp-plc",             relationship: "DIRECTOR_OF" },
      { id: "e8",  source: "blackrock",      target: "bp-plc",             relationship: "SHAREHOLDER_OF" },
      { id: "e9",  source: "vanguard",       target: "bp-plc",             relationship: "SHAREHOLDER_OF" },
    ],
  },

  "tesco-stores": {
    entity: {
      id: "tesco-stores",
      name: "Tesco Stores Ltd",
      regNumber: "00519500",
      type: "company",
      status: "active",
      jurisdiction: "England & Wales",
      incorporated: "1947-11-03",
      address: "Tesco House, Shire Park, Kestrel Way, Welwyn Garden City, AL7 1GA",
      sicCode: "4711",
      sicDescription: "Retail sale in non-specialised stores with food, beverages or tobacco predominating",
      latestAccounts: "2024-02-24",
      officers: [
        { name: "Ken Murphy",    role: "CEO",           appointed: "2020-10-01" },
        { name: "Imran Nawaz",   role: "CFO",           appointed: "2022-02-01" },
      ],
    },
    nodes: [
      { id: "tesco-stores",     label: "Tesco Stores Ltd",        type: "company",     status: "active" },
      { id: "tesco-plc",        label: "Tesco PLC",               type: "parent",      status: "active" },
      { id: "tesco-ireland",    label: "Tesco Ireland Ltd",       type: "subsidiary",  status: "active" },
      { id: "tesco-mobile",     label: "Tesco Mobile Ltd",        type: "subsidiary",  status: "active" },
      { id: "ken-murphy",       label: "Ken Murphy",              type: "director",    role: "CEO" },
      { id: "imran-nawaz",      label: "Imran Nawaz",             type: "director",    role: "CFO" },
      { id: "norges-bank",      label: "Norges Bank",             type: "shareholder", ownership: "3.1%" },
    ],
    edges: [
      { id: "e1", source: "tesco-plc",     target: "tesco-stores",  relationship: "PARENT_OF" },
      { id: "e2", source: "tesco-stores",  target: "tesco-ireland", relationship: "SUBSIDIARY_OF" },
      { id: "e3", source: "tesco-stores",  target: "tesco-mobile",  relationship: "SUBSIDIARY_OF" },
      { id: "e4", source: "ken-murphy",    target: "tesco-stores",  relationship: "DIRECTOR_OF" },
      { id: "e5", source: "imran-nawaz",   target: "tesco-stores",  relationship: "DIRECTOR_OF" },
      { id: "e6", source: "norges-bank",   target: "tesco-stores",  relationship: "SHAREHOLDER_OF" },
    ],
  },
};

const MOCK_SEARCH_INDEX = [
  { id: "bp-plc",       name: "BP PLC",          regNumber: "00102498", type: "company", status: "active", jurisdiction: "England & Wales" },
  { id: "bp-exploration", name: "BP Exploration Operating Co Ltd", regNumber: "00305943", type: "company", status: "active", jurisdiction: "England & Wales" },
  { id: "tesco-stores", name: "Tesco Stores Ltd", regNumber: "00519500", type: "company", status: "active", jurisdiction: "England & Wales" },
  { id: "tesco-plc",    name: "Tesco PLC",        regNumber: "00445790", type: "company", status: "active", jurisdiction: "England & Wales" },
];

function mockSearch(query) {
  const q = query.toLowerCase();
  return new Promise((res) =>
    setTimeout(() => {
      const results = MOCK_SEARCH_INDEX.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.regNumber.includes(q)
      );
      res(results.length ? results : MOCK_SEARCH_INDEX.slice(0, 2));
    }, 400)
  );
}

function mockEntityGraph(entityId) {
  return new Promise((res, rej) =>
    setTimeout(() => {
      const data = MOCK_DB[entityId] || MOCK_DB["bp-plc"];
      res(data);
    }, 600)
  );
}

function mockExpandNode(nodeId) {
  return new Promise((res) =>
    setTimeout(() => {
      res({
        nodes: [
          { id: `${nodeId}-child-1`, label: "Connected Entity A", type: "subsidiary", status: "active" },
          { id: `${nodeId}-child-2`, label: "Connected Entity B", type: "subsidiary", status: "active" },
        ],
        edges: [
          { id: `ex-1`, source: nodeId, target: `${nodeId}-child-1`, relationship: "SUBSIDIARY_OF" },
          { id: `ex-2`, source: nodeId, target: `${nodeId}-child-2`, relationship: "SUBSIDIARY_OF" },
        ],
      });
    }, 500)
  );
}
