/**
 * graphApi.js
 * ─────────────────────────────────────────────────────────────
 * Service layer — wired to the BolagsAPI (bolagsapi.se)
 *
 * SETUP: create a .env file in the project root containing:
 *   VITE_BOLAGSAPI_KEY=your_key_here
 *
 * Then restart the dev server: npm run dev
 *
 * Without a key the file falls back to built-in mock data.
 * ─────────────────────────────────────────────────────────────
 */

const BOLAGSAPI_BASE = "https://api.bolagsapi.se/v1";
const API_KEY        = import.meta.env.VITE_BOLAGSAPI_KEY ?? "";

// ── Startup log — check the browser console to confirm ──────
if (API_KEY && API_KEY.trim() !== "") {
  console.log(
    "%c[MIMR] BolagsAPI key loaded — using LIVE data",
    "color:#4fc3c3;font-weight:600;"
  );
} else {
  console.warn(
    "[MIMR] VITE_BOLAGSAPI_KEY not found — using mock data.\n" +
    "Create a .env file in the project root with:\n" +
    "  VITE_BOLAGSAPI_KEY=your_key_here\n" +
    "Then restart npm run dev."
  );
}

// Derived flag — true when we have a real key
const USE_MOCK = !API_KEY || API_KEY.trim() === "";

/* ── Low-level GET helper ─────────────────────────────────── */
async function bolagsGet(path) {
  const res = await fetch(`${BOLAGSAPI_BASE}${path}`, {
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Accept":        "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`BolagsAPI ${res.status} — ${path}: ${body}`);
  }
  return res.json();
}

/* ── Stable ID helper ─────────────────────────────────────── */
function toId(prefix, name) {
  return `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

/* ── Status normaliser ────────────────────────────────────── */
function normaliseStatus(raw) {
  if (!raw) return "unknown";
  const s = raw.toString().toLowerCase();
  if (s.includes("aktiv") || s.includes("active") || s === "1") return "active";
  if (s.includes("likvidation") || s.includes("dissolved"))      return "dissolved";
  return s;
}

/* ═══════════════════════════════════════════════════════════
   PUBLIC API
═══════════════════════════════════════════════════════════ */

/**
 * searchEntities(query)
 * Returns ALL results from BolagsAPI /search matching the query.
 * Falls back to mock data when no API key is set.
 */
export async function searchEntities(query) {
  if (USE_MOCK) return mockSearch(query);

  const data = await bolagsGet(`/search?q=${encodeURIComponent(query)}`);

  // BolagsAPI may return { results:[...] }, { companies:[...] }, or a bare array
  const raw = Array.isArray(data)
    ? data
    : (data.results ?? data.companies ?? data.hits ?? []);

  if (!raw.length) return [];

  return raw.map((c) => ({
    id:           c.org_number,
    name:         c.name,
    regNumber:    c.org_number,
    type:         "company",
    status:       normaliseStatus(c.status),
    jurisdiction: "Sweden",
  }));
}

/**
 * fetchEntityGraph(orgNumber)
 * Fetches company + board + owners + subsidiaries in parallel.
 * Assembles into { entity, nodes, edges } for Cytoscape.
 */
export async function fetchEntityGraph(orgNumber) {
  if (USE_MOCK) return mockEntityGraph(orgNumber);

  const [company, boardData, ownersData, subsData] = await Promise.all([
    bolagsGet(`/company/${orgNumber}`),
    bolagsGet(`/company/${orgNumber}/board`).catch(()         => ({ members: [] })),
    bolagsGet(`/company/${orgNumber}/owners`).catch(()        => ({ owners:  [] })),
    bolagsGet(`/company/${orgNumber}/subsidiaries`).catch(()  => ({ subsidiaries: [] })),
  ]);

  const board        = boardData.members        ?? boardData.board        ?? [];
  const owners       = ownersData.owners        ?? ownersData.shareholders ?? [];
  const subsidiaries = subsData.subsidiaries    ?? subsData.companies     ?? [];
  const rootId       = company.org_number;

  const nodes = [
    {
      id:     rootId,
      label:  company.name,
      type:   "company",
      status: normaliseStatus(company.status),
    },
    ...board.map((m) => ({
      id:    m.id ? `person-${m.id}` : toId("person", m.name),
      label: m.name,
      type:  "director",
      role:  m.role ?? m.title ?? "Board member",
    })),
    ...owners.map((o) => ({
      id:        o.org_number ?? toId("owner", o.name),
      label:     o.name,
      type:      "shareholder",
      ownership: o.share_percent != null ? `${o.share_percent}%` : "",
    })),
    ...subsidiaries.map((s) => ({
      id:     s.org_number,
      label:  s.name,
      type:   "subsidiary",
      status: normaliseStatus(s.status),
    })),
  ];

  const edges = [
    ...board.map((m, i) => ({
      id:           `e-board-${i}`,
      source:       m.id ? `person-${m.id}` : toId("person", m.name),
      target:       rootId,
      relationship: "DIRECTOR_OF",
    })),
    ...owners.map((o, i) => ({
      id:           `e-owner-${i}`,
      source:       o.org_number ?? toId("owner", o.name),
      target:       rootId,
      relationship: "SHAREHOLDER_OF",
    })),
    ...subsidiaries.map((s, i) => ({
      id:           `e-sub-${i}`,
      source:       rootId,
      target:       s.org_number,
      relationship: "SUBSIDIARY_OF",
    })),
  ];

  const addr = company.address ?? {};
  const entity = {
    id:             rootId,
    name:           company.name,
    regNumber:      company.org_number,
    type:           "company",
    status:         normaliseStatus(company.status),
    jurisdiction:   "Sweden",
    incorporated:   company.registration_date ?? "",
    address:        [addr.street, addr.postal_code, addr.city].filter(Boolean).join(", "),
    sicCode:        company.sni_code           ?? "",
    sicDescription: company.industry           ?? "",
    latestAccounts: company.latest_accounts    ?? "",
    officers: board.map((m) => ({
      name:      m.name,
      role:      m.role ?? m.title ?? "Board member",
      appointed: m.from_date ?? "",
    })),
  };

  return { entity, nodes, edges };
}

/**
 * expandNode(orgNumber)
 * Called on double-click. Loads one more hop of connections.
 */
export async function expandNode(orgNumber) {
  if (USE_MOCK) return mockExpandNode(orgNumber);

  if (orgNumber.startsWith("person-") || orgNumber.startsWith("owner-")) {
    return { nodes: [], edges: [] };
  }

  const [boardData, ownersData, subsData] = await Promise.all([
    bolagsGet(`/company/${orgNumber}/board`).catch(()        => ({ members: [] })),
    bolagsGet(`/company/${orgNumber}/owners`).catch(()       => ({ owners:  [] })),
    bolagsGet(`/company/${orgNumber}/subsidiaries`).catch(() => ({ subsidiaries: [] })),
  ]);

  const board        = boardData.members     ?? [];
  const owners       = ownersData.owners     ?? [];
  const subsidiaries = subsData.subsidiaries ?? [];

  const nodes = [
    ...board.map((m) => ({
      id:    m.id ? `person-${m.id}` : toId("person", m.name),
      label: m.name, type: "director", role: m.role ?? "Board member",
    })),
    ...owners.map((o) => ({
      id:        o.org_number ?? toId("owner", o.name),
      label:     o.name, type: "shareholder",
      ownership: o.share_percent != null ? `${o.share_percent}%` : "",
    })),
    ...subsidiaries.map((s) => ({
      id:     s.org_number, label: s.name,
      type:   "subsidiary", status: normaliseStatus(s.status),
    })),
  ];

  const edges = [
    ...board.map((m, i) => ({
      id: `ex-board-${orgNumber}-${i}`,
      source: m.id ? `person-${m.id}` : toId("person", m.name),
      target: orgNumber, relationship: "DIRECTOR_OF",
    })),
    ...owners.map((o, i) => ({
      id: `ex-owner-${orgNumber}-${i}`,
      source: o.org_number ?? toId("owner", o.name),
      target: orgNumber, relationship: "SHAREHOLDER_OF",
    })),
    ...subsidiaries.map((s, i) => ({
      id: `ex-sub-${orgNumber}-${i}`,
      source: orgNumber, target: s.org_number, relationship: "SUBSIDIARY_OF",
    })),
  ];

  return { nodes, edges };
}

/* ═══════════════════════════════════════════════════════════
   MOCK DATA  (used when VITE_BOLAGSAPI_KEY is not set)
═══════════════════════════════════════════════════════════ */

const MOCK_COMPANIES = [
  { id: "5592058798", name: "Spotify AB",              regNumber: "5592058798", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5590123456", name: "Spotify Technology SA",   regNumber: "5590123456", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5593001122", name: "Spotify Studios AB",      regNumber: "5593001122", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5560123456", name: "IKEA of Sweden AB",       regNumber: "5560123456", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5580001234", name: "Ingka Group BV",           regNumber: "5580001234", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5561000111", name: "IKEA Supply AG",           regNumber: "5561000111", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5561000222", name: "IKEA Industry AB",         regNumber: "5561000222", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5567890123", name: "Klarna Bank AB",           regNumber: "5567890123", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5512345678", name: "Volvo Cars AB",            regNumber: "5512345678", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5598765432", name: "H&M Hennes & Mauritz AB",  regNumber: "5598765432", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5534567890", name: "Ericsson AB",              regNumber: "5534567890", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5545678901", name: "Sandvik AB",               regNumber: "5545678901", type: "company", status: "active", jurisdiction: "Sweden" },
];

const MOCK_GRAPHS = {
  "5592058798": {
    entity: {
      id: "5592058798", name: "Spotify AB", regNumber: "5592058798",
      type: "company", status: "active", jurisdiction: "Sweden",
      incorporated: "2006-04-18", address: "Regeringsgatan 19, 111 53, Stockholm",
      sicCode: "5920", sicDescription: "Sound recording and music publishing",
      latestAccounts: "2023-12-31",
      officers: [
        { name: "Daniel Ek",        role: "CEO",      appointed: "2006-04-18" },
        { name: "Martin Lorentzon", role: "Chairman", appointed: "2006-04-18" },
        { name: "Paul Vogel",       role: "CFO",      appointed: "2020-01-01" },
      ],
    },
    nodes: [
      { id: "5592058798",        label: "Spotify AB",             type: "company",     status: "active"  },
      { id: "5590123456",        label: "Spotify Technology SA",  type: "parent",      status: "active"  },
      { id: "5593001122",        label: "Spotify Studios AB",     type: "subsidiary",  status: "active"  },
      { id: "5593009988",        label: "Soundtrack Your Brand",  type: "subsidiary",  status: "active"  },
      { id: "person-daniel-ek",         label: "Daniel Ek",        type: "director",    role: "CEO"       },
      { id: "person-martin-lorentzon",  label: "Martin Lorentzon", type: "director",    role: "Chairman"  },
      { id: "person-paul-vogel",        label: "Paul Vogel",       type: "director",    role: "CFO"       },
      { id: "owner-tencent",            label: "Tencent Holdings", type: "shareholder", ownership: "9.1%" },
      { id: "owner-baillie",            label: "Baillie Gifford",  type: "shareholder", ownership: "5.8%" },
    ],
    edges: [
      { id: "e1", source: "5590123456",                   target: "5592058798", relationship: "PARENT_OF"      },
      { id: "e2", source: "5592058798",                   target: "5593001122", relationship: "SUBSIDIARY_OF"  },
      { id: "e3", source: "5592058798",                   target: "5593009988", relationship: "SUBSIDIARY_OF"  },
      { id: "e4", source: "person-daniel-ek",             target: "5592058798", relationship: "DIRECTOR_OF"    },
      { id: "e5", source: "person-martin-lorentzon",      target: "5592058798", relationship: "DIRECTOR_OF"    },
      { id: "e6", source: "person-paul-vogel",            target: "5592058798", relationship: "DIRECTOR_OF"    },
      { id: "e7", source: "owner-tencent",                target: "5592058798", relationship: "SHAREHOLDER_OF" },
      { id: "e8", source: "owner-baillie",                target: "5592058798", relationship: "SHAREHOLDER_OF" },
    ],
  },

  "5560123456": {
    entity: {
      id: "5560123456", name: "IKEA of Sweden AB", regNumber: "5560123456",
      type: "company", status: "active", jurisdiction: "Sweden",
      incorporated: "1943-07-28", address: "Box 702, 343 81, Älmhult",
      sicCode: "4759", sicDescription: "Retail of furniture and household articles",
      latestAccounts: "2023-08-31",
      officers: [
        { name: "Jesper Brodin",         role: "CEO",      appointed: "2017-09-01" },
        { name: "Lars-Johan Jarnheimer", role: "Chairman", appointed: "2018-01-01" },
      ],
    },
    nodes: [
      { id: "5560123456",        label: "IKEA of Sweden AB",          type: "company",     status: "active"  },
      { id: "5580001234",        label: "Ingka Group BV",              type: "parent",      status: "active"  },
      { id: "5561000111",        label: "IKEA Supply AG",              type: "subsidiary",  status: "active"  },
      { id: "5561000222",        label: "IKEA Industry AB",            type: "subsidiary",  status: "active"  },
      { id: "person-jesper",            label: "Jesper Brodin",         type: "director",    role: "CEO"       },
      { id: "person-lars",              label: "Lars-Johan Jarnheimer", type: "director",    role: "Chairman"  },
      { id: "owner-stichting",          label: "Stichting INGKA Foundation", type: "shareholder", ownership: "100%" },
    ],
    edges: [
      { id: "e1", source: "5580001234",     target: "5560123456", relationship: "PARENT_OF"      },
      { id: "e2", source: "5560123456",     target: "5561000111", relationship: "SUBSIDIARY_OF"  },
      { id: "e3", source: "5560123456",     target: "5561000222", relationship: "SUBSIDIARY_OF"  },
      { id: "e4", source: "person-jesper",  target: "5560123456", relationship: "DIRECTOR_OF"    },
      { id: "e5", source: "person-lars",    target: "5560123456", relationship: "DIRECTOR_OF"    },
      { id: "e6", source: "owner-stichting",target: "5560123456", relationship: "SHAREHOLDER_OF" },
    ],
  },

  "5567890123": {
    entity: {
      id: "5567890123", name: "Klarna Bank AB", regNumber: "5567890123",
      type: "company", status: "active", jurisdiction: "Sweden",
      incorporated: "2005-01-10", address: "Sveavägen 46, 111 34, Stockholm",
      sicCode: "6419", sicDescription: "Other monetary intermediation",
      latestAccounts: "2023-12-31",
      officers: [
        { name: "Sebastian Siemiatkowski", role: "CEO",      appointed: "2005-01-10" },
        { name: "Victor Jacobsson",        role: "Co-founder", appointed: "2005-01-10" },
      ],
    },
    nodes: [
      { id: "5567890123",         label: "Klarna Bank AB",              type: "company",     status: "active"  },
      { id: "5567000001",         label: "Klarna Inc (USA)",            type: "subsidiary",  status: "active"  },
      { id: "5567000002",         label: "Klarna GmbH",                 type: "subsidiary",  status: "active"  },
      { id: "person-sebastian",           label: "Sebastian Siemiatkowski", type: "director",    role: "CEO"       },
      { id: "person-victor",              label: "Victor Jacobsson",       type: "director",    role: "Co-founder"},
      { id: "owner-sequoia",              label: "Sequoia Capital",        type: "shareholder", ownership: "22%"  },
      { id: "owner-softbank",             label: "SoftBank Vision Fund",   type: "shareholder", ownership: "18%"  },
    ],
    edges: [
      { id: "e1", source: "5567890123",      target: "5567000001", relationship: "SUBSIDIARY_OF"  },
      { id: "e2", source: "5567890123",      target: "5567000002", relationship: "SUBSIDIARY_OF"  },
      { id: "e3", source: "person-sebastian",target: "5567890123", relationship: "DIRECTOR_OF"    },
      { id: "e4", source: "person-victor",   target: "5567890123", relationship: "DIRECTOR_OF"    },
      { id: "e5", source: "owner-sequoia",   target: "5567890123", relationship: "SHAREHOLDER_OF" },
      { id: "e6", source: "owner-softbank",  target: "5567890123", relationship: "SHAREHOLDER_OF" },
    ],
  },
};

/* ── Mock search: matches name OR org number, returns ALL hits ── */
function mockSearch(query) {
  const q = query.trim().toLowerCase().replace(/[\s-]/g, "");
  return new Promise((resolve) =>
    setTimeout(() => {
      const results = MOCK_COMPANIES.filter((c) =>
        c.name.toLowerCase().replace(/\s/g, "").includes(q) ||
        c.regNumber.replace(/\D/g, "").includes(q)
      );
      resolve(results);
    }, 350)
  );
}

/* ── Mock graph: returns full graph or Spotify fallback ── */
function mockEntityGraph(id) {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve(MOCK_GRAPHS[id] ?? MOCK_GRAPHS["5592058798"]);
    }, 550)
  );
}

/* ── Mock expand: adds two generic child nodes ── */
function mockExpandNode(nodeId) {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve({
        nodes: [
          { id: `${nodeId}-x1`, label: "Related Entity A", type: "subsidiary", status: "active" },
          { id: `${nodeId}-x2`, label: "Related Entity B", type: "subsidiary", status: "active" },
        ],
        edges: [
          { id: `ex-1`, source: nodeId, target: `${nodeId}-x1`, relationship: "SUBSIDIARY_OF" },
          { id: `ex-2`, source: nodeId, target: `${nodeId}-x2`, relationship: "SUBSIDIARY_OF" },
        ],
      });
    }, 450)
  );
}