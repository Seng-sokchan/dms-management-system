export function SectionHeader({ title, subtitle, action = null }) {
  return (
    <header className="portal-section-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
