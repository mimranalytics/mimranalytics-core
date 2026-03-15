# MIMR Analytics

**Graph-Based Corporate Intelligence Platform**

Search any company by name or registration number and explore its full network of subsidiaries, directors, shareholders, and parent entities through an interactive Cytoscape.js relationship graph.

---

## Prerequisites

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (bundled with Node.js)

```bash
node --version   # should be 18+
npm --version    # should be 9+
```

---

## Getting Started

```bash
# 1. Unzip or clone the project
unzip mimr-analytics-web-platfrom.zip
cd mimr-analytics-web-platfrom

# 2. Install all dependencies (React, Cytoscape.js, Vite)
npm install

# 3. Start the dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build optimised production bundle → `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Project Structure

```
mimr-analytics/
├── .env                              # Your API base URL (create this — not in git)
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                      # Entry point
    ├── App.jsx                       # Page router
    │
    ├── context/
    │   └── AppContext.jsx            # Global state (page, search, auth)
    │
    ├── services/
    │   └── graphApi.js               # ← API calls live here
    │
    ├── hooks/
    │   └── useEntityGraph.js         # Fetches + manages graph data
    │
    ├── data/
    │   └── mockData.js               # Mock data (used until real API is set)
    │
    ├── styles/
    │   ├── global.css
    │   └── components.css
    │
    ├── components/
    │   ├── CorporateGraph.jsx        # ← Main Cytoscape.js graph component
    │   ├── CorporateGraph.css        # Graph + panel styles
    │   ├── cytoscapeStyles.js        # Node/edge colour definitions
    │   ├── NodeDetailPanel.jsx       # Slide-in detail panel on node click
    │   ├── GraphToolbar.jsx          # Zoom / fit / reset buttons
    │   ├── GraphLegend.jsx           # Node type + edge legend overlay
    │   ├── Navbar.jsx
    │   ├── Footer.jsx
    │   ├── SearchBar.jsx
    │   └── CtaBanner.jsx
    │
    └── pages/
        ├── HomePage.jsx
        ├── AuthPage.jsx
        ├── ResultsPage.jsx           # Uses CorporateGraph
        └── AboutPage.jsx
```

---

## Connecting Your API

### 1. Create a `.env` file in the project root

```bash
VITE_API_BASE_URL=https://your-api.com
```

> Without this, the app runs on built-in mock data automatically.

### 2. Match your API response shapes

Edit `src/services/graphApi.js`. The three functions the app calls are:

#### `searchEntities(query)` → `SearchResult[]`

```js
// Expected response from GET /search?q=BP+PLC
[
  {
    id:           "bp-plc",
    name:         "BP PLC",
    regNumber:    "00102498",
    type:         "company",
    status:       "active",
    jurisdiction: "England & Wales"
  }
]
```

#### `fetchEntityGraph(entityId)` → `GraphPayload`

```js
// Expected response from GET /entity/bp-plc/graph
{
  entity: {
    id:             "bp-plc",
    name:           "BP PLC",
    regNumber:      "00102498",
    status:         "active",
    jurisdiction:   "England & Wales",
    incorporated:   "1909-04-14",
    address:        "1 St James's Square, London",
    sicCode:        "0610",
    sicDescription: "Extraction of crude petroleum",
    latestAccounts: "2023-12-31",
    officers: [
      { name: "Helge Lund", role: "Chairman", appointed: "2019-11-01" }
    ]
  },
  nodes: [
    { id: "bp-plc",        label: "BP PLC",               type: "company",     status: "active" },
    { id: "bp-subsidiary", label: "BP Exploration Co Ltd", type: "subsidiary",  status: "active" },
    { id: "helge-lund",    label: "Helge Lund",            type: "director",    role: "Chairman" },
    { id: "blackrock",     label: "BlackRock Inc",         type: "shareholder", ownership: "6.2%" }
  ],
  edges: [
    { id: "e1", source: "bp-plc",    target: "bp-subsidiary", relationship: "SUBSIDIARY_OF" },
    { id: "e2", source: "helge-lund",target: "bp-plc",        relationship: "DIRECTOR_OF"   },
    { id: "e3", source: "blackrock", target: "bp-plc",        relationship: "SHAREHOLDER_OF"}
  ]
}
```

#### `expandNode(nodeId)` → `{ nodes, edges }`

Called when a user double-clicks a node to lazy-load deeper connections.

```js
// Expected response from GET /entity/bp-subsidiary/connections
{
  nodes: [ { id: "...", label: "...", type: "subsidiary" } ],
  edges: [ { id: "...", source: "bp-subsidiary", target: "...", relationship: "SUBSIDIARY_OF" } ]
}
```

### Node types

| `type` value | Colour | Shape | Used for |
|---|---|---|---|
| `company` | Gold | Circle (large) | Root / searched entity |
| `subsidiary` | Cyan | Circle | Child companies |
| `parent` | Amber | Circle (medium) | Owning entities |
| `director` | Violet | Rounded rect | Individuals / officers |
| `shareholder` | Rose | Diamond | Investors |

### Edge relationship values

| `relationship` | Line style | Meaning |
|---|---|---|
| `SUBSIDIARY_OF` | Cyan dashed | Source is a subsidiary of target |
| `PARENT_OF` | Amber solid | Source is parent of target |
| `DIRECTOR_OF` | Violet dotted | Source person directs target company |
| `SHAREHOLDER_OF` | Rose dotted | Source holds shares in target |

---

## Graph Interactions

| Action | Result |
|---|---|
| **Click a node** | Highlights the node + its neighbours, opens detail panel |
| **Click background** | Clears selection |
| **Double-click a node** | Lazy-loads and renders deeper connections from API |
| **Drag a node** | Repositions it freely on the canvas |
| **Mouse wheel / pinch** | Zoom in and out |
| **Toolbar ⊞** | Fit the whole graph to screen |
| **Toolbar + / −** | Zoom in / out |
| **Toolbar ↺** | Re-run the force-directed layout |

---

## Building for Production

```bash
npm run build
```

The `dist/` folder can be deployed to:

- **Vercel** — `vercel deploy`  
- **Netlify** — drag and drop `dist/`  
- **GitHub Pages** — push `dist/` contents to `gh-pages` branch

---

## Tech Stack

| | |
|---|---|
| React 18 | UI framework |
| Vite 5 | Build tool |
| Cytoscape.js 3 | Graph engine |
| react-cytoscapejs | React wrapper for Cytoscape |
| CSS Custom Properties | Design system |
| IBM Plex Sans / Mono | Typography |
| Playfair Display | Display headings |

---

## Troubleshooting

**Graph does not appear**  
Make sure `cytoscape` and `react-cytoscapejs` installed correctly:
```bash
npm install cytoscape react-cytoscapejs
```

**API returns data but graph is empty**  
Check that your node `id` values in `nodes[]` match the `source` / `target` values in `edges[]`.

**Port already in use**
```bash
npm run dev -- --port 3000
```

**Environment variable not picked up**  
All Vite env vars must start with `VITE_`. Restart the dev server after editing `.env`.

---

*MIMR Analytics — Graph-Based Corporate Intelligence*
