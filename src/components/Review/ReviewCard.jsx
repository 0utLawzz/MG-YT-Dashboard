import { useState } from "react";
import { CheckCircle, RotateCcw, Edit3, ExternalLink, Save, X, Zap } from "lucide-react";
import { getDriveDirectDownload, getDriveThumbnail } from "../../lib/api";
import "./ReviewCard.css";

export default function ReviewPanel({ stories, onApprove, onEdit, onGoToPublish }) {
  const [editingId, setEditingId]   = useState(null);
  const [editNotes, setEditNotes]   = useState("");
  const [approving, setApproving]   = useState(null);
  const [failedPreviews, setFailedPreviews] = useState(new Set());

  const reviewable = stories.filter((s) => s.dashStatus === "review");

  const handleApprove = async (story) => {
    setApproving(story.id);
    try {
      await onApprove(story.id, "Admin");
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (story) => {
    // Drop back into storyboard queue for fixes
    await onEdit(story.id, { dashStatus: "storyboard" });
  };

  const handleSaveNotes = async (story) => {
    try {
      await onEdit(story.id, { reviewNotes: editNotes });
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save notes:', err);
      alert('Failed to save notes: ' + err.message);
    }
  };

  return (
    <section
      className="review-section animate-fade-in"
      id="panel-review"
      role="tabpanel"
      aria-labelledby="tab-review"
    >
      <h2 className="section-title">✅ Review Queue</h2>
      <p className="section-desc">
        <strong style={{ color: "var(--accent3)" }}>{reviewable.length}</strong> stories are ready for technical review.
      </p>

      {reviewable.length === 0 ? (
        <div className="review-empty panel">
          <CheckCircle size={48} style={{ color: "var(--accent4)" }} />
          <p>No stories in the review queue at this time.</p>
          <p className="review-hint">Assets saved on the Storyboard will route here.</p>
        </div>
      ) : (
        <div className="review-list">
          {reviewable.map((story, idx) => (
            <div
              key={story.id}
              className="review-card panel"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              {/* Header */}
              <div className="review-card-header">
                <div>
                  <span className="badge badge-review">REVIEW</span>
                  <span className="review-id mono"> #{story.id}</span>
                </div>
                <div className="review-card-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleReject(story)}
                    title="Reject and send back to Storyboard"
                  >
                    <RotateCcw size={13} /> Reject
                  </button>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleApprove(story)}
                    disabled={approving === story.id}
                  >
                    <CheckCircle size={13} />
                    {approving === story.id ? "Approving…" : "✅ Approve"}
                  </button>
                </div>
              </div>

              <h3 className="review-title">{story.title}</h3>
              <div className="review-meta">
                <span>📁 {story.category || "N/A"}</span>
              </div>

              {/* Story + Character */}
              <div className="review-detail-grid">
                <div className="review-detail-box">
                  <h4 className="review-detail-title">📖 Story</h4>
                  <p className="review-detail-text">{story.story || "N/A"}</p>
                </div>
                <div className="review-detail-box">
                  <h4 className="review-detail-title">👤 Character</h4>
                  <p className="review-detail-text">{story.character || "N/A"}</p>
                </div>
              </div>

              <div className="review-tags-row">
                <div className="review-tags-box">
                  <h4 className="review-detail-title"># Hashtags</h4>
                  <p className="review-tag-text">{story.hashtags || "—"}</p>
                </div>
                <div className="review-tags-box">
                  <h4 className="review-detail-title">🔍 SEO Tags</h4>
                  <p className="review-tag-text">{story.seoTags || "—"}</p>
                </div>
              </div>

              {/* ASSETS: Raw Links / Simple Display */}
              <div className="review-preview-section" style={{ padding: "1rem", backgroundColor: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)"}}>
                <h4 className="review-detail-title" style={{marginBottom: "0.5rem"}}>📎 Linked Assets</h4>
                <div className="review-assets">
                  
                  {/* Video Box */}
                  <div className="preview-asset-col">
                    <span className="preview-asset-label">🎬 Video</span>
                    {story.videoLink ? (
                      <div className="preview-thumb-box" style={{ padding: "0.5rem", textAlign: "center", backgroundColor: "var(--panel)" }}>
                        {!failedPreviews.has(`video-${story.id}`) ? (
                          <video
                            src={getDriveDirectDownload(story.videoLink)}
                            controls
                            style={{ maxWidth: "100%", maxHeight: "200px", display: "block", margin: "0 auto", borderRadius: "8px" }}
                            onError={() => {
                              setFailedPreviews(prev => new Set(prev).add(`video-${story.id}`));
                            }}
                          />
                        ) : null}
                        {failedPreviews.has(`video-${story.id}`) && (
                          <div style={{ padding: "1rem" }}>
                            <p style={{marginBottom: "1rem"}}>Video preview blocked - file may not be shared publicly</p>
                            <a
                              href={story.videoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary"
                            >
                              <ExternalLink size={14} style={{ marginRight: "0.5rem" }}/> Open Video in Drive
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="review-asset missing">🎬 Video Missing</span>
                    )}
                  </div>

                  {/* Thumb Box */}
                  <div className="preview-asset-col">
                    <span className="preview-asset-label">🖼️ Thumbnail</span>
                    {story.thumbLink ? (
                      <div className="preview-thumb-box" style={{ textAlign: "center", backgroundColor: "var(--panel)", padding: "0.5rem" }}>
                        {!failedPreviews.has(`thumb-${story.id}`) ? (
                          <img
                            src={getDriveThumbnail(story.thumbLink)}
                            alt="Thumbnail preview"
                            style={{ maxWidth: "100%", maxHeight: "160px", display: "block", margin: "0 auto", borderRadius: "8px", objectFit: "cover" }}
                            onError={() => {
                              setFailedPreviews(prev => new Set(prev).add(`thumb-${story.id}`));
                            }}
                          />
                        ) : null}
                        {failedPreviews.has(`thumb-${story.id}`) && (
                          <div style={{ padding: "1rem" }}>
                            <p style={{marginBottom: "1rem"}}>Image preview blocked - file may not be shared publicly</p>
                            <a
                              href={story.thumbLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                            >
                              <ExternalLink size={13} style={{ marginRight: "0.5rem" }}/> Open Thumb in Drive
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="review-asset missing">🖼️ Thumb Missing</span>
                    )}
                  </div>

                </div>
              </div>

              {/* Notes */}
              <div className="review-notes-section" style={{marginTop: "1rem"}}>
                <div className="review-notes-header">
                  <h4 className="review-detail-title">📝 Editor Notes</h4>
                  {editingId !== story.id ? (
                    <button
                      className="btn btn-sm btn-icon"
                      onClick={() => {
                        setEditingId(story.id);
                        setEditNotes(story.reviewNotes || "");
                      }}
                    >
                      <Edit3 size={13} />
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <button className="btn btn-sm btn-icon" onClick={() => handleSaveNotes(story)}>
                        <Save size={13} />
                      </button>
                      <button className="btn btn-sm btn-icon" onClick={() => setEditingId(null)}>
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
                {editingId === story.id ? (
                  <textarea
                    className="input review-textarea"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    placeholder="Provide rejection context / notes…"
                    autoFocus
                  />
                ) : (
                  <p className="review-notes-text">
                    {story.reviewNotes || <em style={{ color: "var(--dimmer)" }}>No notes</em>}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approved banner */}
      {stories.filter((s) => s.dashStatus === "approved").length > 0 && (
        <div className="review-approved-banner panel">
          <CheckCircle size={18} style={{ color: "var(--accent4)" }} />
          <span>
            <strong style={{ color: "var(--accent4)" }}>
              {stories.filter((s) => s.dashStatus === "approved").length} stories
            </strong>{" "}
            are approved!
          </span>
          <button className="btn btn-primary btn-sm" onClick={onGoToPublish}>
            🚀 Go to Publish
          </button>
        </div>
      )}

    </section>
  );
}
