// ─── SEARCH ───────────────────────────────────────────
//TODO: replace with real search results from data team once available. These are placeholders for now to illustrate the section layout and design.
export const SAMPLE_QUERIES = [
  "BP PLC",
  "Tesco Stores Ltd",
  "12345678",
  "Goldman Sachs",
];

// ─── ENTITIES / RESULTS ───────────────────────────────
export const MOCK_ENTITIES = [
  {
    id: 1,
    name: "BP PLC",
    type: "Parent Company",
    number: "00102498",
    status: "active",
    incorporated: "1909",
    jurisdiction: "England & Wales",
    sic: "Extraction of crude petroleum",
    connections: [
      { name: "BP Exploration Operating Co Ltd", rel: "Subsidiary",       color: "#4fc3c3" },
      { name: "BP Global Investments Ltd",       rel: "Subsidiary",       color: "#4fc3c3" },
      { name: "Lord J. Browne",                  rel: "Former Director",  color: "#c9a84c" },
      { name: "Helios Investment Partners",       rel: "Shareholder",      color: "#8b7cf6" },
      { name: "BP Pension Trustees Ltd",          rel: "Associated Entity",color: "#e8807a" },
      { name: "BP North America Inc",             rel: "Subsidiary",       color: "#4fc3c3" },
    ],
  },
  {
    id: 2,
    name: "BP Exploration Operating Co Ltd",
    type: "Subsidiary",
    number: "00305943",
    status: "active",
    incorporated: "1930",
    jurisdiction: "England & Wales",
    sic: "Support activities for petroleum & natural gas",
  },
  {
    id: 3,
    name: "BP Global Investments Ltd",
    type: "Subsidiary",
    number: "01088651",
    status: "active",
    incorporated: "1973",
    jurisdiction: "England & Wales",
    sic: "Activities of holding companies",
  },
  {
    id: 4,
    name: "BP Pension Trustees Ltd",
    type: "Associated Entity",
    number: "00949532",
    status: "active",
    incorporated: "1969",
    jurisdiction: "England & Wales",
    sic: "Pension funding",
  },
];

export const CONNECTION_LEGEND = [
  { color: "#4fc3c3", label: "Subsidiary / Child entity" },
  { color: "#c9a84c", label: "Director / Officer" },
  { color: "#8b7cf6", label: "Shareholder / Investor" },
  { color: "#e8807a", label: "Associated entity" },
];

// ─── SERVICES ─────────────────────────────────────────
export const SERVICES = [
  {
    icon: "⬡",
    title: "Corporate Graph Intelligence",
    desc: "Visualise the full network of any company — subsidiaries, shareholders, directors, and cross-holdings — in real-time through an interactive knowledge graph.",
  },
  {
    icon: "◎",
    title: "Entity Resolution",
    desc: "Automatically disambiguate and link entities across filings, jurisdictions, and databases. Identify aliases, shell structures, and beneficial ownership chains.",
  },
  {
    icon: "◇",
    title: "Risk & Compliance Screening",
    desc: "Surface adverse media, sanctions exposure, politically exposed persons, and regulatory flags across your entire supply chain and investment portfolio.",
  },
  {
    icon: "▣",
    title: "Ownership Trail Analysis",
    desc: "Trace UBO (Ultimate Beneficial Owner) chains through multiple layers of intermediary entities across 200+ jurisdictions with automated percentage attribution.",
  },
  {
    icon: "◈",
    title: "Director Network Mapping",
    desc: "Understand how directors and executives are connected across entities. Detect conflicts of interest, circular relationships, and hidden control structures.",
  },
  {
    icon: "⬟",
    title: "API & Data Integration",
    desc: "Embed MIMR intelligence directly into your existing workflows via REST API or webhook. Connect with your CRM, ERP, or compliance platform seamlessly.",
  },
];

// ─── STATS ────────────────────────────────────────────
//TODO: replace with real stats from data team once available. These are placeholders for now to illustrate the section layout and design.
export const STATS = [
  { num: "8.2M+",  label: "Companies indexed" },
  { num: "180+",   label: "Jurisdictions covered" },
  { num: "40M+",   label: "Director records" },
  { num: "99.97%", label: "Data accuracy rate" },
];

// ─── TEAM ─────────────────────────────────────────────
export const TEAM = [
  {
    initials: "Mr.",
    name: "Joakim",
    role: "Founder",
    bio: "abahshg agisag abiasd ahia abicbab baia hachchsachash caochaschch bvac biabcab boaics .",
    bg: "#1a2a20",
    fg: "#4fc3c3",
  },
  {
    initials: "Mr.",
    name: "Kevin",
    role: "Founder",
    bio: "abahshg agisag abiasd ahia abicbab baia hachchsachash caochaschch bvac biabcab boaics .",
    bg: "#1a1a2a",
    fg: "#8b7cf6",
  },
  {
    initials: "Mrs.",
    name: "Betelhem",
    role: "co-Founder",
    bio: "abahshg agisag abiasd ahia abicbab baia hachchsachash caochaschch bvac biabcab boaics .",
    bg: "#2a1a1a",
    fg: "#e8807a",
  },
];

// ─── VALUES ───────────────────────────────────────────
export const VALUES = [
  {
    n: "01",
    title: "Radical Transparency",
    desc: "We surface what others obscure. Our mission is to make corporate structures legible for anyone who needs to understand them.",
  },
  {
    n: "02",
    title: "Intelligence at Scale",
    desc: "Graph-based reasoning applied to millions of entities in real time — not static snapshots, but living relationship models.",
  },
  {
    n: "03",
    title: "Responsible Disclosure",
    desc: "We operate within legal frameworks and ethical guidelines. Data access is audited, purpose-limited, and jurisdiction-aware.",
  },
  {
    n: "04",
    title: "Built for Analysts",
    desc: "Designed by people who have sat at the analyst's desk. Every feature exists to reduce friction in real investigative workflows.",
  },
];

// ─── PLATFORM COVERAGE (About page) ──────────────────
export const COVERAGE = [
  { label: "UK Companies House",      pct: 100, color: "#c9a84c" },
  { label: "EU Business Registers",   pct: 87,  color: "#8b7cf6" },
  { label: "OpenCorporates",          pct: 78,  color: "#4fc3c3" },
  { label: "Beneficial Ownership Data",pct: 65,  color: "#c9a84c" },
];
