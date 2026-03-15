// Sample query suggestions shown on the hero search
export const SAMPLE_QUERIES = [
  "BP PLC",
  "Tesco Stores Ltd",
  "12345678",
  "Goldman Sachs",
];

// Mock entity results returned for any search query
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
    connections: [],
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
    connections: [],
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
    connections: [],
  },
];

// Connection-type colour legend
export const CONNECTION_LEGEND = [
  { color: "#4fc3c3", label: "Subsidiary / Child entity" },
  { color: "#c9a84c", label: "Director / Officer" },
  { color: "#8b7cf6", label: "Shareholder / Investor" },
  { color: "#e8807a", label: "Associated entity" },
];
