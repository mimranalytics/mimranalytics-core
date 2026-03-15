/**
 * GraphToolbar.jsx
 * ─────────────────────────────────────────────────────────────
 * Floating toolbar overlaid on the graph canvas.
 * Controls: fit to screen, zoom in, zoom out, reset layout.
 * ─────────────────────────────────────────────────────────────
 */

export default function GraphToolbar({ onFit, onZoomIn, onZoomOut, onReset }) {
  const buttons = [
    { icon: "⊞", label: "Fit graph",     action: onFit,    title: "Fit to screen" },
    { icon: "+", label: "Zoom in",       action: onZoomIn,  title: "Zoom in" },
    { icon: "−", label: "Zoom out",      action: onZoomOut, title: "Zoom out" },
    { icon: "↺", label: "Reset layout",  action: onReset,   title: "Reset layout" },
  ];

  return (
    <div className="gt-toolbar">
      {buttons.map(({ icon, label, action, title }) => (
        <button
          key={label}
          className="gt-btn"
          onClick={action}
          title={title}
          aria-label={label}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
