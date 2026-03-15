import { useApp } from "../context/AppContext";

export default function Navbar() {
  const { page, navigate, setAuthMode, scrolled } = useApp();

  const scrollToServices = () => {
    if (page !== "home") {
      navigate("home");
      setTimeout(() => {
        document.getElementById("services-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } else {
      document.getElementById("services-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-logo" onClick={() => navigate("home")}>
        <div className="nav-logo-icon">M</div>
        <span className="nav-logo-text">
          MIMR <span>Analytics</span>
        </span>
      </div>

      <div className="nav-links">
        <button
          className={`nav-link${page === "home" ? " active" : ""}`}
          onClick={() => navigate("home")}
        >
          Home
        </button>
        <button className="nav-link" onClick={scrollToServices}>
          Services
        </button>
        <button
          className={`nav-link${page === "about" ? " active" : ""}`}
          onClick={() => navigate("about")}
        >
          About
        </button>
      </div>

      <button
        className="nav-btn"
        onClick={() => { setAuthMode("signin"); navigate("auth"); }}
      >
        Sign In
      </button>
    </nav>
  );
}
