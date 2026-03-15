import { useApp } from "../context/AppContext";
import { SAMPLE_QUERIES } from "../data/mockData";

export default function SearchBar() {
  const { searchInput, setSearchInput, doSearch } = useApp();

  const handleKey = (e) => {
    if (e.key === "Enter") doSearch();
  };

  return (
    <>
      <div className="search-wrap">
        <span className="search-icon">⊕</span>
        <input
          className="search-box"
          placeholder="Search by company name or registration number…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKey}
          aria-label="Company search"
        />
        <button className="search-go" onClick={() => doSearch()}>
          Search
        </button>
      </div>

      <div className="search-pills">
        {SAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            className="search-pill"
            onClick={() => { setSearchInput(q); doSearch(q); }}
          >
            {q}
          </button>
        ))}
      </div>
    </>
  );
}
