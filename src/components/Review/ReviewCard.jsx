import { useState } from "react";
import { CheckCircle, RotateCcw, Edit3, ExternalLink, Save, X, Play, Image } from "lucide-react";
import { getDriveEmbedLink, getDriveDirectLink } from "../../lib/api";
import "./ReviewCard.css";

export default function ReviewPanel({ stories, onApprove, onEdit, onGoToPublish }) {
  const [editingId, setEditingId]   = useState(null);
  const [editNotes, setEditNotes]   = useState("");
  const [approving, setApproving]   = useState(null);
  const [previewId, setPreviewId]   = useState(null); // mini preview toggle

  const reviewable = stories.filter((s) => s.dashStatus === "review");

  // FIX: story.id pass karo — story object nahi
  const handleApprove = async (story) => {
    setApproving(story.id);
    try {
      await onApprove(story.id, "Admin"); // ✅ story.id = string "Row-001-01"
    } finally {
      setApproving(null);
    }
  };

  const handleSendBack = async (story) => {
    await onEdit(story.id, { dashStatus: "uploaded" });
  };

  const handleSaveNotes = async (story) => {
    await onEdit(story.id, { reviewNotes: editNotes });
    setEditingId(null);
  };

  const togglePreview = (id) => {
    setPreviewId((prev) => (prev === id ? null : id));
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
        <strong style={{ color: "var(--accent3)" }}>{reviewable.length}</strong> stories review ke liye tayyar hain.
      </p>

      {reviewable.length === 0 ? (
        <div className="review-empty panel">
          <CheckCircle size={48} style={{ color: "var(--accent4)" }} />
          <p>Abhi koi story review mein nahi hai.</p>
          <p className="review-hint">Upload tab se story "Send to Review" karein.</p>
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
                    className="btn btn-sm"
                    onClick={() => handleSendBack(story)}
                    title="Wapis Upload mein bhejo"
                  >
                    <RotateCcw size={13} /> Send Back
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

              {/* Title + Meta */}
              <h3 className="review-title">{story.title}</h3>
              <div className="review-meta">
                <span>📁 {story.category || "N/A"}</span>
                <span>📊 {story.status || "N/A"}</span>
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

              {/* Hashtags + SEO */}
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

              {/* ============================================
                  MINI PREVIEW — Video + Thumbnail
                  Toggle button se preview open hota hai
                  ============================================ */}
              <div className="review-preview-section">
                <div className="review-assets">
                  {/* Video */}
                  {story.videoLink ? (
                    <div className="preview-asset-col">
                      <span className="preview-asset-label">🎬 Video</span>
                      <div className="preview-thumb-box">
                        <iframe
                          src={getDriveEmbedLink(story.videoLink)}
                          className="preview-video-frame"
                          allow="autoplay"
                          title="Video preview"
                        />
                      </div>
                      <a
                        href={story.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm"
                        style={{ marginTop: "0.4rem" }}
                      >
                        <ExternalLink size={12} /> Full Screen
                      </a>
                    </div>
                  ) : (
                    <span className="review-asset missing">🎬 Video Missing</span>
                  )}

                  {/* Thumbnail */}
                  {story.thumbLink ? (
                    <div className="preview-asset-col">
                      <span className="preview-asset-label">🖼️ Thumbnail</span>
                      <div className="preview-thumb-box">
                        <img
                          src={getDriveDirectLink(story.thumbLink)}
                          alt="Thumbnail"
                          className="preview-thumb-img"
                          onError={(e) => {
                            // Drive image load nahi hui to fallback
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        {/* Fallback agar image load na ho */}
                        <div className="preview-thumb-fallback" style={{ display: "none" }}>
                          <Image size={24} />
                          <span>Preview not available</span>
                          <a
                            href={story.thumbLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm"
                          >
                            <ExternalLink size={12} /> Drive mein dekhen
                          </a>
                        </div>
                      </div>
                      <a
                        href={story.thumbLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm"
                        style={{ marginTop: "0.4rem" }}
                      >
                        <ExternalLink size={12} /> Full Screen
                      </a>
                    </div>
                  ) : (
                    <span className="review-asset missing">🖼️ Thumbnail Missing</span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="review-notes-section">
                <div className="review-notes-header">
                  <h4 className="review-detail-title">📝 Notes</h4>
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
                    placeholder="Notes likhein…"
                    autoFocus
                  />
                ) : (
                  <p className="review-notes-text">
                    {story.reviewNotes || <em style={{ color: "var(--dimmer)" }}>Koi notes nahi</em>}
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
            approve ho gayi hain!
          </span>
          <button className="btn btn-primary btn-sm" onClick={onGoToPublish}>
            🚀 Publish Tab
          </button>
        </div>
      )}
    </section>
  );
}
