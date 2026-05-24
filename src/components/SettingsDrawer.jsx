import { useState } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import './SettingsDrawer.css';

const DEFAULT_CONFIG = {
  apiUrl: '',
  sheetUrl: '',
  googleClientId: '',
  driveFolderId: '',
  youtubePlaylistId: '',
  defaultAgeGroup: '2-6',
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
          <h2 className="drawer-title">⚙️ Settings</h2>
          <button className="btn btn-sm btn-icon" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
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

          <div className="form-group">
            <label className="form-label" htmlFor="cfg-client-id">Google Client ID</label>
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
            <label className="form-label" htmlFor="cfg-yt-playlist">YouTube Playlist ID</label>
            <input
              className="input"
              id="cfg-yt-playlist"
              value={config.youtubePlaylistId}
              onChange={e => handleChange('youtubePlaylistId', e.target.value)}
              placeholder="PLxxxx..."
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cfg-age-group">Default Age Group</label>
            <select
              className="input"
              id="cfg-age-group"
              value={config.defaultAgeGroup}
              onChange={e => handleChange('defaultAgeGroup', e.target.value)}
            >
              <option value="1-3">1-3 years</option>
              <option value="2-4">2-4 years</option>
              <option value="2-6">2-6 years</option>
              <option value="3-5">3-5 years</option>
              <option value="3-6">3-6 years</option>
              <option value="4-6">4-6 years</option>
            </select>
          </div>

          <div className="form-group form-row">
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
