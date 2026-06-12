import { useState, useEffect } from 'react';
import { X, Zap, AlertCircle } from 'lucide-react';
import { useVideoProcessor } from '../../hooks/useVideoProcessor';
import './ProcessVideoModal.css';

export default function ProcessVideoModal({ story, onClose, onProcessComplete }) {
  const { processing, progress, error, processVideo } = useVideoProcessor();
  const [trimSeconds, setTrimSeconds] = useState(0);
  const [logoEnabled, setLogoEnabled] = useState(true);
  const [logoPosition, setLogoPosition] = useState('bottom-right');
  const [logoSize, setLogoSize] = useState(80);
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    return () => {
      setSubmitted(false);
      setLocalError(null);
    };
  }, []);

  const handleSubmit = async () => {
    setSubmitted(true);
    setLocalError(null);
    const settings = {
      trimSeconds,
      logoEnabled,
      logoPosition,
      logoSize,
    };

    const result = await processVideo(story.videoLink, settings);
    if (result?.processedVideoUrl) {
      onProcessComplete(result.processedVideoUrl);
    } else {
      setSubmitted(false);
      setLocalError(error || 'Processing failed - no result returned');
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setLocalError(null);
  };

  if (processing) {
    return (
      <div className="modal-overlay">
        <div className="process-modal">
          <h2>Processing Video...</h2>
          <div className="progress-section">
            <div className="progress-info">
              <p className="progress-file">{progress.filename || 'Processing...'}</p>
              <p className="progress-step">{progress.step || 'Initializing'}</p>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="progress-percent">{Math.round(progress.percent)}%</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="process-modal">
        <div className="modal-header">
          <h2>🎬 Process Video</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="story-info">
            <h3>{story.title}</h3>
            <p className="story-meta">ID: {story.id}</p>
          </div>

          {(error || localError) && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{localError || error}</span>
            </div>
          )}

          <div className="settings-group">
            <label className="setting-label">
              <span>✂️ Trim Trailing Seconds</span>
              <input
                type="range"
                min="0"
                max="30"
                value={trimSeconds}
                onChange={(e) => setTrimSeconds(Number(e.target.value))}
                disabled={processing}
              />
              <span className="setting-value">{trimSeconds}s</span>
            </label>
          </div>

          <div className="settings-group">
            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={logoEnabled}
                onChange={(e) => setLogoEnabled(e.target.checked)}
                disabled={processing}
              />
              <span>🏷️ Add Logo Overlay</span>
            </label>
          </div>

          {logoEnabled && (
            <>
              <div className="settings-group">
                <label className="setting-label">
                  <span>📍 Logo Position</span>
                  <select
                    value={logoPosition}
                    onChange={(e) => setLogoPosition(e.target.value)}
                    disabled={processing}
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="center">Center</option>
                  </select>
                </label>
              </div>

              <div className="settings-group">
                <label className="setting-label">
                  <span>📏 Logo Size</span>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={logoSize}
                    onChange={(e) => setLogoSize(Number(e.target.value))}
                    disabled={processing}
                  />
                  <span className="setting-value">{logoSize}px</span>
                </label>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={processing}>
            Cancel
          </button>
          {localError ? (
            <button
              className="btn btn-primary"
              onClick={handleRetry}
              disabled={processing}
            >
              🔄 Retry
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={processing || submitted}
            >
              <Zap size={16} />
              {processing ? 'Processing...' : 'Process Video'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
