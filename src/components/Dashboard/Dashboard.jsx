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
        <KPICard icon="👁️" label="Total Views" value={kpis.totalViews} color="var(--accent3)" sub={`Avg: ${kpis.avgViews.toLocaleString()}`} />
        <KPICard icon="❤️" label="Total Likes" value={kpis.totalLikes} color="var(--accent)" sub="Engagement" />
        <KPICard icon="🔄" label="In Pipeline" value={kpis.inPipeline} color="var(--accent5)" sub="Work in progress" />
        <KPICard icon="📈" label="Avg Views" value={kpis.avgViews} color="var(--accent2)" sub="Per published story" />
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
