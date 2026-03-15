import { useApp } from "../context/AppContext";

export default function Footer() {
  const { navigate } = useApp();

  const scrollToServices = () => {
    navigate("home");
    setTimeout(() => {
      document.getElementById("services-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const links = [
    { label: "Services", action: scrollToServices },
    { label: "About",    action: () => navigate("about") },
    { label: "Pricing",  action: null },
    { label: "Docs",     action: null },
    { label: "Privacy",  action: null },
    { label: "Terms",    action: null },
  ];

  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      <div className="footer">
        <div>
          <div className="footer-brand">
            MIMR <span>Analytics</span>
          </div>
          <div className="footer-copy" style={{ marginTop: 8 }}>
            Graph-Based Corporate Intelligence
          </div>
        </div>

        <div className="footer-links">
          {links.map(({ label, action }) => (
            <span
              key={label}
              className="footer-link"
              onClick={action || undefined}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="footer-copy">
          © 2025 MIMR Analytics Ltd. All rights reserved.
        </div>
      </div>
    </div>
  );
}
