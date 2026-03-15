/**
 * graphApi.js
 * ─────────────────────────────────────────────────────────────
 * Service layer — wired to the BolagsAPI (bolagsapi.se)
 *
 * SETUP: create a .env file in the project root:
 *   VITE_BOLAGSAPI_KEY=your_key_here
 * Then restart: npm run dev
 * ─────────────────────────────────────────────────────────────
 */

const BOLAGSAPI_BASE = "https://api.bolagsapi.se/v1";
const API_KEY        = import.meta.env.VITE_BOLAGSAPI_KEY ?? "";

if (API_KEY && API_KEY.trim() !== "") {
  console.log("%c[MIMR] BolagsAPI key loaded — using LIVE data", "color:#4fc3c3;font-weight:600;");
} else {
  console.warn("[MIMR] VITE_BOLAGSAPI_KEY not found — using mock data.\nCreate .env with: VITE_BOLAGSAPI_KEY=your_key_here\nThen restart npm run dev.");
}

const USE_MOCK = !API_KEY || API_KEY.trim() === "";

/* ═══════════════════════════════════════════════════════════
   LOW-LEVEL FETCH
   Logs every raw response so you can inspect the exact field
   names BolagsAPI sends — open the browser console to see.
═══════════════════════════════════════════════════════════ */
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

  const json = await res.json();
  // ── RAW RESPONSE LOG ──────────────────────────────────────
  // Check browser DevTools → Console to see the exact fields
  // BolagsAPI returns. Once everything maps correctly you can
  // remove these console.log lines.
  console.log(`[BolagsAPI] GET ${path}`, json);
  return json;
}

/* ── Safe field reader — tries multiple possible key names ── */
function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

/* ── Stable slug ID ────────────────────────────────────────── */
function toId(prefix, name) {
  return `${prefix}-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

/* ── Status normaliser ─────────────────────────────────────── */
function normaliseStatus(raw) {
  if (raw === undefined || raw === null) return "unknown";
  const s = String(raw).toLowerCase().trim();

  // Active variants (Swedish + English + numeric)
  if (
    s === "aktiv"        ||
    s === "active"       ||
    s === "1"            ||
    s === "true"         ||
    s.includes("aktiv")  ||
    s.includes("active") ||
    s.includes("registrerat")
  ) return "active";

  // Dissolved variants
  if (
    s.includes("likvidation") ||
    s.includes("avregistrerad") ||
    s.includes("upplöst")      ||
    s.includes("dissolved")    ||
    s.includes("inactive")     ||
    s === "0"                  ||
    s === "false"
  ) return "dissolved";

  return s;
}

/* ═══════════════════════════════════════════════════════════
   PUBLIC API
═══════════════════════════════════════════════════════════ */

/**
 * searchEntities(query)
 * Searches by company name or org number.
 * Handles every known BolagsAPI array wrapper key.
 */
export async function searchEntities(query) {
  if (USE_MOCK) return mockSearch(query);

  const data = await bolagsGet(`/search?q=${encodeURIComponent(query)}`);

  // BolagsAPI wraps results under different keys depending on version —
  // try each one before falling back to treating the whole response as an array.
  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data.results)    ? data.results
    : Array.isArray(data.companies)  ? data.companies
    : Array.isArray(data.hits)       ? data.hits
    : Array.isArray(data.data)       ? data.data
    : [];

  // Log every key in the first result so we can see exactly what BolagsAPI sends
  if (raw.length > 0) {
    console.log("[MIMR] First search result keys:", Object.keys(raw[0]));
    console.log("[MIMR] First search result full:", raw[0]);
  }

  return raw.map((c) => {
    // Try every known org-number field name, then scan all values for a 10-digit number
    const orgNumber =
      pick(c, "org_number", "orgNumber", "organisationsnummer", "orgnr",
              "registration_number", "registrationNumber", "company_id") ??
      Object.values(c).find(
        (v) => typeof v === "string" && /^\d{6,10}$/.test(v.replace(/[\s-]/g, ""))
      )?.replace(/[\s-]/g, "");

    const name   = pick(c, "name", "company_name", "namn", "companyName", "foretagsnamn");
    const status = normaliseStatus(
      pick(c, "status", "company_status", "bolagsstatus", "active", "is_active", "aktiv")
    );

    console.log(`[MIMR] Mapped: id="${orgNumber}" name="${name}" status="${status}"`);

    return { id: orgNumber, name, regNumber: orgNumber, type: "company", status, jurisdiction: "Sweden" };
  });
}

/**
 * fetchEntityGraph(orgNumber)
 * Fetches company + board + owners + subsidiaries in parallel.
 */
export async function fetchEntityGraph(orgNumber) {
  if (USE_MOCK) return mockEntityGraph(orgNumber);

  const [company, boardData, ownersData, subsData] = await Promise.all([
    bolagsGet(`/company/${orgNumber}`),
    bolagsGet(`/company/${orgNumber}/board`).catch((e) => {
      console.warn("[MIMR] board endpoint error:", e.message);
      return {};
    }),
    bolagsGet(`/company/${orgNumber}/owners`).catch((e) => {
      console.warn("[MIMR] owners endpoint error:", e.message);
      return {};
    }),
    bolagsGet(`/company/${orgNumber}/subsidiaries`).catch((e) => {
      console.warn("[MIMR] subsidiaries endpoint error:", e.message);
      return {};
    }),
  ]);

  // ── Extract arrays from whatever wrapper key the API used ──
  const board = (
    pick(boardData,  "members", "board", "styrelse", "data", "results") ??
    (Array.isArray(boardData) ? boardData : [])
  );

  const owners = (
    pick(ownersData, "owners", "shareholders", "agare", "data", "results") ??
    (Array.isArray(ownersData) ? ownersData : [])
  );

  const subsidiaries = (
    pick(subsData,   "subsidiaries", "companies", "dotterbolag", "data", "results") ??
    (Array.isArray(subsData) ? subsData : [])
  );

  // Log raw API response so we can see the exact field names BolagsAPI sends
  console.log("[MIMR] Raw company keys:", Object.keys(company));
  console.log("[MIMR] Raw company:", company);
  console.log("[MIMR] board count:", board.length, "| owners count:", owners.length, "| subs count:", subsidiaries.length);
  if (board.length > 0)  console.log("[MIMR] First board member:", board[0]);
  if (owners.length > 0) console.log("[MIMR] First owner:", owners[0]);

  // Extract root ID — try every known field name, then scan for numeric org number
  const rootId =
    pick(company, "org_number", "orgNumber", "organisationsnummer", "orgnr",
                  "registration_number", "registrationNumber", "id", "company_id") ??
    Object.values(company).find(
      (v) => typeof v === "string" && /^[0-9]{6,10}$/.test(v.replace(/[\s-]/g, ""))
    )?.replace(/[\s-]/g, "") ??
    orgNumber;

  console.log("[MIMR] Resolved rootId:", rootId);

  // ── Nodes ──────────────────────────────────────────────────
  const nodes = [
    // Root company
    {
      id:     rootId,
      label:  pick(company, "name", "company_name", "namn") ?? orgNumber,
      type:   "company",
      status: normaliseStatus(
                pick(company, "status", "company_status", "bolagsstatus", "active", "is_active")
              ),
    },

    // Board members → director nodes
    ...board.map((m) => {
      const personId = pick(m, "id", "person_id") ? `person-${pick(m, "id", "person_id")}` : toId("person", pick(m, "name", "namn") ?? "unknown");
      return {
        id:    personId,
        label: pick(m, "name", "full_name", "namn") ?? "Unknown",
        type:  "director",
        role:  pick(m, "role", "title", "befattning", "roll") ?? "Board member",
      };
    }),

    // Owners → shareholder nodes
    ...owners.map((o) => {
      const ownerId = pick(o, "org_number", "orgNumber") ?? toId("owner", pick(o, "name", "namn") ?? "unknown");
      const pct     = pick(o, "share_percent", "sharePercent", "andel", "ownership_percent", "shares");
      return {
        id:        ownerId,
        label:     pick(o, "name", "company_name", "namn") ?? "Unknown owner",
        type:      "shareholder",
        ownership: pct != null ? `${pct}%` : "",
      };
    }),

    // Subsidiaries → subsidiary nodes
    ...subsidiaries.map((s) => ({
      id:     pick(s, "org_number", "orgNumber") ?? toId("sub", pick(s, "name", "namn") ?? "unknown"),
      label:  pick(s, "name", "company_name", "namn") ?? "Unknown subsidiary",
      type:   "subsidiary",
      status: normaliseStatus(pick(s, "status", "company_status", "bolagsstatus", "active")),
    })),
  ];

  // ── Edges ──────────────────────────────────────────────────
  const edges = [
    ...board.map((m, i) => {
      const personId = pick(m, "id", "person_id") ? `person-${pick(m, "id", "person_id")}` : toId("person", pick(m, "name", "namn") ?? "unknown");
      return { id: `e-board-${i}`, source: personId, target: rootId, relationship: "DIRECTOR_OF" };
    }),
    ...owners.map((o, i) => {
      const ownerId = pick(o, "org_number", "orgNumber") ?? toId("owner", pick(o, "name", "namn") ?? "unknown");
      return { id: `e-owner-${i}`, source: ownerId, target: rootId, relationship: "SHAREHOLDER_OF" };
    }),
    ...subsidiaries.map((s, i) => {
      const subId = pick(s, "org_number", "orgNumber") ?? toId("sub", pick(s, "name", "namn") ?? "unknown");
      return { id: `e-sub-${i}`, source: rootId, target: subId, relationship: "SUBSIDIARY_OF" };
    }),
  ];

  // ── EntityDetail for header + detail panel ─────────────────
  const addr = pick(company, "address", "adress") ?? {};
  const fullAddress = [
    pick(addr, "street", "gata", "street_address"),
    pick(addr, "postal_code", "postalCode", "postnummer"),
    pick(addr, "city", "stad", "postort"),
  ].filter(Boolean).join(", ");

  const entity = {
    id:             rootId,
    name:           pick(company, "name", "company_name", "namn") ?? orgNumber,
    regNumber:      rootId,
    type:           "company",
    status:         normaliseStatus(
                      pick(company, "status", "company_status", "bolagsstatus", "active", "is_active")
                    ),
    jurisdiction:   "Sweden",
    incorporated:   pick(company, "registration_date", "registrationDate", "registreringsdatum") ?? "",
    address:        fullAddress,
    sicCode:        pick(company, "sni_code", "sniCode", "sni") ?? "",
    sicDescription: pick(company, "industry", "sni_text", "bransch") ?? "",
    latestAccounts: pick(company, "latest_accounts", "latestAccounts", "senaste_arsredovisning") ?? "",
    officers: board.map((m) => ({
      name:      pick(m, "name", "full_name", "namn") ?? "Unknown",
      role:      pick(m, "role", "title", "befattning", "roll") ?? "Board member",
      appointed: pick(m, "from_date", "fromDate", "from", "appointed_date") ?? "",
    })),
  };

  return { entity, nodes, edges };
}

/**
 * expandNode(orgNumber)
 * Loads one more hop of connections when user double-clicks a node.
 */
export async function expandNode(orgNumber) {
  if (USE_MOCK) return mockExpandNode(orgNumber);

  // Person / owner nodes have no company endpoint — skip silently
  if (
    String(orgNumber).startsWith("person-") ||
    String(orgNumber).startsWith("owner-")
  ) {
    return { nodes: [], edges: [] };
  }

  const [boardData, ownersData, subsData] = await Promise.all([
    bolagsGet(`/company/${orgNumber}/board`).catch(() => ({})),
    bolagsGet(`/company/${orgNumber}/owners`).catch(() => ({})),
    bolagsGet(`/company/${orgNumber}/subsidiaries`).catch(() => ({})),
  ]);

  const board        = pick(boardData,  "members", "board", "styrelse", "data") ?? (Array.isArray(boardData) ? boardData : []);
  const owners       = pick(ownersData, "owners", "shareholders", "agare", "data") ?? (Array.isArray(ownersData) ? ownersData : []);
  const subsidiaries = pick(subsData,   "subsidiaries", "companies", "dotterbolag", "data") ?? (Array.isArray(subsData) ? subsData : []);

  const nodes = [
    ...board.map((m) => {
      const pid = pick(m, "id", "person_id") ? `person-${pick(m, "id", "person_id")}` : toId("person", pick(m, "name", "namn") ?? "unknown");
      return { id: pid, label: pick(m, "name", "full_name", "namn") ?? "Unknown", type: "director", role: pick(m, "role", "title", "befattning") ?? "Board member" };
    }),
    ...owners.map((o) => {
      const oid = pick(o, "org_number", "orgNumber") ?? toId("owner", pick(o, "name", "namn") ?? "unknown");
      const pct = pick(o, "share_percent", "sharePercent", "andel");
      return { id: oid, label: pick(o, "name", "company_name", "namn") ?? "Unknown", type: "shareholder", ownership: pct != null ? `${pct}%` : "" };
    }),
    ...subsidiaries.map((s) => ({
      id:     pick(s, "org_number", "orgNumber") ?? toId("sub", pick(s, "name", "namn") ?? "unknown"),
      label:  pick(s, "name", "company_name", "namn") ?? "Unknown",
      type:   "subsidiary",
      status: normaliseStatus(pick(s, "status", "company_status", "active")),
    })),
  ];

  const edges = [
    ...board.map((m, i) => {
      const pid = pick(m, "id", "person_id") ? `person-${pick(m, "id", "person_id")}` : toId("person", pick(m, "name", "namn") ?? "unknown");
      return { id: `ex-board-${orgNumber}-${i}`, source: pid, target: orgNumber, relationship: "DIRECTOR_OF" };
    }),
    ...owners.map((o, i) => {
      const oid = pick(o, "org_number", "orgNumber") ?? toId("owner", pick(o, "name", "namn") ?? "unknown");
      return { id: `ex-owner-${orgNumber}-${i}`, source: oid, target: orgNumber, relationship: "SHAREHOLDER_OF" };
    }),
    ...subsidiaries.map((s, i) => {
      const sid = pick(s, "org_number", "orgNumber") ?? toId("sub", pick(s, "name", "namn") ?? "unknown");
      return { id: `ex-sub-${orgNumber}-${i}`, source: orgNumber, target: sid, relationship: "SUBSIDIARY_OF" };
    }),
  ];

  return { nodes, edges };
}

/* ═══════════════════════════════════════════════════════════
   MOCK DATA  (used when VITE_BOLAGSAPI_KEY is not set)
═══════════════════════════════════════════════════════════ */

const MOCK_COMPANIES = [
  { id: "5592058798", name: "Spotify AB",             regNumber: "5592058798", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5590123456", name: "Spotify Technology SA",  regNumber: "5590123456", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5593001122", name: "Spotify Studios AB",     regNumber: "5593001122", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5560123456", name: "IKEA of Sweden AB",      regNumber: "5560123456", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5567890123", name: "Klarna Bank AB",          regNumber: "5567890123", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5512345678", name: "Volvo Cars AB",           regNumber: "5512345678", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5598765432", name: "H&M Hennes & Mauritz AB", regNumber: "5598765432", type: "company", status: "active", jurisdiction: "Sweden" },
  { id: "5534567890", name: "Ericsson AB",             regNumber: "5534567890", type: "company", status: "active", jurisdiction: "Sweden" },
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
      ],
    },
    nodes: [
      { id: "5592058798",       label: "Spotify AB",            type: "company",     status: "active"  },
      { id: "5590123456",       label: "Spotify Technology SA", type: "parent",      status: "active"  },
      { id: "5593001122",       label: "Spotify Studios AB",    type: "subsidiary",  status: "active"  },
      { id: "person-daniel",    label: "Daniel Ek",             type: "director",    role: "CEO"       },
      { id: "person-martin",    label: "Martin Lorentzon",      type: "director",    role: "Chairman"  },
      { id: "owner-tencent",    label: "Tencent Holdings",      type: "shareholder", ownership: "9.1%" },
    ],
    edges: [
      { id: "e1", source: "5590123456",    target: "5592058798", relationship: "PARENT_OF"      },
      { id: "e2", source: "5592058798",    target: "5593001122", relationship: "SUBSIDIARY_OF"  },
      { id: "e3", source: "person-daniel", target: "5592058798", relationship: "DIRECTOR_OF"    },
      { id: "e4", source: "person-martin", target: "5592058798", relationship: "DIRECTOR_OF"    },
      { id: "e5", source: "owner-tencent", target: "5592058798", relationship: "SHAREHOLDER_OF" },
    ],
  },
};

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

function mockEntityGraph(id) {
  return new Promise((resolve) =>
    setTimeout(() => resolve(MOCK_GRAPHS[id] ?? MOCK_GRAPHS["5592058798"]), 550)
  );
}

function mockExpandNode(nodeId) {
  return new Promise((resolve) =>
    setTimeout(() => resolve({
      nodes: [
        { id: `${nodeId}-x1`, label: "Related Entity A", type: "subsidiary", status: "active" },
        { id: `${nodeId}-x2`, label: "Related Entity B", type: "subsidiary", status: "active" },
      ],
      edges: [
        { id: "ex-1", source: nodeId, target: `${nodeId}-x1`, relationship: "SUBSIDIARY_OF" },
        { id: "ex-2", source: nodeId, target: `${nodeId}-x2`, relationship: "SUBSIDIARY_OF" },
      ],
    }), 450)
  );
}