// ============================================
// src/components/Storyboard/Storyboard.jsx
// Story ki poori detail — Character, Story text,
// Hashtags, SEO tags sab yahan dikhte hain
// Status "storyboard" karo ya Upload pe jao
// ============================================

import { useState } from "react";
import { BookOpen, User, Hash, Tag, ArrowRight, CheckCircle, ChevronDown } from "lucide-react";
import "./Storyboard.css";

// Status badge colors
const STATUS_COLORS = {
  pending:    "badge-draft",
  storyboard: "badge-complete",
  uploaded:   "badge-review",
  review:     "badge-review",
  approved:   "badge-approved",
  scheduled:  "badge-scheduled",
  published:  "badge-published",
};

export default function Storyboard({
  story,
  stories,
  onSelectStory,
  onMoveToStoryboard,
  onGoToUpload,
  onEdit,
}) {
  const [notes, setNotes] = useState(story?.reviewNotes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Story select karo dropdown se
  const handleSelect = (id) => {
    const found = stories.find((s) => s.id === id);
    if (found) {
      onSelectStory(found);
      setNotes(found.reviewNotes || "");
      setSaved(false);
    }
  };

  // Status storyboard karo
  const handleMarkStoryboard = async () => {
    if (!story) return;
    setSaving(true);
    await onMoveToStoryboard(story.id);
    setSaving(false);
    setSaved(true);
  };

  // Notes save karo
  const handleSaveNotes = async () => {
    if (!story) return;
    setSaving(true);
    await onEdit(story.id, { reviewNotes: notes });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Upload pe jao
  const handleGoUpload = () => {
    if (story) onGoToUpload(story);
  };

  return (
    <section
      className="storyboard-section animate-fade-in"
      id="panel-storyboard"
      role="tabpanel"
      aria-labelledby="tab-storyboard"
    >
      <h2 className="section-title">🎬 Storyboard</h2>
      <p className="section-desc">
        Story select karein, poora content dekhein, aur Upload ke liye ready karein.
      </p>

      {/* Story Selector */}
      <div className="sb-selector panel">
        <label className="form-label" htmlFor="sb-story-select">
          <ChevronDown size={14} /> Story Select Karein
        </label>
        <select
          className="input"
          id="sb-story-select"
          value={story?.id || ""}
          onChange={(e) => handleSelect(e.target.value)}
        >
          <option value="">-- Story chunein --</option>
          {stories.map((s) => (
            <option key={s.id} value={s.id}>
              [{s.dashStatus?.toUpperCase()}] {s.id} — {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* Story not selected */}
      {!story && (
        <div className="sb-empty panel">
          <BookOpen size={48} style={{ color: "var(--dimmer)" }} />
          <p>Upar se story select karein</p>
        </div>
      )}

      {/* Story Detail */}
      {story && (
        <div className="sb-content">
          {/* Header Row */}
          <div className="sb-header panel">
            <div className="sb-title-row">
              <div>
                <span className={`badge ${STATUS_COLORS[story.dashStatus] || "badge-draft"}`}>
                  {story.dashStatus?.toUpperCase() || "PENDING"}
                </span>
                <h3 className="sb-title">{story.title}</h3>
                <p className="sb-meta">
                  <span>📁 {story.category || "N/A"}</span>
                  <span>🆔 {story.id}</span>
                  <span>📊 {story.status || "N/A"}</span>
                </p>
              </div>
              <div className="sb-actions">
                {/* Storyboard status set karo */}
                {story.dashStatus === "pending" && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleMarkStoryboard}
                    disabled={saving}
                  >
                    <BookOpen size={13} />
                    {saving ? "Saving…" : "Mark as Storyboard"}
                  </button>
                )}
                {saved && (
                  <span className="sb-saved">
                    <CheckCircle size={14} /> Saved!
                  </span>
                )}
                {/* Upload pe jao */}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleGoUpload}
                >
                  <ArrowRight size={13} /> Go to Upload
                </button>
              </div>
            </div>
          </div>

          {/* 2 Column Layout */}
          <div className="sb-grid">
            {/* LEFT: Story Text */}
            <div className="sb-card panel">
              <h4 className="sb-card-title">
                <BookOpen size={16} /> Story
              </h4>
              <div className="sb-story-text">
                {story.story || "Story text nahi hai"}
              </div>
            </div>

            {/* RIGHT: Character */}
            <div className="sb-card panel">
              <h4 className="sb-card-title">
                <User size={16} /> Character Description
              </h4>
              <div className="sb-character-text">
                {story.character || "Character description nahi hai"}
              </div>
            </div>

            {/* Hashtags */}
            <div className="sb-card panel">
              <h4 className="sb-card-title">
                <Hash size={16} /> Hashtags
              </h4>
              <div className="sb-tags">
                {story.hashtags
                  ? story.hashtags.split(" ").map((tag, i) => (
                      <span key={i} className="sb-tag hashtag">
                        {tag}
                      </span>
                    ))
                  : <span className="sb-empty-tag">Hashtags nahi hain</span>}
              </div>
            </div>

            {/* SEO Tags */}
            <div className="sb-card panel">
              <h4 className="sb-card-title">
                <Tag size={16} /> SEO Tags
              </h4>
              <div className="sb-tags">
                {story.seoTags
                  ? story.seoTags.split(",").map((tag, i) => (
                      <span key={i} className="sb-tag seo">
                        {tag.trim()}
                      </span>
                    ))
                  : <span className="sb-empty-tag">SEO tags nahi hain</span>}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="sb-notes panel">
            <h4 className="sb-card-title">📝 Production Notes</h4>
            <textarea
              className="input sb-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Koi bhi notes yahan likhein — director ke liye, editor ke liye…"
              rows={4}
            />
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleSaveNotes}
              disabled={saving}
              style={{ marginTop: "0.5rem" }}
            >
              {saving ? "Saving…" : saved ? "✅ Saved!" : "💾 Save Notes"}
            </button>
          </div>

          {/* Drive Links (if already uploaded) */}
          {(story.videoLink || story.thumbLink) && (
            <div className="sb-links panel">
              <h4 className="sb-card-title">📎 Uploaded Assets</h4>
              <div className="sb-link-row">
                {story.videoLink && (
                  <a
                    href={story.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                  >
                    🎬 Video Dekhen
                  </a>
                )}
                {story.thumbLink && (
                  <a
                    href={story.thumbLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                  >
                    🖼️ Thumbnail Dekhen
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
