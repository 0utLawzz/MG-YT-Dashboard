// ============================================
// src/components/Publish/PublishForm.jsx
// Complete Publish Panel:
// - Drive video + thumbnail PREVIEW
// - YouTube Playlists (albums) fetch + select
// - One-click publish from Drive URL (no local file needed)
// - Schedule support
// - Real progress bar
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  Send, Calendar, Clock, ExternalLink, LogIn, LogOut,
  RefreshCw, Video, Image, Play, ListVideo
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { publishService } from '../../services/publishService';
import { getDriveThumbnail, getDriveDirectDownload } from '../../lib/api';
import { ENV } from '../../lib/config/env';
import './PublishForm.css';

// ============================================
// Fetch user's YouTube playlists (albums)
// Requires YouTube OAuth token
// ============================================
async function fetchYouTubePlaylists(accessToken) {
  const url =
    'https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Playlists fetch failed: ' + res.status);
  const data = await res.json();
  // Return array of { id, title }
  return (data.items || []).map(p => ({
    id: p.id,
    title: p.snippet?.title || 'Untitled Playlist',
  }));
}

export default function PublishForm({ stories, onSchedule, onPublish, onEdit }) {
  const { signIn, signOut, isAuthenticated, isLoading: authLoading, accessToken } = useAuth();

  // --- Story selection ---
  const [selectedId, setSelectedId] = useState('');

  // --- Schedule fields ---
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [mode, setMode]   = useState('publish'); // "publish" | "schedule"

  // --- SEO Metadata (auto-filled from story, user can edit) ---
  const [seoTitle, setSeoTitle]           = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoTags, setSeoTags]             = useState('');
  const [visibility, setVisibility]       = useState('private');

  // --- YouTube Playlists (albums) ---
  const [playlists, setPlaylists]         = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(ENV.YOUTUBE_PLAYLIST_ID || '');
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlistError, setPlaylistError] = useState('');

  // --- Publish state ---
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [done, setDone]             = useState(false);
  const [publishError, setPublishError] = useState('');

  // --- Schedule save ---
  const [saving, setSaving]         = useState(false);

  // Story lists
  const approved  = stories.filter(s => s.dashStatus === 'approved');
  const scheduled = stories.filter(s => s.dashStatus === 'scheduled');
  const published = stories.filter(s => s.dashStatus === 'published');
  const failed    = stories.filter(s => s.dashStatus === 'publish_failed');

  const selectedStory = stories.find(s => s.id === selectedId);

  // ============================================
  // When a story is selected, auto-fill SEO fields
  // ============================================
  const handleSelectStory = (id) => {
    setSelectedId(id);
    setDone(false);
    setPublishError('');
    setProgress(0);
    setProgressMsg('');

    const story = stories.find(s => s.id === id);
    if (!story) return;

    setSeoTitle(story.title || '');
    setSeoDescription(story.story || story.storytext || '');

    // Combine hashtags + seoTags into a single comma-separated list
    const tags = [];
    if (story.hashtags) tags.push(...story.hashtags.split(' ').map(t => t.replace('#', '')));
    if (story.seoTags) tags.push(...story.seoTags.split(','));
    setSeoTags(tags.map(t => t.trim()).filter(Boolean).join(', '));

    setScheduleDate(story.schedule ? story.schedule.split('T')[0] : '');
    setScheduleTime(story.schedule ? story.schedule.split('T')[1]?.slice(0, 5) : '');
  };

  // ============================================
  // Fetch YouTube Playlists when authenticated
  // ============================================
  const loadPlaylists = useCallback(async () => {
    if (!accessToken) return;
    setLoadingPlaylists(true);
    setPlaylistError('');
    try {
      const list = await fetchYouTubePlaylists(accessToken);
      setPlaylists(list);
      // If ENV has a default playlist and it exists in list, keep it selected
      if (!selectedPlaylist && list.length > 0) {
        setSelectedPlaylist(list[0].id);
      }
    } catch (err) {
      setPlaylistError('Playlists load nahi huin: ' + err.message);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [accessToken]);

  // Auto-load playlists when user connects
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      loadPlaylists();
    }
  }, [isAuthenticated, accessToken, loadPlaylists]);

  // ============================================
  // MAIN PUBLISH — Drive → YouTube
  // ============================================
  const handlePublish = async () => {
    if (!selectedStory) return;
    if (!isAuthenticated) { signIn(); return; }
    if (!selectedStory.videoLink) {
      setPublishError('❌ Video Drive link nahi hai. Storyboard mein add karo pehle.');
      return;
    }

    setPublishing(true);
    setDone(false);
    setPublishError('');
    setProgress(0);

    try {
      const ytLink = await publishService.publishStory({
        accessToken,
        storyId: selectedStory.id,
        story: selectedStory,
        customMetadata: {
          title: seoTitle,
          description: seoDescription,
          tags: seoTags.split(',').map(t => t.trim()).filter(Boolean),
          visibility,
          playlistId: selectedPlaylist,
          categoryId: '22',
        },
        onProgress: (pct, msg) => {
          setProgress(pct);
          setProgressMsg(msg || '');
        },
      });

      // Update local state via parent hook
      await onPublish(selectedStory.id, ytLink);
      setDone(true);
      setProgress(100);
      setProgressMsg('✅ Published successfully!');

    } catch (err) {
      setPublishError('❌ ' + err.message);
      setProgress(0);
    } finally {
      setPublishing(false);
    }
  };

  // ============================================
  // SCHEDULE — save date/time to Sheet
  // ============================================
  const handleSchedule = async () => {
    if (!selectedId || !scheduleDate || !scheduleTime) return;
    setSaving(true);
    try {
      await onSchedule(selectedId, `${scheduleDate}T${scheduleTime}`);
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // RETRY failed story
  // ============================================
  const handleRetry = (story) => {
    handleSelectStory(story.id);
    setMode('publish');
  };

  // ============================================
  // Drive preview helpers
  // ============================================
  const thumbSrc    = selectedStory?.thumbLink ? getDriveThumbnail(selectedStory.thumbLink) : null;
  const videoSrc    = selectedStory?.videoLink ? getDriveDirectDownload(selectedStory.videoLink) : null;

  return (
    <section
      className="publish-section animate-fade-in"
      id="panel-publish"
      role="tabpanel"
      aria-labelledby="tab-publish"
    >
      <h2 className="section-title">🚀 Publish to YouTube</h2>
      <p className="section-desc">
        Approved stories yahaan se directly YouTube pe push hoti hain — Drive se download, upload, thumbnail set, playlist add, sab automatic.
      </p>

      {/* ── AUTH BANNER ── */}
      <div className={`oauth-auth-section panel ${isAuthenticated ? 'auth-ok' : 'auth-warn'}`}>
        {isAuthenticated ? (
          <div className="oauth-authenticated">
            <span className="auth-status">✅ YouTube Account Connected</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={loadPlaylists}
                disabled={loadingPlaylists}
                title="Reload playlists"
              >
                <RefreshCw size={13} /> {loadingPlaylists ? 'Loading...' : 'Reload Playlists'}
              </button>
              <button className="btn btn-sm" onClick={signOut}>
                <LogOut size={14} /> Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="oauth-not-authenticated">
            <div>
              <span className="auth-status">⚠️ YouTube se connected nahi</span>
              <p className="form-hint" style={{ marginTop: '0.25rem' }}>
                Video publish karne ke liye Google account connect karo
              </p>
            </div>
            <button className="btn btn-primary" onClick={signIn} disabled={authLoading}>
              <LogIn size={14} /> {authLoading ? 'Connecting...' : 'Connect YouTube Account'}
            </button>
          </div>
        )}
      </div>

      {/* ── STATS ROW ── */}
      <div className="publish-stats">
        <div className="pub-stat panel">
          <span className="pub-stat-num" style={{ color: 'var(--accent4)' }}>{approved.length}</span>
          <span className="pub-stat-label">Ready</span>
        </div>
        <div className="pub-stat panel">
          <span className="pub-stat-num" style={{ color: 'var(--accent3)' }}>{scheduled.length}</span>
          <span className="pub-stat-label">Scheduled</span>
        </div>
        <div className="pub-stat panel">
          <span className="pub-stat-num" style={{ color: 'var(--accent5)' }}>{published.length}</span>
          <span className="pub-stat-label">Published</span>
        </div>
        <div className="pub-stat panel">
          <span className="pub-stat-num" style={{ color: 'var(--error)' }}>{failed.length}</span>
          <span className="pub-stat-label">Failed</span>
        </div>
      </div>

      {/* ── FAILED STORIES ALERT ── */}
      {failed.length > 0 && (
        <div className="pub-failed-list panel" style={{ borderColor: 'var(--error)' }}>
          <h4 style={{ color: 'var(--error)', marginBottom: '0.5rem' }}>❌ Upload Failed Stories</h4>
          {failed.map(s => (
            <div key={s.id} className="pub-list-item" style={{ gap: '0.5rem' }}>
              <span className="badge" style={{ background: 'var(--error)', color: '#fff' }}>FAILED</span>
              <span className="pub-item-title">{s.title}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--dim)' }}>{s.uploadError}</span>
              <button className="btn btn-sm btn-primary" onClick={() => handleRetry(s)}>
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          ))}
        </div>
      )}

      {approved.length === 0 && (
        <div className="publish-empty panel">
          ⚠️ Koi approved story nahi. Review Tab mein jao aur stories approve karo pehle.
        </div>
      )}

      {approved.length > 0 && (
        <div className="publish-form panel">

          {/* ── STORY SELECT ── */}
          <div className="form-group">
            <label className="form-label" htmlFor="pub-story-select">Story Select karo</label>
            <select
              className="input"
              id="pub-story-select"
              value={selectedId}
              onChange={e => handleSelectStory(e.target.value)}
            >
              <option value="">-- Approved Story Choose karo --</option>
              {approved.map(s => (
                <option key={s.id} value={s.id}>{s.id} — {s.title}</option>
              ))}
            </select>
          </div>

          {selectedStory && (
            <>
              {/* ── DRIVE ASSET PREVIEWS ── */}
              <div className="pub-previews">
                {/* Thumbnail Preview */}
                <div className="pub-preview-box panel">
                  <h4 className="pub-box-title"><Image size={14} /> Thumbnail Preview</h4>
                  {thumbSrc ? (
                    <img
                      src={thumbSrc}
                      alt="Story thumbnail"
                      className="pub-thumb-img"
                      onError={e => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="pub-preview-empty"
                    style={{ display: thumbSrc ? 'none' : 'flex' }}
                  >
                    <Image size={32} style={{ color: 'var(--dimmer)' }} />
                    <span>Thumbnail Drive link nahi</span>
                  </div>
                  {selectedStory.thumbLink && (
                    <a
                      href={selectedStory.thumbLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm"
                      style={{ marginTop: '0.5rem' }}
                    >
                      <ExternalLink size={12} /> Drive mein dekho
                    </a>
                  )}
                </div>

                {/* Video Preview — HTML5 video tag, Drive direct link */}
                <div className="pub-preview-box panel">
                  <h4 className="pub-box-title"><Play size={14} /> Video Preview</h4>
                  {videoSrc ? (
                    <video
                      src={videoSrc}
                      controls
                      preload="metadata"
                      className="pub-video-iframe"
                      onError={e => {
                        // Drive may block direct streaming — show fallback button
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="pub-preview-empty"
                    style={{ display: videoSrc ? 'none' : 'flex' }}
                  >
                    <Play size={32} style={{ color: 'var(--dimmer)' }} />
                    <span>Video Drive link nahi hai</span>
                  </div>
                  {selectedStory.videoLink && (
                    <a
                      href={selectedStory.videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm"
                      style={{ marginTop: '0.5rem' }}
                    >
                      <ExternalLink size={12} /> Drive mein dekho
                    </a>
                  )}
                </div>
              </div>

              {/* ── SEO METADATA ── */}
              <div className="seo-metadata-section panel">
                <h4 className="pub-box-title" style={{ color: 'var(--accent2)', marginBottom: '1rem' }}>
                  📝 SEO & YouTube Metadata
                </h4>

                <div className="form-group">
                  <label className="form-label">Video Title</label>
                  <input
                    type="text"
                    className="input"
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                    placeholder="YouTube pe dikhne wala title"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="input"
                    rows={4}
                    value={seoDescription}
                    onChange={e => setSeoDescription(e.target.value)}
                    placeholder="Video description with links, hashtags..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input
                    type="text"
                    className="input"
                    value={seoTags}
                    onChange={e => setSeoTags(e.target.value)}
                    placeholder="kids, stories, moral, animation"
                  />
                </div>

                <div className="pub-meta-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Visibility</label>
                    <select
                      className="input"
                      value={visibility}
                      onChange={e => setVisibility(e.target.value)}
                    >
                      <option value="private">🔒 Private</option>
                      <option value="unlisted">🔗 Unlisted</option>
                      <option value="public">🌍 Public</option>
                    </select>
                  </div>

                  {/* PLAYLIST / ALBUM SELECT */}
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">
                      <ListVideo size={13} style={{ marginRight: '0.3rem' }} />
                      Playlist / Album
                    </label>
                    {isAuthenticated ? (
                      <>
                        <select
                          className="input"
                          value={selectedPlaylist}
                          onChange={e => setSelectedPlaylist(e.target.value)}
                          disabled={loadingPlaylists}
                        >
                          <option value="">-- No Playlist --</option>
                          {playlists.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                        {playlistError && (
                          <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>
                            {playlistError}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="input" style={{ color: 'var(--dimmer)', fontSize: '0.8rem', cursor: 'default' }}>
                        Connect YouTube to load playlists
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── MODE TOGGLE ── */}
              <div className="pub-mode-toggle">
                <button
                  className={`btn ${mode === 'publish' ? 'btn-primary' : 'btn-sm'}`}
                  onClick={() => setMode('publish')}
                >
                  <Video size={14} /> Push to YouTube
                </button>
                <button
                  className={`btn ${mode === 'schedule' ? 'btn-warning' : 'btn-sm'}`}
                  onClick={() => setMode('schedule')}
                >
                  <Calendar size={14} /> Schedule
                </button>
              </div>

              {/* ── PUBLISH MODE ── */}
              {mode === 'publish' && (
                <div className="pub-publish-box">
                  <h4 className="pub-box-title">
                    <Send size={14} /> Drive se YouTube pe Push
                  </h4>
                  <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
                    Video aur thumbnail automatically Drive se download hokar YouTube pe upload honge.
                    Koi local file select karne ki zaroorat nahi.
                  </p>

                  {/* Progress Bar */}
                  {publishing && (
                    <div className="pub-progress-wrap">
                      <div className="pub-progress-bar">
                        <div
                          className="pub-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="pub-progress-label">{progressMsg || `${progress}%`}</span>
                    </div>
                  )}

                  {publishError && (
                    <div className="pub-error-msg">
                      {publishError}
                    </div>
                  )}

                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handlePublish}
                    disabled={publishing || done || !selectedStory?.videoLink}
                  >
                    {publishing
                      ? `⏳ Uploading... ${progress}%`
                      : done
                      ? '✅ Published!'
                      : '🚀 Publish to YouTube'}
                  </button>

                  {!selectedStory?.videoLink && (
                    <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      ⚠️ Pehle Storyboard mein Video Drive link add karo
                    </p>
                  )}
                  {!isAuthenticated && (
                    <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      ⚠️ YouTube account connect karo upar se
                    </p>
                  )}
                </div>
              )}

              {/* ── SCHEDULE MODE ── */}
              {mode === 'schedule' && (
                <div className="pub-schedule-box">
                  <h4 className="pub-box-title">
                    <Calendar size={14} /> Schedule for Later
                  </h4>
                  <div className="schedule-fields">
                    <div className="form-group">
                      <label className="form-label" htmlFor="pub-date">Date</label>
                      <input
                        className="input"
                        type="date"
                        id="pub-date"
                        value={scheduleDate}
                        onChange={e => setScheduleDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="pub-time">Time</label>
                      <input
                        className="input"
                        type="time"
                        id="pub-time"
                        value={scheduleTime}
                        onChange={e => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-warning"
                    onClick={handleSchedule}
                    disabled={saving || !scheduleDate || !scheduleTime}
                  >
                    <Clock size={14} />
                    {saving ? 'Saving…' : done ? '✅ Scheduled!' : 'Save Schedule'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── SCHEDULED LIST ── */}
      {scheduled.length > 0 && (
        <div className="pub-list-section">
          <h3 className="section-title" style={{ fontSize: '0.95rem' }}>📅 Scheduled Stories</h3>
          {scheduled.map(s => (
            <div key={s.id} className="pub-list-item panel">
              <span className="badge badge-scheduled">SCHEDULED</span>
              <span className="pub-item-title">{s.title}</span>
              <span className="pub-item-date mono">
                <Clock size={12} /> {s.schedule ? s.schedule.replace('T', ' ') : 'Time set nahi'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── PUBLISHED LIST ── */}
      {published.length > 0 && (
        <div className="pub-list-section">
          <h3 className="section-title" style={{ fontSize: '0.95rem' }}>✅ Published Stories</h3>
          {published.map(s => (
            <div key={s.id} className="pub-list-item panel">
              <span className="badge badge-published">PUBLISHED</span>
              <span className="pub-item-title">{s.title}</span>
              {s.ytLink && (
                <a
                  href={s.ytLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-icon"
                  title="YouTube pe dekho"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
