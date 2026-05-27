import { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import './BarCharts.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function BarCharts({ stories }) {
  const { theme } = useTheme();
  const safeStories = Array.isArray(stories) ? stories : [];
  const published = safeStories.filter(s => s.dashStatus === 'published');
  
  const colors = useMemo(() => {
    const style = getComputedStyle(document.body);
    return {
      accent: style.getPropertyValue('--accent').trim() || '#FF1744',
      accent2: style.getPropertyValue('--accent2').trim() || '#00E5FF',
      accent3: style.getPropertyValue('--accent3').trim() || '#FFEA00',
    };
  }, [theme]);

  // Empty state: no published stories yet
  if (published.length === 0) {
    return (
      <div className="bar-charts panel">
        <h3 className="chart-title">Performance Metrics</h3>
        <p style={{ color: 'var(--dimmer)', textAlign: 'center', padding: '2rem 0' }}>
          No published stories yet — publish stories to see performance data
        </p>
      </div>
    );
  }

  const viewsData = {
    labels: published.map(s => (s.title || 'Untitled').length > 15 ? s.title.slice(0, 15) + '…' : (s.title || 'Untitled')),
    datasets: [{
      label: 'Views',
      data: published.map(s => s.views || 0),
      backgroundColor: colors.accent2,
      borderColor: '#FFFFFF',
      borderWidth: 2,
      hoverBackgroundColor: colors.accent,
    }],
  };

  const likesData = {
    labels: published.map(s => (s.title || 'Untitled').length > 15 ? s.title.slice(0, 15) + '…' : (s.title || 'Untitled')),
    datasets: [{
      label: 'Likes',
      data: published.map(s => s.likes || 0),
      backgroundColor: colors.accent3,
      borderColor: '#FFFFFF',
      borderWidth: 2,
      hoverBackgroundColor: colors.accent,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#2D2D2D',
        titleColor: '#FFFFFF',
        bodyColor: 'rgba(255,255,255,0.8)',
        borderColor: '#FFFFFF',
        borderWidth: 2,
        titleFont: { family: "'Poppins', sans-serif", weight: '700' },
        bodyFont: { family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 0,
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255,255,255,0.5)',
          font: { family: "'Inter', sans-serif", size: 10 },
          maxRotation: 30,
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
        border: { color: 'rgba(255,255,255,0.2)' },
      },
      y: {
        ticks: {
          color: 'rgba(255,255,255,0.5)',
          font: { family: "'Share Tech Mono', monospace", size: 10 },
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
        border: { color: 'rgba(255,255,255,0.2)' },
      },
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
  };

  return (
    <div className="bar-charts panel">
      <h3 className="chart-title">Performance Metrics</h3>
      <div className="bar-charts-grid">
        <div className="bar-chart-item">
          <h4 className="bar-chart-label">
            <span className="bar-dot" style={{ background: '#00E5FF' }}></span>
            Views per Story
          </h4>
          <div className="bar-chart-container">
            <Bar data={viewsData} options={chartOptions} />
          </div>
        </div>
        <div className="bar-chart-item">
          <h4 className="bar-chart-label">
            <span className="bar-dot" style={{ background: '#FFEA00' }}></span>
            Likes per Story
          </h4>
          <div className="bar-chart-container">
            <Bar data={likesData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
