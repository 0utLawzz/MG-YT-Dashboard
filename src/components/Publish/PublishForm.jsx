import { useState, useEffect } from "react";
import { Send, Calendar, Clock, ExternalLink, RefreshCw, AlertCircle, Edit3, Save, X } from "lucide-react";
import { publishService } from "../../services/publishService";
import "./PublishForm.css";

export default function PublishForm({ stories, onSchedule, onPublish, onEdit }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [retryId, setRetryId] = useState(null);
  const [ticker, setTicker] = useState(0);

  // Poll for publishService status updates
  useEffect(() => {
    const unsub = publishService.subscribe(() => setTicker(t => t + 1));
    return unsub;
  }, []);

  const publishing = stories.filter((s) => s.dashStatus === "publishing" || publishService.getStatus(s.id));
  const failed = stories.filter((s) => s.dashStatus === "publish_failed" && !publishService.getStatus(s.id));
  const scheduled = stories.filter((s) => s.dashStatus === "scheduled");
  const published = stories.filter((s) => s.dashStatus === "published");

  const handleRetry = async (id) => {
    setRetryId(id);
    try {
      await publishService.publishStory(id, onEdit);
    } catch (err) {
      console.error(err);
    } finally {
      setRetryId(null);
    }
  };

  const handleEditClick = (story) => {
    setEditingId(story.id);
    setEditData({
      title: story.title || "",
      hashtags: story.hashtags || "",
      schedule: story.schedule ? story.schedule.split("T")[0] : "",
      time: story.schedule ? story.schedule.split("T")[1]?.slice(0, 5) : ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    let newSchedule = null;
    if (editData.schedule && editData.time) {
      newSchedule = `${editData.schedule}T${editData.time}`;
    }
    
    await onEdit(editingId, {
      title: editData.title,
      hashtags: editData.hashtags,
      schedule: newSchedule
    });
    setEditingId(null);
  };

  return (
    <section
      className="publish-section animate-fade-in"
      id="panel-publish"
      role="tabpanel"
      aria-labelledby="tab-publish"
    >
      <h2 className="section-title">🚀 Publish Operations</h2>
      <p className="section-desc">
        Publishing is now automatically handled upon Approval. Monitor statuses below, retry failures, or edit metadata.
      </p>

      {/* Stats Row */}
      <div className="publish-stats">
        <div className="pub-stat panel">
          <span className="pub-stat-num" style={{ color: "var(--accent4)" }}>{publishing.length}</span>
          <span className="pub-stat-label">Publishing...</span>
        </div>
        <div className="pub-stat panel">
          <span className="pub-stat-num" style={{ color: "var(--error)" }}>{failed.length}</span>
          <span className="pub-stat-label">Failed</span>
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

      {/* 2. Publishing Currently */}
      {publishing.length > 0 && (
        <div className="pub-list-section">
          <h3 className="section-title" style={{ fontSize: "0.95rem" }}>
            ⏳ Currently Publishing
          </h3>
          {publishing.map((s) => (
            <div key={s.id} className="pub-list-item panel" style={{ borderLeft: "4px solid var(--accent4)" }}>
              <span className="badge badge-review">PUBLISHING</span>
              <span className="pub-item-title">{s.title}</span>
              <span className="monospaced loading-text">Uploading to YouTube...</span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Failed */}
      {failed.length > 0 && (
        <div className="pub-list-section">
          <h3 className="section-title" style={{ fontSize: "0.95rem" }}>
            ❌ Failed Uploads
          </h3>
          {failed.map((s) => (
            <div key={s.id} className="pub-list-item panel" style={{ borderLeft: "4px solid var(--error)", flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
              <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span className="badge" style={{ backgroundColor: "var(--error)", color: "#fff" }}>FAILED</span>
                  <span className="pub-item-title" style={{ marginLeft: "1rem" }}>{s.title}</span>
                </div>
                <button 
                  className="btn btn-sm btn-primary" 
                  onClick={() => handleRetry(s.id)}
                  disabled={retryId === s.id}
                >
                  <RefreshCw size={12} style={{marginRight: "0.5rem"}}/> 
                  {retryId === s.id ? "Retrying..." : "Retry Publish"}
                </button>
              </div>
              <div className="error-text" style={{ fontSize: "0.8REM", color: "var(--dimmer)" }}>
                <AlertCircle size={12} /> {s.uploadError || "Unknown error during upload."}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Scheduled List */}
      {scheduled.length > 0 && (
        <div className="pub-list-section">
          <h3 className="section-title" style={{ fontSize: "0.95rem" }}>
            📅 Scheduled Stories
          </h3>
          {scheduled.map((s) => (
            <div key={s.id} className="pub-list-item panel" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
              <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span className="badge badge-scheduled">SCHEDULED</span>
                  <span className="pub-item-title" style={{ marginLeft: "1rem" }}>{s.title}</span>
                </div>
                {editingId !== s.id ? (
                  <button className="btn btn-sm btn-icon" onClick={() => handleEditClick(s)}>
                    <Edit3 size={14} />
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-sm btn-icon btn-success" onClick={handleSaveEdit}>
                      <Save size={14} />
                    </button>
                    <button className="btn btn-sm btn-icon" onClick={() => setEditingId(null)}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              {editingId === s.id ? (
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem", width: "100%" }}>
                  <input type="text" className="input" style={{flex: 1, minWidth: "150px"}} placeholder="Title" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                  <input type="date" className="input" value={editData.schedule} onChange={e => setEditData({...editData, schedule: e.target.value})} />
                  <input type="time" className="input" value={editData.time} onChange={e => setEditData({...editData, time: e.target.value})} />
                </div>
              ) : (
                <span className="pub-item-date mono" style={{ fontSize: "0.85rem", color: "var(--dimmer)" }}>
                  <Clock size={12} /> {s.schedule ? new Date(s.schedule).toLocaleString() : "Time set nahi"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 5. Published List */}
      {published.length > 0 && (
        <div className="pub-list-section">
          <h3 className="section-title" style={{ fontSize: "0.95rem" }}>
            ✅ Published Stories
          </h3>
          {published.map((s) => (
            <div key={s.id} className="pub-list-item panel" style={{ display: "flex", alignItems: "center" }}>
              <span className="badge badge-published">PUBLISHED</span>
              <span className="pub-item-title" style={{ marginLeft: "1rem", flex: 1 }}>{s.title}</span>
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
