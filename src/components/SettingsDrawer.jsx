import { useState } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import './SettingsDrawer.css';

const DEFAULT_CONFIG = {
  apiUrl: '',
  sheetUrl: '',
  googleClientId: '',
  driveFolderId: '',
  youtubeChannelId: 'UC2FdFOP-XrLFlWN9VJWmYWQ', // Fixed YouTube Channel ID
  youtubePlaylistId: '',                           // Default playlist/album for new uploads
  driveApiKey: '',
  youtubeApiKey: '',
  analyticApiKey: '',
  autoSave: true,
};

export default function SettingsDrawer({ open, onClose }) {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('bls_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('bls_config', JSON.stringify(config));
    toast.success('Settings saved! Reload the page for API/URL changes to take effect.');
    onClose();
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem('bls_config');
  };

  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>
      <aside className="settings-drawer" role="dialog" aria-label="Settings" id="settings-drawer">
        <div className="drawer-header">
          <h2 className="drawer-title">⚙️ Global Configurations</h2>
          <button className="btn btn-sm btn-icon" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          
          <h4 style={{ margin: "0.5rem 0", color: "var(--accent2)" }}>Endpoints</h4>
          
          <div className="form-group">
            <label className="form-label" htmlFor="cfg-api-url">API Base URL</label>
            <input
              className="input"
              id="cfg-api-url"
              value={config.apiUrl}
              onChange={e => handleChange('apiUrl', e.target.value)}
              placeholder="https://your-api.vercel.app"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cfg-sheet-url">Google Sheet Script URL</label>
            <input
              className="input"
              id="cfg-sheet-url"
              value={config.sheetUrl}
              onChange={e => handleChange('sheetUrl', e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
            />
          </div>

          <h4 style={{ margin: "1rem 0 0.5rem 0", color: "var(--accent3)" }}>Google Identity & Drive</h4>

          <div className="form-group">
            <label className="form-label" htmlFor="cfg-client-id">Google Client ID (OAuth)</label>
            <input
              className="input"
              id="cfg-client-id"
              value={config.googleClientId}
              onChange={e => handleChange('googleClientId', e.target.value)}
              placeholder="xxxx.apps.googleusercontent.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cfg-drive-folder">Drive Folder ID</label>
            <input
              className="input"
              id="cfg-drive-folder"
              value={config.driveFolderId}
              onChange={e => handleChange('driveFolderId', e.target.value)}
              placeholder="Folder ID from Google Drive URL"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="cfg-drive-key">Drive API Key (Manual)</label>
            <input
              className="input"
              id="cfg-drive-key"
              value={config.driveApiKey}
              onChange={e => handleChange('driveApiKey', e.target.value)}
              placeholder="AIzaSy..."
            />
          </div>

          <h4 style={{ margin: "1rem 0 0.5rem 0", color: "var(--accent5)" }}>YouTube & Analytics</h4>

          {/* YouTube Channel ID — videos isi channel pe jayengi */}
          <div className="form-group">
            <label className="form-label" htmlFor="cfg-yt-channel">
              YouTube Channel ID
              <span style={{ fontSize: '0.72rem', color: 'var(--dim)', marginLeft: '0.5rem' }}>
                (UC... format — fixed channel)
              </span>
            </label>
            <input
              className="input"
              id="cfg-yt-channel"
              value={config.youtubeChannelId}
              onChange={e => handleChange('youtubeChannelId', e.target.value)}
              placeholder="UC2FdFOP-XrLFlWN9VJWmYWQ"
            />
          </div>

          {/* YouTube Playlist ID — video is album mein add hogi */}
          <div className="form-group">
            <label className="form-label" htmlFor="cfg-yt-playlist">
              Default YouTube Playlist ID
              <span style={{ fontSize: '0.72rem', color: 'var(--dim)', marginLeft: '0.5rem' }}>
                (optional — video auto-add hogi is playlist mein)
              </span>
            </label>
            <input
              className="input"
              id="cfg-yt-playlist"
              value={config.youtubePlaylistId}
              onChange={e => handleChange('youtubePlaylistId', e.target.value)}
              placeholder="PLxxxx..."
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="cfg-yt-key">YouTube API Key (Manual)</label>
            <input
              className="input"
              id="cfg-yt-key"
              value={config.youtubeApiKey}
              onChange={e => handleChange('youtubeApiKey', e.target.value)}
              placeholder="AIzaSy..."
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="cfg-analytics-key">Analytics Dashboard Key</label>
            <input
              className="input"
              id="cfg-analytics-key"
              value={config.analyticApiKey}
              onChange={e => handleChange('analyticApiKey', e.target.value)}
              placeholder="Custom key to unlock raw analytics..."
            />
          </div>

          <div className="form-group form-row" style={{ marginTop: "1rem" }}>
            <label className="form-label" htmlFor="cfg-autosave">Auto-save changes</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                id="cfg-autosave"
                checked={config.autoSave}
                onChange={e => handleChange('autoSave', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn btn-sm" onClick={handleReset}>
            <RotateCcw size={13} /> Reset
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            <Save size={13} /> Save
          </button>
        </div>
      </aside>
    </>
  );
}
