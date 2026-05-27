import './Pipeline.css';

const STAGE_CONFIG = {
  pending:    { label: 'Pending',    color: 'var(--dim)',     icon: '📝' },
  storyboard: { label: 'Storyboard', color: 'var(--accent2)', icon: '🎬' },
  uploaded:   { label: 'Uploaded',   color: 'var(--accent3)', icon: '⬆️' },
  review:     { label: 'Review',     color: 'var(--accent)',  icon: '👀' },
  approved:   { label: 'Approved',   color: 'var(--accent4)', icon: '🟢' },
  scheduled:  { label: 'Scheduled',  color: 'var(--accent3)', icon: '📅' },
  published:  { label: 'Published',  color: 'var(--accent5)', icon: '🚀' },
};

export default function Pipeline({ counts }) {
  // Guard: counts might be null/undefined during initial load
  const safeCounts = counts || {};
  const total = Object.values(safeCounts).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div className="pipeline panel">
        <h3 className="pipeline-title">Production Pipeline</h3>
        <p style={{ color: 'var(--dimmer)', textAlign: 'center', padding: '2rem 0' }}>
          No stories in pipeline yet
        </p>
      </div>
    );
  }

  return (
    <div className="pipeline panel">
      <h3 className="pipeline-title">Production Pipeline</h3>
      <div className="pipeline-stages">
        {Object.entries(STAGE_CONFIG).map(([key, cfg]) => {
          const count = safeCounts[key] || 0;
          const pct = total > 0 ? (count / total * 100) : 0;
          return (
            <div key={key} className="pipeline-stage" style={{ '--stage-color': cfg.color }}>
              <div className="stage-header">
                <span className="stage-icon">{cfg.icon}</span>
                <span className="stage-label">{cfg.label}</span>
                <span className="stage-count">{count}</span>
              </div>
              <div className="stage-bar-track">
                <div
                  className="stage-bar-fill"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pipeline-total">
        <span>Total Stories</span>
        <span className="pipeline-total-num">{total}</span>
      </div>
    </div>
  );
}
