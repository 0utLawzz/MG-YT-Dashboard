import { useState } from 'react';
import { Video, Send, Lock, Unlock, Upload, AlertTriangle, Calendar, Clock } from 'lucide-react';
import './PublishForm.css';

export default function PublishForm({ stories, onPublish }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedStory, setSelectedStory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [publishResult, setPublishResult] = useState(null);

  const approved = stories.filter(s => s.status === 'approved');

  const handleAuth = () => {
    // Simulate OAuth flow
    setAuthenticated(true);
  };

  const handleSelectStory = (id) => {
    setSelectedStory(id);
    const story = stories.find(s => s.id === Number(id));
    if (story) {
      setTitle(`${story.title} | Bright Little Stories`);
      setDescription(`A magical bedtime story for kids aged ${story.ageGroup || '2-6'}. Follow along with "${story.title}" in this ${story.category?.toLowerCase() || 'wonderful'} adventure!\n\n#BrightLittleStories #BedtimeStories #KidsContent`);
      setTags(`bedtime stories, kids, ${story.category?.toLowerCase() || 'stories'}, ${story.ageGroup || '2-6'} years, bright little stories`);
    }
  };

  const isScheduled = scheduleDate && scheduleTime;

  const handlePublish = () => {
    setPublishing(true);
    setProgress(0);
    setPublishResult(null);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 8;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);

        const story = stories.find(s => s.id === Number(selectedStory));
        if (isScheduled) {
          const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
          onPublish?.(story, { status: 'scheduled', scheduledAt });
          setPublishResult({ type: 'scheduled', date: scheduleDate, time: scheduleTime });
        } else {
          onPublish?.(story, { status: 'published', publishedAt: new Date().toISOString() });
          setPublishResult({ type: 'published' });
        }

        setTimeout(() => setPublishing(false), 1000);
      }
      setProgress(Math.round(p));
    }, 300);
  };

  return (
    <section className="publish-section animate-fade-in" id="panel-publish" role="tabpanel" aria-labelledby="tab-publish">
      <h2 className="section-title">Publish to YouTube</h2>

      {/* Auth Section */}
      <div className="publish-auth panel">
        <div className="auth-header">
          <Video size={24} className="yt-icon" />
          <div>
            <h3>YouTube Authentication</h3>
            <p className="auth-status">
              {authenticated ? (
                <><Unlock size={14} className="auth-ok" /> Connected</>
              ) : (
                <><Lock size={14} className="auth-locked" /> Not connected</>
              )}
            </p>
          </div>
        </div>
        {!authenticated && (
          <button className="btn btn-primary" onClick={handleAuth} id="btn-yt-auth">
            <Video size={16} /> Sign in with Google
          </button>
        )}
      </div>

      {authenticated && (
        <div className="publish-form panel">
          <h3 className="form-title">Upload Details</h3>

          {/* Story Selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="publish-story-select">Select Story</label>
            <select
              className="input"
              id="publish-story-select"
              value={selectedStory}
              onChange={e => handleSelectStory(e.target.value)}
            >
              <option value="">Choose a story…</option>
              {approved.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            {approved.length === 0 && (
              <p className="form-hint warning">
                <AlertTriangle size={13} /> No approved stories. Pass a story through Review first.
              </p>
            )}
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="publish-title">Video Title</label>
            <input
              className="input"
              id="publish-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter video title…"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="publish-desc">Description</label>
            <textarea
              className="input publish-textarea"
              id="publish-desc"
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Video description…"
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label" htmlFor="publish-tags">Tags</label>
            <input
              className="input"
              id="publish-tags"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="Comma-separated tags…"
            />
          </div>

          {/* Visibility */}
          <div className="form-group">
            <label className="form-label" htmlFor="publish-visibility">Visibility</label>
            <select
              className="input"
              id="publish-visibility"
              value={visibility}
              onChange={e => setVisibility(e.target.value)}
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Schedule Section */}
          <div className="schedule-section">
            <h4 className="schedule-heading">
              <Calendar size={14} /> Schedule (Optional)
            </h4>
            <p className="schedule-hint">Set a date and time to schedule. Leave empty to publish immediately (Publish Intent).</p>
            <div className="schedule-fields">
              <div className="form-group">
                <label className="form-label" htmlFor="publish-date">Date</label>
                <input
                  className="input"
                  id="publish-date"
                  type="date"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="publish-time">Time</label>
                <input
                  className="input"
                  id="publish-time"
                  type="time"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Publish Button */}
          <button
            className={`btn ${isScheduled ? 'btn-warning' : 'btn-primary'} publish-btn`}
            onClick={handlePublish}
            disabled={!selectedStory || publishing}
            id="btn-publish"
          >
            {publishing ? (
              <><Upload size={16} className="spin" /> Uploading… {progress}%</>
            ) : isScheduled ? (
              <><Clock size={16} /> Schedule for {scheduleDate} @ {scheduleTime}</>
            ) : (
              <><Send size={16} /> Publish Now (Instant)</>
            )}
          </button>

          {/* Upload Progress */}
          {publishing && (
            <div className="publish-progress">
              <div className="progress-bar">
                <div className="progress-fill publish-fill" style={{ width: `${progress}%` }}>
                  <span className="progress-text">{progress}%</span>
                </div>
              </div>
              <p className="progress-stage mono">
                {progress < 30 ? 'Uploading video…' :
                 progress < 60 ? 'Processing…' :
                 progress < 90 ? 'Setting metadata…' :
                 'Finalizing…'}
              </p>
            </div>
          )}

          {/* Result Banner */}
          {publishResult && (
            <div className={`publish-result panel ${publishResult.type}`}>
              {publishResult.type === 'scheduled' ? (
                <><Calendar size={18} /> Story scheduled for <strong>{publishResult.date}</strong> at <strong>{publishResult.time}</strong></>
              ) : (
                <><Send size={18} /> Story published successfully! 🎉</>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
