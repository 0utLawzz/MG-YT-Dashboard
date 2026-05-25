// ============================================
// src/components/Publish/PublishForm.jsx
// Approved stories → Schedule ya Publish
// YouTube link Sheet mein save hoti hai
// No OAuth — manual YouTube link paste karo
// ============================================

import { useState } from "react";
import { Send, Calendar, Clock, ExternalLink, CheckCircle } from "lucide-react";
import "./PublishForm.css";

export default function PublishForm({ stories, onSchedule, onPublish, onEdit }) {
  const [selectedId, setSelectedId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [ytLink, setYtLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState("schedule"); // "schedule" ya "publish"

  // Sirf approved stories
  const approved = stories.filter((s) => s.dashStatus === "approved");
  const scheduled = stories.filter((s) => s.dashStatus === "scheduled");
  const published = stories.filter((s) => s.dashStatus === "published");

  const selectedStory = stories.find((s) => s.id === selectedId);

  const handleSelectStory = (id) => {
    setSelectedId(id);
    const story = stories.find((s) => s.id === id);
    if (story) {
      setYtLink(story.ytLink || "");
      setScheduleDate(story.schedule ? story.schedule.split("T")[0] : "");
      setScheduleTime(story.schedule ? story.schedule.split("T")[1]?.slice(0, 5) : "");
      setDone(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedId || !scheduleDate || !scheduleTime) return;
    setSaving(true);
    try {
      const dateTime = `${scheduleDate}T${scheduleTime}`;
      await onSchedule(selectedId, dateTime);
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await onPublish(selectedId, ytLink);
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="publish-section animate-fade-in"
      id="panel-publish"
      role="tabpanel"
      aria-labelledby="tab-publish"
    >
      <h2 className="section-title">🚀 Publish</h2>
      <p className="section-desc">
        Approved stories schedule karein ya published mark karein YouTube link ke saath.
      </p>

      {/* Stats Row */}
      <div className="publish-stats">
        <div className="pub-stat panel">
          <span className="pub-stat-num" style={{ color: "var(--accent4)" }}>{approved.length}</span>
          <span className="pub-stat-label">Approved</span>
        </div>
        <div className="pub-stat panel">
          <span className="pub-stat-num" style={{ color: "var(--accent3)" }}>{scheduled.length}</span>
          <span className="pub-stat-label">Scheduled</span>
        </div>
        <div className="pub-stat panel">
          <span className="pub-stat-num" style={{ color: "var(--accent5)" }}>{published.length}</span>
          <span className="pub-stat-label">Published</span>
        </div>
      </div>

      {approved.length === 0 && (
        <div className="publish-empty panel">
          <p>⚠️ Koi approved story nahi hai. Pehle Review tab se approve karein.</p>
        </div>
      )}

      {approved.length > 0 && (
        <div className="publish-form panel">
          {/* Story Select */}
          <div className="form-group">
            <label className="form-label" htmlFor="pub-story-select">
              Approved Story Select Karein
            </label>
            <select
              className="input"
              id="pub-story-select"
              value={selectedId}
              onChange={(e) => handleSelectStory(e.target.value)}
            >
              <option value="">-- Story chunein --</option>
              {approved.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.title}
                </option>
              ))}
            </select>
          </div>

          {selectedStory && (
            <>
              {/* Story Info */}
              <div className="pub-story-info">
                <h3 className="pub-story-title">{selectedStory.title}</h3>
                <p className="pub-story-meta">
                  📁 {selectedStory.category} | 🏷️ {selectedStory.hashtags}
                </p>
                {selectedStory.videoLink && (
                  <a href={selectedStory.videoLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                    <ExternalLink size={13} /> Video Dekhen
                  </a>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="pub-mode-toggle">
                <button
                  className={`btn btn-sm ${mode === "schedule" ? "btn-warning" : ""}`}
                  onClick={() => setMode("schedule")}
                >
                  <Calendar size={13} /> Schedule
                </button>
                <button
                  className={`btn btn-sm ${mode === "publish" ? "btn-primary" : ""}`}
                  onClick={() => setMode("publish")}
                >
                  <Send size={13} /> Mark Published
                </button>
              </div>

              {/* Schedule Mode */}
              {mode === "schedule" && (
                <div className="pub-schedule-box">
                  <h4 className="pub-box-title">
                    <Calendar size={14} /> Schedule Date & Time
                  </h4>
                  <p className="form-hint" style={{ marginBottom: "0.75rem" }}>
                    YouTube pe manually schedule karein, phir woh time yahan save karein record ke liye.
                  </p>
                  <div className="schedule-fields">
                    <div className="form-group">
                      <label className="form-label" htmlFor="pub-date">Date</label>
                      <input
                        className="input"
                        type="date"
                        id="pub-date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="pub-time">Time</label>
                      <input
                        className="input"
                        type="time"
                        id="pub-time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-warning"
                    onClick={handleSchedule}
                    disabled={saving || !scheduleDate || !scheduleTime}
                  >
                    <Clock size={14} />
                    {saving ? "Saving…" : done ? "✅ Scheduled!" : "📅 Schedule Save Karein"}
                  </button>
                </div>
              )}

              {/* Publish Mode */}
              {mode === "publish" && (
                <div className="pub-publish-box">
                  <h4 className="pub-box-title">
                    <Send size={14} /> YouTube Link + Mark Published
                  </h4>
                  <p className="form-hint" style={{ marginBottom: "0.75rem" }}>
                    YouTube pe manually upload karein, phir link yahan paste karein.
                  </p>
                  <div className="form-group">
                    <label className="form-label" htmlFor="yt-link">YouTube Video Link</label>
                    <input
                      className="input"
                      id="yt-link"
                      value={ytLink}
                      onChange={(e) => setYtLink(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=xxxxxxx"
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handlePublish}
                    disabled={saving}
                  >
                    <Send size={14} />
                    {saving ? "Saving…" : done ? "✅ Published!" : "🚀 Mark as Published"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Scheduled List */}
      {scheduled.length > 0 && (
        <div className="pub-list-section">
          <h3 className="section-title" style={{ fontSize: "0.95rem" }}>
            📅 Scheduled Stories
          </h3>
          {scheduled.map((s) => (
            <div key={s.id} className="pub-list-item panel">
              <span className="badge badge-scheduled">SCHEDULED</span>
              <span className="pub-item-title">{s.title}</span>
              <span className="pub-item-date mono">
                <Clock size={12} /> {s.schedule || "Time set nahi"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Published List */}
      {published.length > 0 && (
        <div className="pub-list-section">
          <h3 className="section-title" style={{ fontSize: "0.95rem" }}>
            ✅ Published Stories
          </h3>
          {published.map((s) => (
            <div key={s.id} className="pub-list-item panel">
              <span className="badge badge-published">PUBLISHED</span>
              <span className="pub-item-title">{s.title}</span>
              {s.ytLink && (
                <a
                  href={s.ytLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-icon"
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
