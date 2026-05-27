import { useState, useEffect } from "react";
import { Send, Calendar, Clock, ExternalLink, LogIn, LogOut, FileText, Hash } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import YouTubeUploader from "./YouTubeUploader.jsx";
import "./PublishForm.css";

export default function PublishForm({ stories, onSchedule, onPublish, onEdit }) {
  const { signIn, signOut, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedId, setSelectedId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [ytLink, setYtLink] = useState("");
  
  // SEO Metadata overrides
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoTags, setSeoTags] = useState("");
  const [visibility, setVisibility] = useState("unlisted");

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState("publish"); // "schedule" ya "publish"
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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
      
      // Auto-fill SEO metadata from Sheet
      setSeoTitle(story.title || "");
      setSeoDescription(story.storytext || story.story || "");
      let tags = [];
      if (story.hashtags) tags.push(...story.hashtags.split(" "));
      if (story.seoTags) tags.push(...story.seoTags.split(","));
      setSeoTags(tags.map(t => t.trim()).filter(Boolean).join(", "));
      
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

  const handleUploadOrPublish = async () => {
    if (videoFile) {
      if (!isAuthenticated) {
        signIn();
        return;
      }
      setUploading(true);
    } else {
      await handlePublish();
    }
  };

  const handleYouTubeComplete = async (link) => {
    setYtLink(link);
    setUploading(false);
    setSaving(true);
    try {
      await onPublish(selectedId, link);
      setDone(true);
    } catch (err) {
      console.error(err);
      alert("Status update failed but video uploaded: " + link);
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
        Select an approved story below, edit the SEO metadata if necessary, and push it directly to YouTube or schedule it.
      </p>

      {/* OAuth Auth Section */}
      <div className="oauth-auth-section panel">
        {isAuthenticated ? (
          <div className="oauth-authenticated">
            <span className="auth-status">✅ Connected to YouTube</span>
            <button className="btn btn-sm btn-secondary" onClick={signOut}>
              <LogOut size={14} /> Disconnect
            </button>
          </div>
        ) : (
          <div className="oauth-not-authenticated">
            <span className="auth-status">⚠️ Not connected to YouTube</span>
            <button 
              className="btn btn-sm btn-primary" 
              onClick={signIn} 
              disabled={authLoading}
            >
              <LogIn size={14} /> {authLoading ? "Connecting..." : "Connect to YouTube Account"}
            </button>
            <p className="form-hint" style={{marginTop: "0.5rem"}}>
              Authorization is required to post videos directly to your channel.
            </p>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="publish-stats">
        <div className="pub-stat panel">
          <span className="pub-stat-num" style={{ color: "var(--accent4)" }}>{approved.length}</span>
          <span className="pub-stat-label">Approved & Ready</span>
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
          <p>⚠️ No approved stories ready for publishing. Head over to the Review Tab and approve stories first.</p>
        </div>
      )}

      {approved.length > 0 && (
        <div className="publish-form panel">
          {/* Story Select */}
          <div className="form-group">
            <label className="form-label" htmlFor="pub-story-select">
              Select Story to Publish
            </label>
            <select
              className="input"
              id="pub-story-select"
              value={selectedId}
              onChange={(e) => handleSelectStory(e.target.value)}
            >
              <option value="">-- Choose Story --</option>
              {approved.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.title}
                </option>
              ))}
            </select>
          </div>

          {selectedStory && (
            <>
              {/* Preview Current Drive Asset */}
              <div className="pub-story-info" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", marginBottom: "1rem" }}>
                <h3 className="pub-story-title">{selectedStory.title}</h3>
                {selectedStory.videoLink && (
                  <a href={selectedStory.videoLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{marginTop: "0.5rem"}}>
                    <ExternalLink size={13} style={{marginRight:"0.25rem"}}/> View Linked Drive Video
                  </a>
                )}
              </div>

              {/* SEO & METADATA SECTION */}
              <div className="seo-metadata-section panel" style={{ border: "1px solid var(--accent2)", padding: "1rem", marginBottom: "1rem" }}>
                <h4 className="pub-box-title" style={{ color: "var(--accent2)" }}>
                  <FileText size={16} /> SEO & YouTube Metadata
                </h4>
                
                <div className="form-group" style={{marginTop: "1rem"}}>
                  <label className="form-label">Video Title</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={seoTitle} 
                    onChange={e => setSeoTitle(e.target.value)} 
                    placeholder="Engaging YouTube Title"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Video Description</label>
                  <textarea 
                    className="input" 
                    rows={4} 
                    value={seoDescription} 
                    onChange={e => setSeoDescription(e.target.value)} 
                    placeholder="Full video description with links"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={seoTags} 
                    onChange={e => setSeoTags(e.target.value)} 
                    placeholder="kids, stories, moral"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Visibility</label>
                  <select className="input" value={visibility} onChange={e => setVisibility(e.target.value)}>
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="pub-mode-toggle">
                <button
                  className={`btn btn-sm ${mode === "publish" ? "btn-primary" : ""}`}
                  onClick={() => setMode("publish")}
                >
                  <Send size={13} /> Push to YouTube
                </button>
                <button
                  className={`btn btn-sm ${mode === "schedule" ? "btn-warning" : ""}`}
                  onClick={() => setMode("schedule")}
                >
                  <Calendar size={13} /> Add to Schedule
                </button>
              </div>

              {/* Publish Mode */}
              {mode === "publish" && (
                <div className="pub-publish-box">
                  <h4 className="pub-box-title">
                    <Send size={14} /> Upload & Publish
                  </h4>
                  <p className="form-hint" style={{ marginBottom: "0.75rem" }}>
                    Select the local MP4 variant of the story to initiate the resumable YouTube upload using the SEO data above.
                  </p>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="video-file">Local Video File</label>
                    <input
                      className="input"
                      type="file"
                      id="video-file"
                      accept="video/mp4,video/mov,video/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setVideoFile(file);
                      }}
                    />
                  </div>
                  
                  <button
                    className="btn btn-primary"
                    onClick={handleUploadOrPublish}
                    disabled={saving || uploading || !videoFile}
                  >
                    {uploading ? "Uploading..." : saving ? "Updating Sheet..." : done ? "✅ Published!" : "Start YouTube Upload"}
                  </button>

                  {!isAuthenticated && videoFile && (
                    <div className="form-hint" style={{ color: "var(--error)", marginTop: "0.5rem" }}>
                      You must Connect to YouTube above before pushing!
                    </div>
                  )}

                  {uploading && (
                    <YouTubeUploader
                      metadata={{
                        title: seoTitle || "Untitled",
                        description: seoDescription || "",
                        tags: seoTags.split(',').map(t=>t.trim()) || [],
                        categoryId: "22",
                        privacyStatus: visibility,
                      }}
                      videoFile={videoFile}
                      onComplete={handleYouTubeComplete}
                      onError={(err) => {
                        console.error(err);
                        setUploading(false);
                      }}
                    />
                  )}
                </div>
              )}

              {/* Schedule Mode */}
              {mode === "schedule" && (
                <div className="pub-schedule-box">
                  <h4 className="pub-box-title">
                    <Calendar size={14} /> Schedule for Later
                  </h4>
                  <p className="form-hint" style={{ marginBottom: "0.75rem" }}>
                    Set a time for this story to be dropped. (Note: True auto-uploading of large files without browser selection requires backend integration).
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
                    {saving ? "Saving…" : done ? "✅ Scheduled!" : "Save Schedule"}
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
                <Clock size={12} /> {s.schedule ? s.schedule.replace("T", " ") : "Time set nahi"}
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
