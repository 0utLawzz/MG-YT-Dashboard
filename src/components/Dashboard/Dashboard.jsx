import KPICard from './KPICard';
import Pipeline from './Pipeline';
import DonutChart from './DonutChart';
import BarCharts from './BarCharts';
import './Dashboard.css';

export default function Dashboard({ stories, kpis, pipelineCounts }) {
  return (
    <section className="dashboard animate-fade-in" id="panel-dashboard" role="tabpanel" aria-labelledby="tab-dashboard">
      <h2 className="sr-only">Dashboard Overview</h2>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard icon="📖" label="Total Stories" value={kpis.total} color="var(--accent2)" sub="All time" />
        <KPICard icon="🚀" label="Published" value={kpis.published} color="var(--accent4)" sub="Live on YouTube" />
        <KPICard icon="📅" label="Scheduled" value={kpis.scheduled} color="var(--accent3)" sub="Pending release" />
        <KPICard icon="✅" label="Approved" value={kpis.approved} color="var(--accent4)" sub="Ready to publish" />
        <KPICard icon="👁️" label="In Review" value={kpis.inReview} color="var(--accent)" sub="Pending approval" />
        <KPICard icon="🔄" label="Pending" value={kpis.pending} color="var(--accent5)" sub="Not started" />
      </div>

      {/* Main Dashboard Grid */}
      <div className="dash-grid">
        <Pipeline counts={pipelineCounts} />
        <DonutChart counts={pipelineCounts} />
      </div>

      {/* Bar Charts (full width) */}
      <BarCharts stories={stories} />
    </section>
  );
}
