import { useState, useEffect } from "react";
import { BookOpen, User, Hash, Tag, ArrowRight, CheckCircle, ChevronDown, ExternalLink } from "lucide-react";
import "./Storyboard.css";

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
  onEdit,
  onMoveToReview,
}) {
  const [notes, setNotes] = useState(story?.reviewNotes || "");
  const [videoLink, setVideoLink] = useState(story?.videoLink || "");
  const [thumbLink, setThumbLink] = useState(story?.thumbLink || "");
  
  const [saving, setSaving] = useState(false);
  const [savedAssets, setSavedAssets] = useState(false);

  // Sync state when story changes
  useEffect(() => {
    if (story) {
      setNotes(story.reviewNotes || "");
      setVideoLink(story.videoLink || "");
      setThumbLink(story.thumbLink || "");
      setSavedAssets(false);
    }
  }, [story]);

  // Only show stories that have been pushed to storyboard
  const storyboardStories = stories.filter(s => s.dashStatus === "storyboard");

  const handleSelect = (id) => {
    const found = storyboardStories.find((s) => s.id === id);
    if (found) {
      onSelectStory(found);
    }
  };

  const handleSaveNotes = async () => {
    if (!story) return;
    setSaving(true);
    await onEdit(story.id, { reviewNotes: notes });
    setSaving(false);
  };

  const isValidLink = (link) => {
    if (!link) return false;
    return link.includes("drive.google.com") || link.includes("docs.google.com") || /^[\w-]{25,}$/.test(link);
  };

  const handleSaveAssets = async () => {
    if (!story) return;
    if (!videoLink && !thumbLink) {
      alert("No links provided to save!");
      return;
    }
    if (videoLink && !isValidLink(videoLink)) {
      alert("Invalid Video Drive Link");
      return;
    }
    if (thumbLink && !isValidLink(thumbLink)) {
      alert("Invalid Thumb Drive Link");
      return;
    }

    setSaving(true);
    try {
      const updates = {};
      if (videoLink) updates.videoLink = videoLink;
      if (thumbLink) updates.thumbLink = thumbLink;

      // Both limits present implies fully uploaded
      const bothPresent = !!(videoLink && thumbLink);

      // Save links
      await onEdit(story.id, updates);

      // Auto route to Review
      if (bothPresent) {
        await onMoveToReview(story.id);
        // Story is no longer in "storyboard" state so deselect 
        onSelectStory(null);
      } else {
        setSavedAssets(true);
        setTimeout(() => setSavedAssets(false), 2000);
      }
    } catch (err) {
      console.error(err);
      alert("Failed saving assets: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="storyboard-section animate-fade-in" id="panel-storyboard" role="tabpanel" aria-labelledby="tab-storyboard">
      <h2 className="section-title">🎬 Storyboard Workspace</h2>
      <p className="section-desc">
        Review story content, leave production notes, and attach generated assets via Google Drive. Linking both video and thumbnail sends the story automatically to Review.
      </p>

      {/* Story Selector */}
      <div className="sb-selector panel">
        <label className="form-label" htmlFor="sb-story-select">
          <ChevronDown size={14} /> Assigned to Storyboard
        </label>
        <select
          className="input"
          id="sb-story-select"
          value={story?.id || ""}
          onChange={(e) => handleSelect(e.target.value)}
        >
          <option value="">-- View queued stories --</option>
          {storyboardStories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} — {s.title}
            </option>
          ))}
        </select>
        <span className="story-count-label" style={{marginLeft: "1rem"}}>Total: {storyboardStories.length}</span>
      </div>

      {!story && (
        <div className="sb-empty panel">
          <BookOpen size={48} style={{ color: "var(--dimmer)" }} />
          <p>Select a story from the queue to start producing.</p>
        </div>
      )}

      {story && (
        <div className="sb-content">
          {/* Header Row */}
          <div className="sb-header panel">
            <div className="sb-title-row">
              <div>
                <span className={`badge ${STATUS_COLORS[story.dashStatus] || "badge-draft"}`}>
                  {story.dashStatus?.toUpperCase() || "STORYBOARD"}
                </span>
                <h3 className="sb-title">{story.title}</h3>
                <p className="sb-meta">
                  <span>📁 {story.category || "N/A"}</span>
                  <span>🆔 {story.id}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 2 Column Layout */}
          <div className="sb-grid">
            {/* LEFT: Story Text */}
            <div className="sb-card panel">
              <h4 className="sb-card-title"><BookOpen size={16} /> Story</h4>
              <div className="sb-story-text">{story.story || "No text"}</div>
            </div>

            {/* RIGHT: Character */}
            <div className="sb-card panel">
              <h4 className="sb-card-title"><User size={16} /> Character Brief</h4>
              <div className="sb-character-text">{story.character || "No description"}</div>
            </div>
            
            <div className="sb-card panel">
              <h4 className="sb-card-title"><Hash size={16} /> Hashtags</h4>
              <div className="sb-tags">
                {story.hashtags ? story.hashtags.split(" ").map((tag, i) => (
                  <span key={i} className="sb-tag hashtag">{tag}</span>
                )) : <span className="sb-empty-tag">No HashTags</span>}
              </div>
            </div>

            <div className="sb-card panel">
              <h4 className="sb-card-title"><Tag size={16} /> SEO Tags</h4>
              <div className="sb-tags">
                {story.seoTags ? story.seoTags.split(",").map((tag, i) => (
                  <span key={i} className="sb-tag seo">{tag.trim()}</span>
                )) : <span className="sb-empty-tag">No SEO Tags</span>}
              </div>
            </div>
          </div>

          <div className="sb-notes panel">
             <h4 className="sb-card-title">📝 Editor Notes</h4>
             <textarea
               className="input sb-textarea"
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Director / Voice-over notes..."
               rows={3}
             />
             <button
               className="btn btn-sm btn-secondary"
               onClick={handleSaveNotes}
               disabled={saving}
               style={{ marginTop: "0.5rem" }}
             >
               {saving ? "Saving…" : "💾 Save Notes"}
             </button>
          </div>

          {/* ASSET UPLOADING EMBED */}
          <div className="sb-notes panel" style={{ border: "1px solid var(--accent2)" }}>
            <h4 className="sb-card-title" style={{ color: "var(--accent2)" }}>🎬 Attach Drive Assets</h4>
            <p className="section-desc" style={{marginBottom: "1rem"}}>Upload to Google Drive, share Anyone with link, paste URLs here. Saving BOTH automatically routes story to Review Tab.</p>

            <div className="form-group">
                <label className="form-label" htmlFor="video-link">Video Drive Link</label>
                <div className="link-input-row" style={{display: "flex", gap: "0.5rem"}}>
                  <input
                    className="input"
                    id="video-link"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    disabled={saving}
                  />
                  {videoLink && isValidLink(videoLink) && (
                    <a href={videoLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-icon"><ExternalLink size={14} /></a>
                  )}
                </div>
            </div>

            <div className="form-group" style={{marginTop: "1rem"}}>
                <label className="form-label" htmlFor="thumb-link">Thumbnail Drive Link (1280x720)</label>
                <div className="link-input-row" style={{display: "flex", gap: "0.5rem"}}>
                  <input
                    className="input"
                    id="thumb-link"
                    value={thumbLink}
                    onChange={(e) => setThumbLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    disabled={saving}
                  />
                  {thumbLink && isValidLink(thumbLink) && (
                    <a href={thumbLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-icon"><ExternalLink size={14} /></a>
                  )}
                </div>
            </div>

            <div style={{marginTop: "1rem"}}>
              <button
                className="btn btn-primary"
                onClick={handleSaveAssets}
                disabled={saving || (!videoLink && !thumbLink)}
              >
                {saving ? `Saving...` : "💾 Save Assets"}
              </button>
              {savedAssets && <span style={{marginLeft: "1rem", color: "var(--accent4)"}}>Saved!</span>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
