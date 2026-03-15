# MIMR Analytics

**Graph-Based Corporate Intelligence Platform**

Search any company by name or registration number and explore its full network of subsidiaries, directors, shareholders, and associated entities through an interactive relationship graph.

---

## Prerequisites

Make sure you have the following installed before getting started:

- **Node.js** v18 or higher — [download at nodejs.org](https://nodejs.org)
- **npm** v9 or higher (comes bundled with Node.js)

To check your versions, run:

```bash
node --version
npm --version
```

---

## Getting Started

### 1. Clone or download the project

If you have the zip file:

```bash
unzip mimr-analytics.zip
cd mimr-analytics
```

If you are cloning from Git:

```bash
git clone <https://github.com/mimranalytics/mimranalytics-core.git>
cd mimr-analytics
```

### 2. Install dependencies

This downloads all required packages into a local `node_modules/` folder:

```bash
npm install
```

> This only needs to be run once, or again whenever `package.json` changes.

### 3. Start the development server

```bash
npm run dev
```

You should see output like:

```
  VITE v5.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and go to **http://localhost:5173**

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server with hot reload |
| `npm run build` | Build optimised production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Project Structure

```
mimr-analytics/
├── index.html                        # HTML entry point (loads Google Fonts)
├── package.json                      # Project dependencies and scripts
├── vite.config.js                    # Vite build configuration
├── .gitignore                        # Files excluded from Git
└── src/
    ├── main.jsx                      # React root — mounts App inside AppProvider
    ├── App.jsx                       # Page router (switches on page state)
    │
    ├── context/
    │   └── AppContext.jsx            # Global state: page, search, auth, scroll
    │
    ├── data/
    │   └── mockData.js               # All static content and mock entity data
    │
    ├── styles/
    │   ├── global.css                # CSS variables, resets, shared utilities
    │   └── components.css            # All component-level styles
    │
    ├── components/                   # Reusable UI components
    │   ├── Navbar.jsx                # Fixed navigation bar
    │   ├── Footer.jsx                # Site footer with links
    │   ├── SearchBar.jsx             # Search input with sample query pills
    │   ├── CtaBanner.jsx             # Reusable call-to-action banner
    │   └── GraphViz.jsx              # Animated SVG entity relationship graph
    │
    └── pages/                        # One component per page
        ├── HomePage.jsx              # Hero, search, stats, services grid
        ├── AuthPage.jsx              # Sign In / Sign Up with tabbed form
        ├── ResultsPage.jsx           # Entity list, graph view, connections panel
        └── AboutPage.jsx            # Company story, team, values, coverage
```

---

## Pages & Features

### Home (`/`)
- Hero section with animated entity graph preview
- Search box — type a company name or registration number and press Enter
- Sample query pills (BP PLC, Tesco Stores Ltd, etc.) for quick demos
- Platform statistics
- Services grid (6 intelligence products)

### Search Results
- Triggered by any search from the home page or results page
- Interactive SVG graph showing connected entities
- Scrollable list of matched entities with registration details
- Sticky right panel showing connections for the selected entity
- Colour-coded connection legend (subsidiaries, directors, shareholders, associates)

### Auth (`/auth`)
- Tabbed Sign In / Sign Up interface
- Form validation with success confirmation state
- Switches automatically back to home after 2.8 seconds on success

### About (`/about`)
- Company story and mission
- Data source coverage bars (Companies House, SEC, sanctions lists, etc.)
- Core values
- Founding team profiles

---

## Navigation

The app uses **client-side state routing** (no URL changes). Navigation is handled through `AppContext`:

```jsx
const { navigate } = useApp();
navigate("home");     // Home page
navigate("auth");     // Sign In / Sign Up
navigate("results");  // Search results
navigate("about");    // About page
```

---

## Connecting to a Real API

All entity data currently comes from `src/data/mockData.js`. To connect a live backend:

1. Open `src/context/AppContext.jsx`
2. Replace the `doSearch` function with a real API call:

```jsx
const doSearch = async (query) => {
  const term = query || searchInput;
  if (!term.trim()) return;
  setSearchQuery(term);
  setSearchInput(term);
  setActiveResult(0);

  // Replace this with your API endpoint
  const response = await fetch(`https://your-api.com/search?q=${term}`);
  const data = await response.json();
  setResults(data.entities);

  setPage("results");
};
```

3. Pass `results` through context and consume it in `ResultsPage.jsx` instead of `MOCK_ENTITIES`

---

## Git Setup

To initialise a Git repository and push to GitHub:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/your-username/mimr-analytics.git
git push -u origin main
```

The `.gitignore` file ensures `node_modules/` is never committed.

When someone else clones the project they run `npm install` to restore dependencies.

---

## Building for Production

To create an optimised build ready for deployment:

```bash
npm run build
```

Output is written to the `dist/` folder. This can be deployed to any static hosting service:

- **Vercel** — `vercel deploy`
- **Netlify** — drag and drop the `dist/` folder
- **GitHub Pages** — push `dist/` contents to a `gh-pages` branch

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 5 | Build tool and dev server |
| CSS Custom Properties | Design system and theming |
| SVG | Entity relationship graph |
| React Context API | Global state management |
| Google Fonts | Playfair Display + IBM Plex Sans/Mono |

---

## Troubleshooting

**Port already in use**
```bash
# Run on a different port
npm run dev -- --port 3000
```

**npm install fails**
```bash
# Clear npm cache and retry
npm cache clean --force
npm install
```

**Blank page in browser**
- Make sure you opened `http://localhost:5173` (not just the file directly)
- Check the terminal for any error messages
- Try stopping the server (Ctrl + C) and running `npm run dev` again

**Node version too old**
```bash
# Check version
node --version

# Install Node 18+ via nvm (recommended)
nvm install 18
nvm use 18
```

---

*MIMR Analytics — Graph-Based Corporate Intelligence*
