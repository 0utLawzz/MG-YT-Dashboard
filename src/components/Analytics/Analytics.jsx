// ============================================
// src/components/Analytics/Analytics.jsx
// Sheet data se Analytics — no YouTube API needed
// Pipeline counts + Category breakdown + Timeline + Asset coverage + More KPIs
// ============================================

import { useMemo } from "react";
import {
  BarChart3, TrendingUp, CheckCircle, Clock, BookOpen, Upload,
  Video, Image, AlertTriangle, Activity, Target
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, ArcElement, LineElement, PointElement,
  Tooltip, Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useTheme } from '../../context/ThemeContext';
import "./Analytics.css";

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, ArcElement, LineElement, PointElement,
  Tooltip, Legend
);

// Reusable chart options builder (theme-aware)
function makeBarOpts(labelColor) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: labelColor, font: { size: 11 } } },
    },
    scales: {
      x: { ticks: { color: labelColor, font: { size: 10 } }, grid: { color: "rgba(128,128,128,0.1)" } },
      y: { ticks: { color: labelColor }, grid: { color: "rgba(128,128,128,0.1)" } },
    },
  };
}

function makeDonutOpts(labelColor) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: labelColor, padding: 12, font: { size: 11 } },
      },
    },
  };
}

function makeLineOpts(labelColor) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: labelColor, font: { size: 11 } } },
    },
    scales: {
      x: { ticks: { color: labelColor, font: { size: 9 } }, grid: { color: "rgba(128,128,128,0.08)" } },
      y: { ticks: { color: labelColor, stepSize: 1 }, grid: { color: "rgba(128,128,128,0.08)" }, beginAtZero: true },
    },
  };
}

export default function Analytics({ stories, pipelineCounts }) {
  const { theme } = useTheme();
  const safeStories = useMemo(() => Array.isArray(stories) ? stories : [], [stories]);
  const safePipeline = useMemo(() => pipelineCounts || {}, [pipelineCounts]);

  // Theme-aware text color
  const labelColor = useMemo(() => {
    const style = getComputedStyle(document.body);
    return style.getPropertyValue('--text').trim() || (theme === 'light' ? '#111' : '#ccc');
  }, [theme]);

  const themeColors = useMemo(() => {
    // Reference theme to trigger re-evaluation when theme changes
    void theme;
    const style = getComputedStyle(document.body);
    return {
      dim:     style.getPropertyValue('--dim').trim()     || 'rgba(128,128,128,0.5)',
      accent:  style.getPropertyValue('--accent').trim()  || '#ff1744',
      accent2: style.getPropertyValue('--accent2').trim() || '#00e5ff',
      accent3: style.getPropertyValue('--accent3').trim() || '#ffea00',
      accent4: style.getPropertyValue('--accent4').trim() || '#76ff03',
      accent5: style.getPropertyValue('--accent5').trim() || '#e040fb',
    };
  }, [theme]);

  const STATUS_COLORS = useMemo(() => ({
    pending:       themeColors.dim,
    storyboard:    themeColors.accent2,
    uploaded:      themeColors.accent3,
    review:        themeColors.accent,
    approved:      themeColors.accent4,
    scheduled:     themeColors.accent3,
    published:     themeColors.accent5,
    publishing:    themeColors.accent2,
    publish_failed: themeColors.accent,
  }), [themeColors]);

  // ---- Pipeline Bar Chart ----
  const pipelineData = useMemo(() => ({
    labels: Object.keys(safePipeline).map((s) => s.toUpperCase()),
    datasets: [{
      label: "Stories",
      data: Object.values(safePipeline),
      backgroundColor: Object.keys(safePipeline).map((s) => STATUS_COLORS[s] || "#666"),
      borderColor: "rgba(255,255,255,0.3)",
      borderWidth: 1,
    }],
  }), [safePipeline, STATUS_COLORS]);

  // ---- Category Breakdown ----
  const categoryData = useMemo(() => {
    const cats = {};
    safeStories.forEach((s) => {
      const c = s.category || "Unknown";
      cats[c] = (cats[c] || 0) + 1;
    });
    const PALETTE = [
      themeColors.accent, themeColors.accent2,
      themeColors.accent3, themeColors.accent4,
      themeColors.accent5, themeColors.dim,
      '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3',
      '#54a0ff', '#5f27cd',
    ];
    return {
      labels: Object.keys(cats),
      datasets: [{
        data: Object.values(cats),
        backgroundColor: Object.keys(cats).map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor: "rgba(0,0,0,0.3)",
        borderWidth: 2,
      }],
    };
  }, [safeStories, themeColors]);

  // ---- Timeline (stories updated per week) ----
  const timelineData = useMemo(() => {
    const dated = safeStories.filter(s => s.updatedAt);
    if (dated.length === 0) return null;

    const weekMap = {};
    dated.forEach(s => {
      const d = new Date(s.updatedAt);
      // Get week start (Sunday)
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weekMap[key] = (weekMap[key] || 0) + 1;
    });

    const sorted = Object.keys(weekMap).sort();
    return {
      labels: sorted.map(w => {
        const d = new Date(w);
        return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
      }),
      datasets: [{
        label: "Stories Updated",
        data: sorted.map(k => weekMap[k]),
        borderColor: themeColors.accent2,
        backgroundColor: `${themeColors.accent2}22`,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: themeColors.accent2,
        pointRadius: 4,
      }],
    };
  }, [safeStories, themeColors]);

  // ---- KPI Summary ----
  const total       = safeStories.length;
  const published   = safeStories.filter(s => s.dashStatus === "published").length;
  const approved    = safeStories.filter(s => s.dashStatus === "approved").length;
  const inReview    = safeStories.filter(s => s.dashStatus === "review").length;
  const inStoryboard= safeStories.filter(s => s.dashStatus === "storyboard").length;
  const scheduled   = safeStories.filter(s => s.dashStatus === "scheduled").length;
  const inProgress  = safeStories.filter(s =>
    ["storyboard", "uploaded", "review"].includes(s.dashStatus)
  ).length;
  const completionRate = total > 0 ? Math.round((published / total) * 100) : 0;

  // ---- Asset Coverage ----
  const withVideo = safeStories.filter(s => s.videoLink).length;
  const withThumb = safeStories.filter(s => s.thumbLink).length;
  const withBoth  = safeStories.filter(s => s.videoLink && s.thumbLink).length;
  const videoPct  = total > 0 ? Math.round((withVideo / total) * 100) : 0;
  const thumbPct  = total > 0 ? Math.round((withThumb / total) * 100) : 0;
  const bothPct   = total > 0 ? Math.round((withBoth / total) * 100) : 0;

  // ---- Recently Updated ----
  const recentlyUpdated = [...safeStories]
    .filter(s => s.updatedAt)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  const barOpts    = makeBarOpts(labelColor);
  const donutOpts  = makeDonutOpts(labelColor);
  const lineOpts   = makeLineOpts(labelColor);

  return (
    <section
      className="analytics-section animate-fade-in"
      id="panel-analytics"
      role="tabpanel"
      aria-labelledby="tab-analytics"
    >
      <h2 className="section-title">📈 Analytics</h2>
      <p className="section-desc">Real-time pipeline overview — status counts, category breakdown, asset coverage and activity timeline.</p>

      {/* KPI Row — 8 cards */}
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
        <div className="an-kpi panel">
          <Activity size={20} style={{ color: "var(--accent)" }} />
          <div>
            <span className="an-kpi-val">{inReview}</span>
            <span className="an-kpi-lbl">In Review</span>
          </div>
        </div>
        <div className="an-kpi panel">
          <Target size={20} style={{ color: "var(--accent4)" }} />
          <div>
            <span className="an-kpi-val">{approved}</span>
            <span className="an-kpi-lbl">Approved</span>
          </div>
        </div>
        <div className="an-kpi panel">
          <Clock size={20} style={{ color: "var(--accent3)" }} />
          <div>
            <span className="an-kpi-val">{scheduled}</span>
            <span className="an-kpi-lbl">Scheduled</span>
          </div>
        </div>
        <div className="an-kpi panel">
          <BookOpen size={20} style={{ color: "var(--accent2)" }} />
          <div>
            <span className="an-kpi-val">{inStoryboard}</span>
            <span className="an-kpi-lbl">Storyboard</span>
          </div>
        </div>
      </div>

      {/* Charts Grid — Pipeline + Category */}
      <div className="an-charts-grid">
        {/* Pipeline Bar */}
        <div className="an-chart-panel panel">
          <h3 className="chart-title"><BarChart3 size={14} /> Pipeline Status</h3>
          <div className="an-chart-container">
            <Bar data={pipelineData} options={barOpts} />
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

      {/* Asset Coverage + Timeline row */}
      <div className="an-charts-grid">
        {/* Asset Coverage Donut */}
        <div className="an-chart-panel panel">
          <h3 className="chart-title"><Video size={14} /> Asset Coverage</h3>
          <div className="an-asset-stats">
            <div className="an-asset-stat">
              <Video size={14} style={{ color: "var(--accent2)" }} />
              <span className="an-asset-label">Video Linked</span>
              <span className="an-asset-val">{withVideo} / {total}</span>
              <div className="an-asset-bar-bg">
                <div className="an-asset-bar-fill" style={{ width: `${videoPct}%`, background: "var(--accent2)" }} />
              </div>
              <span className="an-asset-pct">{videoPct}%</span>
            </div>
            <div className="an-asset-stat">
              <Image size={14} style={{ color: "var(--accent3)" }} />
              <span className="an-asset-label">Thumbnail Linked</span>
              <span className="an-asset-val">{withThumb} / {total}</span>
              <div className="an-asset-bar-bg">
                <div className="an-asset-bar-fill" style={{ width: `${thumbPct}%`, background: "var(--accent3)" }} />
              </div>
              <span className="an-asset-pct">{thumbPct}%</span>
            </div>
            <div className="an-asset-stat">
              <CheckCircle size={14} style={{ color: "var(--accent4)" }} />
              <span className="an-asset-label">Both Assets Ready</span>
              <span className="an-asset-val">{withBoth} / {total}</span>
              <div className="an-asset-bar-bg">
                <div className="an-asset-bar-fill" style={{ width: `${bothPct}%`, background: "var(--accent4)" }} />
              </div>
              <span className="an-asset-pct">{bothPct}%</span>
            </div>
            <div className="an-asset-stat">
              <AlertTriangle size={14} style={{ color: "var(--accent)" }} />
              <span className="an-asset-label">Missing Assets</span>
              <span className="an-asset-val" style={{ color: "var(--accent)" }}>
                {total - withBoth} stories
              </span>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="an-chart-panel panel">
          <h3 className="chart-title"><Activity size={14} /> Activity Timeline (by week)</h3>
          <div className="an-chart-container">
            {timelineData ? (
              <Line data={timelineData} options={lineOpts} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--dim)', fontSize: '0.8rem', textAlign: 'center' }}>
                No date data available.<br/>Update timestamps are needed for timeline.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Stories Status Table */}
      <div className="an-table-section panel">
        <h3 className="chart-title" style={{ marginBottom: "0.5rem" }}>📋 All Stories — Quick View</h3>
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
              {safeStories.map((s) => (
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
