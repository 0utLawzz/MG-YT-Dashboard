import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './BarCharts.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function BarCharts({ stories }) {
  // Views by published stories
  const published = stories.filter(s => s.status === 'published');
  
  const viewsData = {
    labels: published.map(s => s.title.length > 15 ? s.title.slice(0, 15) + '…' : s.title),
    datasets: [{
      label: 'Views',
      data: published.map(s => s.views || 0),
      backgroundColor: '#00E5FF',
      borderColor: '#FFFFFF',
      borderWidth: 2,
      hoverBackgroundColor: '#FF1744',
    }],
  };

  const likesData = {
    labels: published.map(s => s.title.length > 15 ? s.title.slice(0, 15) + '…' : s.title),
    datasets: [{
      label: 'Likes',
      data: published.map(s => s.likes || 0),
      backgroundColor: '#FFEA00',
      borderColor: '#FFFFFF',
      borderWidth: 2,
      hoverBackgroundColor: '#FF1744',
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
