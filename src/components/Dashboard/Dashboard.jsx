import KPICard from './KPICard';
import Pipeline from './Pipeline';
import DonutChart from './DonutChart';
import BarCharts from './BarCharts';
import './Dashboard.css';

export default function Dashboard({ stories, kpis, pipelineCounts }) {
  // Guard: ensure safe defaults
  const safeStories = Array.isArray(stories) ? stories : [];
  const safeKpis = kpis || { total: 0, published: 0, scheduled: 0, approved: 0, inReview: 0, uploaded: 0, pending: 0 };
  const safePipeline = pipelineCounts || {};

  // Empty state
  if (safeStories.length === 0 && !safeKpis.total) {
    return (
      <section className="dashboard animate-fade-in" id="panel-dashboard" role="tabpanel" aria-labelledby="tab-dashboard">
        <h2 className="sr-only">Dashboard Overview</h2>
        <div className="panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</p>
          <p style={{ color: 'var(--dimmer)' }}>No stories loaded yet. Data will appear here once stories are fetched from the Sheet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard animate-fade-in" id="panel-dashboard" role="tabpanel" aria-labelledby="tab-dashboard">
      <h2 className="sr-only">Dashboard Overview</h2>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard icon="📖" label="Total Stories" value={safeKpis.total} color="var(--accent2)" sub="All time" />
        <KPICard icon="🚀" label="Published" value={safeKpis.published} color="var(--accent4)" sub="Live on YouTube" />
        <KPICard icon="⏳" label="Publishing" value={safeKpis.publishing || 0} color="var(--accent3)" sub="In progress" />
        <KPICard icon="❌" label="Failed" value={safeKpis.failed || 0} color="var(--error)" sub="Upload errors" />
        <KPICard icon="📅" label="Scheduled" value={safeKpis.scheduled} color="var(--accent3)" sub="Pending release" />
        <KPICard icon="✅" label="Approved" value={safeKpis.approved} color="var(--accent4)" sub="Ready to publish" />
        <KPICard icon="👁️" label="In Review" value={safeKpis.inReview} color="var(--accent)" sub="Pending approval" />
        <KPICard icon="🔄" label="Pending" value={safeKpis.pending} color="var(--accent5)" sub="Not started" />
      </div>

      {/* Main Dashboard Grid */}
      <div className="dash-grid">
        <Pipeline counts={safePipeline} />
        <DonutChart counts={safePipeline} />
      </div>

      {/* Bar Charts (full width) */}
      <BarCharts stories={safeStories} />
    </section>
  );
}
