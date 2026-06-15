// Removing unused hooks
import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import './DonutChart.css';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DonutChart({ counts }) {
  const { theme } = useTheme();
  const safeCounts = counts || {};
  const labels = Object.keys(safeCounts);
  const values = Object.values(safeCounts);

  const colorMap = useMemo(() => {
    void theme;
    const style = getComputedStyle(document.body);
    return {
      pending: style.getPropertyValue('--dim').trim() || 'rgba(255,255,255,0.3)',
      storyboard: style.getPropertyValue('--accent2').trim() || '#00E5FF',
      uploaded: style.getPropertyValue('--accent3').trim() || '#FFEA00',
      review: style.getPropertyValue('--accent').trim() || '#FF1744',
      approved: style.getPropertyValue('--accent4').trim() || '#76FF03',
      scheduled: style.getPropertyValue('--accent3').trim() || '#FFEA00',
      published: style.getPropertyValue('--accent5').trim() || '#E040FB',
    };
  }, [theme]);

  const data = {
    labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
    datasets: [{
      data: values,
      backgroundColor: labels.map(l => colorMap[l] || '#666'),
      borderColor: '#1A1A1A',
      borderWidth: 3,
      hoverBorderColor: '#FFFFFF',
      hoverBorderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255,255,255,0.7)',
          font: { family: "'Inter', sans-serif", size: 11, weight: '600' },
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
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
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  return (
    <div className="donut-chart panel">
      <h3 className="chart-title">Status Distribution</h3>
      <div className="chart-container">
        <Doughnut data={data} options={options} />
        <div className="chart-center-label">
          <span className="chart-total">{values.reduce((a, b) => a + b, 0)}</span>
          <span className="chart-total-label">TOTAL</span>
        </div>
      </div>
    </div>
  );
}
