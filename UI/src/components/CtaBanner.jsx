export default function CtaBanner({
  title,
  titleEm,
  sub,
  primaryLabel,
  primaryAction,
  secondaryLabel,
  secondaryAction,
}) {
  return (
    <div className="cta-banner">
      <h2 className="cta-title">
        {title}<br /><em>{titleEm}</em>
      </h2>
      <p className="cta-sub">{sub}</p>
      <div className="cta-actions">
        <button className="btn-gold" onClick={primaryAction}>
          {primaryLabel}
        </button>
        <button className="btn-outline" onClick={secondaryAction}>
          {secondaryLabel}
        </button>
      </div>
    </div>
  );
}
