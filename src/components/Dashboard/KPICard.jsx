import './KPICard.css';

export default function KPICard({ icon, label, value, sub, color = 'var(--accent2)' }) {
  return (
    <div className="kpi-card panel" style={{ '--kpi-color': color }}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-data">
        <span className="kpi-value">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        <span className="kpi-label">{label}</span>
        {sub && <span className="kpi-sub">{sub}</span>}
      </div>
      <div className="kpi-glow"></div>
    </div>
  );
}
