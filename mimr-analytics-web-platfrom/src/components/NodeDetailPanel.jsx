/**
 * NodeDetailPanel.jsx
 * ─────────────────────────────────────────────────────────────
 * Slide-in panel shown when the user taps a graph node.
 * Displays type-specific details and an expand button.
 * ─────────────────────────────────────────────────────────────
 */

import { NODE_COLORS } from "./cytoscapeStyles";

export default function NodeDetailPanel({ node, entity, open, onClose, onExpand }) {
  if (!node) return null;

  const colors = NODE_COLORS[node.type] || NODE_COLORS.company;
  const isRoot = entity && node.id === entity.id;

  return (
    <div className={`ndp-panel${open ? " ndp-open" : ""}`}>
      {/* Header */}
      <div className="ndp-header" style={{ borderColor: colors.border }}>
        <div className="ndp-type-badge" style={{ color: colors.text, borderColor: colors.border, background: colors.bg }}>
          {TYPE_LABELS[node.type] || node.type}
        </div>
        <button className="ndp-close" onClick={onClose}>✕</button>
      </div>

      {/* Name */}
      <div className="ndp-name">{node.label}</div>

      {/* Type-specific fields */}
      <div className="ndp-fields">
        {node.type === "director" && node.role && (
          <Field label="Role" value={node.role} />
        )}
        {node.type === "shareholder" && node.ownership && (
          <Field label="Ownership" value={node.ownership} accent />
        )}
        {node.status && (
          <Field
            label="Status"
            value={node.status}
            accent={node.status === "active"}
          />
        )}
      </div>

      {/* Root entity detail — show when clicking the main company node */}
      {isRoot && entity && (
        <div className="ndp-entity-detail">
          <div className="ndp-section-title">Company Details</div>
          {entity.regNumber     && <Field label="Reg. Number"    value={entity.regNumber} />}
          {entity.jurisdiction  && <Field label="Jurisdiction"   value={entity.jurisdiction} />}
          {entity.incorporated  && <Field label="Incorporated"   value={entity.incorporated} />}
          {entity.address       && <Field label="Address"        value={entity.address} />}
          {entity.sicDescription && <Field label="SIC"           value={`${entity.sicCode} — ${entity.sicDescription}`} />}
          {entity.latestAccounts && <Field label="Latest Accounts" value={entity.latestAccounts} />}

          {entity.officers?.length > 0 && (
            <>
              <div className="ndp-section-title" style={{ marginTop: 20 }}>Officers</div>
              {entity.officers.map((o, i) => (
                <div className="ndp-officer" key={i}>
                  <div className="ndp-officer-name">{o.name}</div>
                  <div className="ndp-officer-role">{o.role}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="ndp-actions">
        <button className="ndp-btn-primary" onClick={onExpand}>
          ⊕ Expand connections
        </button>
        <button className="ndp-btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, accent }) {
  return (
    <div className="ndp-field">
      <span className="ndp-field-label">{label}</span>
      <span className={`ndp-field-value${accent ? " ndp-accent" : ""}`}>{value}</span>
    </div>
  );
}

const TYPE_LABELS = {
  company:     "Company",
  subsidiary:  "Subsidiary",
  parent:      "Parent Entity",
  director:    "Director / Officer",
  shareholder: "Shareholder",
};
