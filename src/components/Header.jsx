import { useState, useEffect } from 'react';
import { RefreshCw, Settings, Sparkles, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Header.css';

export default function Header({ onRefresh, onToggleSettings }) {
  const [time, setTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const { signOut } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <header className="header" role="banner">
      <div className="header-left">
        <div className="logo-group">
          <Sparkles className="logo-icon" size={28} />
          <div>
            <h1 className="logo-text">
              <span>BRIGHT</span>
              <span className="logo-dot">.</span>
              <span className="logo-stories">STORIES</span>
            </h1>
            <span className="logo-sub">Production Dashboard</span>
          </div>
        </div>
      </div>

      <div className="header-center">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span className="status-text">SYSTEM ONLINE</span>
        </div>
      </div>

      <div className="header-right">
        <div className="header-clock">
          <Clock size={14} />
          <span className="mono">{time.toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>

        <button
          className="btn btn-sm"
          onClick={handleRefresh}
          aria-label="Refresh data"
          id="btn-refresh"
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          REFRESH
        </button>

        <button
          className="btn btn-sm btn-icon"
          onClick={onToggleSettings}
          aria-label="Open settings"
          id="btn-settings"
        >
          <Settings size={18} />
        </button>

        <button
          className="btn btn-sm btn-icon btn-danger"
          onClick={signOut}
          aria-label="Sign out"
          id="btn-signout"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
