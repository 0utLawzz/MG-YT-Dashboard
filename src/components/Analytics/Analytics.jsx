// ============================================
// src/components/Analytics/Analytics.jsx
// Sheet data se Analytics — no YouTube API needed
// Pipeline counts + Category breakdown + Timeline
// ============================================

import { useMemo } from "react";
import { BarChart3, TrendingUp, CheckCircle, Clock, BookOpen, Upload } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, ArcElement,
  Tooltip, Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import "./Analytics.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// Chart options reusable
const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#fff", font: { size: 11 } } },
  },
  scales: {
    x: { ticks: { color: "rgba(255,255,255,0.5)", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } },
    y: { ticks: { color: "rgba(255,255,255,0.5)" }, grid: { color: "rgba(255,255,255,0.05)" } },
  },
};

const donutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "60%",
  plugins: {
    legend: { position: "bottom", labels: { color: "#fff", padding: 12, font: { size: 11 } } },
  },
};

// Status → color map
const STATUS_COLORS = {
  pending:    "rgba(255,255,255,0.3)",
  storyboard: "rgba(0,229,255,0.8)",
  uploaded:   "rgba(255,234,0,0.8)",
  review:     "rgba(255,23,68,0.8)",
  approved:   "rgba(118,255,3,0.8)",
  scheduled:  "rgba(255,234,0,0.6)",
  published:  "rgba(224,64,251,0.8)",
};

export default function Analytics({ stories, pipelineCounts }) {

  // ---- Pipeline Bar Chart ----
  const pipelineData = useMemo(() => ({
    labels: Object.keys(pipelineCounts).map((s) => s.toUpperCase()),
    datasets: [{
      label: "Stories",
      data: Object.values(pipelineCounts),
      backgroundColor: Object.keys(pipelineCounts).map((s) => STATUS_COLORS[s] || "#666"),
      borderColor: "#fff",
      borderWidth: 2,
    }],
  }), [pipelineCounts]);

  // ---- Category Breakdown ----
  const categoryData = useMemo(() => {
    const cats = {};
    stories.forEach((s) => {
      const c = s.category || "Unknown";
      cats[c] = (cats[c] || 0) + 1;
    });
    return {
      labels: Object.keys(cats),
      datasets: [{
        data: Object.values(cats),
        backgroundColor: [
          "rgba(0,229,255,0.8)", "rgba(118,255,3,0.8)",
          "rgba(224,64,251,0.8)", "rgba(255,234,0,0.8)",
          "rgba(255,23,68,0.8)", "rgba(255,152,0,0.8)",
        ],
        borderColor: "#1A1A1A",
        borderWidth: 3,
      }],
    };
  }, [stories]);

  // ---- KPI Summary ----
  const total = stories.length;
  const published = stories.filter((s) => s.dashStatus === "published").length;
  const inProgress = stories.filter((s) =>
    ["storyboard", "uploaded", "review"].includes(s.dashStatus)
  ).length;
  const completionRate = total > 0 ? Math.round((published / total) * 100) : 0;

  // ---- Recently Updated ----
  const recentlyUpdated = [...stories]
    .filter((s) => s.updatedAt)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <section
      className="analytics-section animate-fade-in"
      id="panel-analytics"
      role="tabpanel"
      aria-labelledby="tab-analytics"
    >
      <h2 className="section-title">📈 Analytics</h2>
      <p className="section-desc">Sheet data se real-time overview — pipeline progress aur category breakdown.</p>

      {/* KPI Row */}
      <div className="an-kpi-grid">
        <div className="an-kpi panel">
          <BookOpen size={20} style={{ color: "var(--accent2)" }} />
          <div>
            <span className="an-kpi-val">{total}</span>
            <span className="an-kpi-lbl">Total Stories</span>
          </div>
        </div>
        <div className="an-kpi panel">
          <CheckCircle size={20} style={{ color: "var(--accent4)" }} />
          <div>
            <span className="an-kpi-val">{published}</span>
            <span className="an-kpi-lbl">Published</span>
          </div>
        </div>
        <div className="an-kpi panel">
          <Upload size={20} style={{ color: "var(--accent3)" }} />
          <div>
            <span className="an-kpi-val">{inProgress}</span>
            <span className="an-kpi-lbl">In Progress</span>
          </div>
        </div>
        <div className="an-kpi panel">
          <TrendingUp size={20} style={{ color: "var(--accent5)" }} />
          <div>
            <span className="an-kpi-val">{completionRate}%</span>
            <span className="an-kpi-lbl">Completion Rate</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="an-charts-grid">
        {/* Pipeline Bar */}
        <div className="an-chart-panel panel">
          <h3 className="chart-title"><BarChart3 size={14} /> Pipeline Status</h3>
          <div className="an-chart-container">
            <Bar data={pipelineData} options={chartOpts} />
          </div>
        </div>

        {/* Category Donut */}
        <div className="an-chart-panel panel">
          <h3 className="chart-title"><TrendingUp size={14} /> Category Breakdown</h3>
          <div className="an-chart-container">
            <Doughnut data={categoryData} options={donutOpts} />
          </div>
        </div>
      </div>

      {/* All Stories Status Table */}
      <div className="an-table-section panel">
        <h3 className="chart-title">📋 All Stories — Quick View</h3>
        <div className="an-table-wrap">
          <table className="an-table">
            <thead>
              <tr>
                <th>Row#</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Video</th>
                <th>Thumb</th>
                <th>Schedule</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((s) => (
                <tr key={s.id}>
                  <td className="mono">{s.id}</td>
                  <td className="an-title">{s.title}</td>
                  <td>{s.category || "—"}</td>
                  <td>
                    <span className={`badge badge-${
                      s.dashStatus === "pending" ? "draft" :
                      s.dashStatus === "storyboard" ? "complete" :
                      s.dashStatus === "uploaded" ? "review" :
                      s.dashStatus
                    }`}>
                      {s.dashStatus?.toUpperCase()}
                    </span>
                  </td>
                  <td>{s.videoLink ? "✅" : "❌"}</td>
                  <td>{s.thumbLink ? "✅" : "❌"}</td>
                  <td className="mono">{s.schedule || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recently Updated */}
      {recentlyUpdated.length > 0 && (
        <div className="an-recent panel">
          <h3 className="chart-title"><Clock size={14} /> Recently Updated</h3>
          {recentlyUpdated.map((s) => (
            <div key={s.id} className="an-recent-item">
              <span className="mono an-recent-id">{s.id}</span>
              <span className="an-recent-title">{s.title}</span>
              <span className={`badge badge-${s.dashStatus === "pending" ? "draft" : s.dashStatus === "storyboard" ? "complete" : s.dashStatus}`}>
                {s.dashStatus?.toUpperCase()}
              </span>
              <span className="mono an-recent-date">
                {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
