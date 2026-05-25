import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Eye, ThumbsUp, MessageSquare, Clock, Users, PlayCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend } from 'chart.js';
import './Analytics.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export default function Analytics({ stories }) {
  const [channelStats, setChannelStats] = useState(null);
  const [videoStats, setVideoStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [channelId, setChannelId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  // Load saved channel ID
  useEffect(() => {
    const saved = localStorage.getItem('yt_channel_id');
    if (saved) {
      setChannelId(saved);
      setIsConfigured(true);
    }
  }, []);

  const fetchChannelStats = async (chId) => {
    try {
      const resp = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${chId}&key=${GOOGLE_API_KEY}`
      );
      if (!resp.ok) throw new Error('Failed to fetch channel data');
      const data = await resp.json();
      if (data.items?.length > 0) {
        return {
          title: data.items[0].snippet.title,
          thumbnail: data.items[0].snippet.thumbnails?.default?.url,
          subscribers: Number(data.items[0].statistics.subscriberCount || 0),
          totalViews: Number(data.items[0].statistics.viewCount || 0),
          videoCount: Number(data.items[0].statistics.videoCount || 0),
        };
      }
      throw new Error('Channel not found');
    } catch (err) {
      throw err;
    }
  };

  const fetchRecentVideos = async (chId) => {
    try {
      // Get recent video IDs
      const searchResp = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${chId}&order=date&maxResults=10&type=video&key=${GOOGLE_API_KEY}`
      );
      if (!searchResp.ok) throw new Error('Failed to fetch videos');
      const searchData = await searchResp.json();
      const videoIds = searchData.items?.map(i => i.id.videoId).filter(Boolean) || [];

      if (videoIds.length === 0) return [];

      // Get video stats
      const statsResp = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${GOOGLE_API_KEY}`
      );
      if (!statsResp.ok) throw new Error('Failed to fetch video stats');
      const statsData = await statsResp.json();

      return (statsData.items || []).map(v => ({
        id: v.id,
        title: v.snippet.title,
        thumbnail: v.snippet.thumbnails?.medium?.url,
        publishedAt: v.snippet.publishedAt,
        views: Number(v.statistics.viewCount || 0),
        likes: Number(v.statistics.likeCount || 0),
        comments: Number(v.statistics.commentCount || 0),
        duration: v.contentDetails?.duration || '',
      }));
    } catch (err) {
      throw err;
    }
  };

  const loadAnalytics = async () => {
    if (!channelId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [ch, vids] = await Promise.all([
        fetchChannelStats(channelId),
        fetchRecentVideos(channelId),
      ]);
      setChannelStats(ch);
      setVideoStats(vids);
      localStorage.setItem('yt_channel_id', channelId);
      setIsConfigured(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load if configured
  useEffect(() => {
    if (isConfigured && channelId) {
      loadAnalytics();
    }
  }, [isConfigured]);

  // Chart data
  const viewsChartData = useMemo(() => {
    const sorted = [...videoStats].reverse();
    return {
      labels: sorted.map(v => v.title.substring(0, 20) + (v.title.length > 20 ? '…' : '')),
      datasets: [{
        label: 'Views',
        data: sorted.map(v => v.views),
        borderColor: '#00E5FF',
        backgroundColor: 'rgba(0, 229, 255, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#00E5FF',
      }]
    };
  }, [videoStats]);

  const engagementChartData = useMemo(() => {
    const sorted = [...videoStats].reverse();
    return {
      labels: sorted.map(v => v.title.substring(0, 15) + (v.title.length > 15 ? '…' : '')),
      datasets: [
        {
          label: 'Likes',
          data: sorted.map(v => v.likes),
          backgroundColor: 'rgba(118, 255, 3, 0.7)',
          borderColor: '#76FF03',
          borderWidth: 2,
        },
        {
          label: 'Comments',
          data: sorted.map(v => v.comments),
          backgroundColor: 'rgba(224, 64, 251, 0.7)',
          borderColor: '#E040FB',
          borderWidth: 2,
        }
      ]
    };
  }, [videoStats]);

  const performanceDonut = useMemo(() => {
    const totalViews = videoStats.reduce((s, v) => s + v.views, 0);
    const totalLikes = videoStats.reduce((s, v) => s + v.likes, 0);
    const totalComments = videoStats.reduce((s, v) => s + v.comments, 0);
    return {
      labels: ['Views', 'Likes', 'Comments'],
      datasets: [{
        data: [totalViews, totalLikes, totalComments],
        backgroundColor: ['rgba(0, 229, 255, 0.8)', 'rgba(118, 255, 3, 0.8)', 'rgba(224, 64, 251, 0.8)'],
        borderColor: ['#00E5FF', '#76FF03', '#E040FB'],
        borderWidth: 3,
      }]
    };
  }, [videoStats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#fff', font: { size: 11 } } },
    },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#fff', padding: 15, font: { size: 11 } } },
    },
  };

  // Published/scheduled stories from the app
  const publishedStories = stories.filter(s => ['published', 'scheduled'].includes(s.status));

  const formatNumber = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  return (
    <section className="analytics-section animate-fade-in" id="panel-analytics" role="tabpanel" aria-labelledby="tab-analytics">
      <h2 className="section-title">YouTube Analytics</h2>

      {/* Channel Setup */}
      {!isConfigured && (
        <div className="analytics-setup panel">
          <BarChart3 size={32} style={{ color: 'var(--accent2)' }} />
          <h3>Connect Your YouTube Channel</h3>
          <p className="section-desc">Enter your YouTube Channel ID to see real-time analytics.</p>
          <div className="setup-form">
            <input
              className="input"
              placeholder="Enter YouTube Channel ID (e.g. UCxxxxx)"
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
              id="analytics-channel-input"
            />
            <button
              className="btn btn-primary"
              onClick={loadAnalytics}
              disabled={!channelId.trim() || loading}
            >
              {loading ? <><RefreshCw size={14} className="spin" /> Loading…</> : <><TrendingUp size={14} /> Connect</>}
            </button>
          </div>
          {error && <p className="analytics-error">⚠️ {error}</p>}
        </div>
      )}

      {/* Channel Overview */}
      {channelStats && (
        <>
          <div className="analytics-channel panel">
            <div className="channel-header">
              {channelStats.thumbnail && (
                <img src={channelStats.thumbnail} alt="Channel" className="channel-avatar" />
              )}
              <div>
                <h3 className="channel-name">{channelStats.title}</h3>
                <p className="channel-sub">YouTube Channel Analytics</p>
              </div>
              <button className="btn btn-sm" onClick={loadAnalytics} style={{ marginLeft: 'auto' }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            <div className="channel-kpis">
              <div className="channel-kpi">
                <Users size={18} />
                <div>
                  <span className="kpi-value">{formatNumber(channelStats.subscribers)}</span>
                  <span className="kpi-label">Subscribers</span>
                </div>
              </div>
              <div className="channel-kpi">
                <Eye size={18} />
                <div>
                  <span className="kpi-value">{formatNumber(channelStats.totalViews)}</span>
                  <span className="kpi-label">Total Views</span>
                </div>
              </div>
              <div className="channel-kpi">
                <PlayCircle size={18} />
                <div>
                  <span className="kpi-value">{formatNumber(channelStats.videoCount)}</span>
                  <span className="kpi-label">Videos</span>
                </div>
              </div>
              <div className="channel-kpi">
                <ThumbsUp size={18} />
                <div>
                  <span className="kpi-value">{formatNumber(videoStats.reduce((s, v) => s + v.likes, 0))}</span>
                  <span className="kpi-label">Recent Likes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="analytics-charts">
            <div className="chart-panel panel">
              <h3 className="chart-title"><Eye size={14} /> Views per Video</h3>
              <div className="chart-container">
                <Line data={viewsChartData} options={chartOptions} />
              </div>
            </div>
            <div className="chart-panel panel">
              <h3 className="chart-title"><ThumbsUp size={14} /> Engagement</h3>
              <div className="chart-container">
                <Bar data={engagementChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="analytics-charts single">
            <div className="chart-panel panel donut-panel">
              <h3 className="chart-title"><BarChart3 size={14} /> Overall Performance</h3>
              <div className="chart-container donut-container">
                <Doughnut data={performanceDonut} options={donutOptions} />
              </div>
            </div>
          </div>

          {/* Video List */}
          {videoStats.length > 0 && (
            <div className="video-list-section">
              <h3 className="section-title" style={{ fontSize: '0.95rem' }}>Recent Videos</h3>
              <div className="video-list">
                {videoStats.map((v, i) => (
                  <div key={v.id} className="video-card panel" style={{ animationDelay: `${i * 0.06}s` }}>
                    {v.thumbnail && (
                      <img src={v.thumbnail} alt={v.title} className="video-thumb" />
                    )}
                    <div className="video-info">
                      <h4 className="video-title">{v.title}</h4>
                      <div className="video-stats">
                        <span><Eye size={12} /> {formatNumber(v.views)}</span>
                        <span><ThumbsUp size={12} /> {formatNumber(v.likes)}</span>
                        <span><MessageSquare size={12} /> {formatNumber(v.comments)}</span>
                        <span><Clock size={12} /> {new Date(v.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${v.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-icon"
                      title="Watch on YouTube"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Published Stories from App */}
      {publishedStories.length > 0 && (
        <div className="published-stories-section">
          <h3 className="section-title" style={{ fontSize: '0.95rem' }}>📖 Published & Scheduled Stories</h3>
          <div className="published-list">
            {publishedStories.map(s => (
              <div key={s.id} className="published-item panel">
                <span className={`badge badge-${s.status}`}>{s.status.toUpperCase()}</span>
                <span className="published-title">{s.title}</span>
                {s.publishedAt && <span className="published-date mono">📅 {new Date(s.publishedAt).toLocaleDateString()}</span>}
                {s.scheduledAt && <span className="published-date mono">⏰ {new Date(s.scheduledAt).toLocaleString()}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="loader"></div>
          <p>Fetching YouTube analytics…</p>
        </div>
      )}
    </section>
  );
}
