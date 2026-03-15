import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [page, setPage] = useState("home");
  const [authMode, setAuthMode] = useState("signin");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeResult, setActiveResult] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navigate = (target) => setPage(target);

  const doSearch = (query) => {
    const term = query || searchInput;
    if (!term.trim()) return;
    setSearchQuery(term);
    setSearchInput(term);
    setActiveResult(0);
    setPage("results");
  };

  return (
    <AppContext.Provider value={{
      page, navigate,
      authMode, setAuthMode,
      searchQuery, searchInput, setSearchInput,
      doSearch,
      activeResult, setActiveResult,
      scrolled,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
