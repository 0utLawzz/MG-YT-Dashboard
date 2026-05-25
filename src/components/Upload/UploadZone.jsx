// ============================================
// src/components/Upload/UploadZone.jsx
// Supabase REMOVED — Google Drive links paste karo
// Video + Thumbnail Drive link → Sheet mein save
// ============================================

import { useState, useEffect } from "react";
import { Link, CheckCircle, AlertTriangle, ExternalLink, ArrowRight } from "lucide-react";
import "./UploadZone.css";

export default function UploadZone({
  story,
  stories,
  onSelectStory,
  onUpdate,
  onMoveToUploaded,
  onMoveToReview,
}) {
  const [videoLink, setVideoLink] = useState("");
  const [thumbLink, setThumbLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Story change hone par fields update karo
  useEffect(() => {
    if (story) {
      setVideoLink(story.videoLink || "");
      setThumbLink(story.thumbLink || "");
      setSaved(false);
      setError("");
    }
  }, [story?.id]);

  const handleSelectStory = (id) => {
    const found = stories.find((s) => s.id === id);
    if (found) onSelectStory(found);
  };

  // Drive link validate karo — file ID hona chahiye
  const isValidDriveLink = (link) => {
    if (!link) return false;
    return (
      link.includes("drive.google.com") ||
      link.includes("docs.google.com") ||
      /^[\w-]{25,}$/.test(link) // sirf file ID paste kiya
    );
  };

  // Save both links
  const handleSave = async () => {
    setError("");

    if (!videoLink && !thumbLink) {
      setError("Kam az kam ek link daalen");
      return;
    }

    if (videoLink && !isValidDriveLink(videoLink)) {
      setError("Video Drive link valid nahi hai");
      return;
    }

    if (thumbLink && !isValidDriveLink(thumbLink)) {
      setError("Thumbnail Drive link valid nahi hai");
      return;
    }

    setSaving(true);
    try {
      // Links save karo Sheet mein
      await onUpdate(story.id, {
        videoLink: videoLink,
        thumbLink: thumbLink,
      });

      // Agar dono links hain → status "uploaded"
      if (videoLink && thumbLink) {
        await onMoveToUploaded(story.id);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Save fail: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Review ke liye bhejو
  const handleSendToReview = async () => {
    setSaving(true);
    try {
      await onMoveToReview(story.id);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const bothLinked = videoLink && thumbLink;
  const isUploaded = story?.dashStatus === "uploaded" || story?.dashStatus === "review";

  return (
    <section
      className="upload-section animate-fade-in"
      id="panel-upload"
      role="tabpanel"
      aria-labelledby="tab-upload"
    >
      <h2 className="section-title">⬆️ Upload Assets</h2>
      <p className="section-desc">
        Google Drive mein video/thumbnail upload karein. Wahan se{" "}
        <strong>Share → Copy Link</strong> karein aur yahan paste karein.
      </p>

      {/* Drive Upload Guide */}
      <div className="upload-guide panel">
        <h4 className="guide-title">📋 Drive Upload Kaise Karein?</h4>
        <ol className="guide-steps">
          <li>Google Drive kholen → <strong>New → File Upload</strong></li>
          <li>Video ya Thumbnail upload karein</li>
          <li>File pe right-click → <strong>Share → Anyone with link → Copy</strong></li>
          <li>Woh link yahan paste karein</li>
        </ol>
      </div>

      {/* Story Selector */}
      <div className="upload-story-selector panel">
        <label className="form-label" htmlFor="upload-story-select">
          Story Select Karein
        </label>
        <select
          className="input"
          id="upload-story-select"
          value={story?.id || ""}
          onChange={(e) => handleSelectStory(e.target.value)}
        >
          <option value="">-- Story chunein --</option>
          {stories.map((s) => (
            <option key={s.id} value={s.id}>
              [{s.dashStatus?.toUpperCase()}] {s.id} — {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* Upload Form */}
      {story && (
        <>
          <div className="upload-form panel">
            <h3 className="upload-story-name">
              {story.title}
              <span className={`badge badge-${story.dashStatus === "uploaded" ? "complete" : "draft"}`} style={{ marginLeft: "0.75rem" }}>
                {story.dashStatus?.toUpperCase()}
              </span>
            </h3>

            {/* Video Link */}
            <div className="form-group">
              <label className="form-label" htmlFor="video-link">
                🎬 Video Drive Link
              </label>
              <div className="link-input-row">
                <input
                  className="input"
                  id="video-link"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/xxxxxxx/view?usp=sharing"
                />
                {videoLink && isValidDriveLink(videoLink) && (
                  <a
                    href={videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-icon"
                    title="Drive mein dekhen"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <p className="form-hint">
                <Link size={12} /> Drive share link ya sirf File ID bhi kaam karta hai
              </p>
            </div>

            {/* Thumbnail Link */}
            <div className="form-group">
              <label className="form-label" htmlFor="thumb-link">
                🖼️ Thumbnail Drive Link
              </label>
              <div className="link-input-row">
                <input
                  className="input"
                  id="thumb-link"
                  value={thumbLink}
                  onChange={(e) => setThumbLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/xxxxxxx/view?usp=sharing"
                />
                {thumbLink && isValidDriveLink(thumbLink) && (
                  <a
                    href={thumbLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-icon"
                    title="Drive mein dekhen"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <p className="form-hint">
                <Link size={12} /> 1280×720px recommended (PNG/JPG)
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="upload-error">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {/* Save Button */}
            <div className="upload-btn-row">
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || (!videoLink && !thumbLink)}
              >
                {saving ? "Saving…" : saved ? "✅ Saved!" : "💾 Save Links"}
              </button>

              {/* Review ke liye bhejo — sirf tab jab dono links hon */}
              {(story.dashStatus === "uploaded" || bothLinked) && (
                <button
                  className="btn btn-warning"
                  onClick={handleSendToReview}
                  disabled={saving}
                >
                  <ArrowRight size={14} /> Send to Review
                </button>
              )}
            </div>
          </div>

          {/* Preview Section — agar thumb link hai */}
          {thumbLink && isValidDriveLink(thumbLink) && (
            <div className="thumb-preview panel">
              <h4 className="sb-card-title">🖼️ Thumbnail Preview</h4>
              <p className="form-hint" style={{ marginBottom: "0.5rem" }}>
                Note: Drive images directly embed nahi hoti. Link pe click karein dekhne ke liye.
              </p>
              <a
                href={thumbLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
              >
                <ExternalLink size={13} /> Thumbnail Drive mein Dekhen
              </a>
            </div>
          )}

          {/* Status Banner */}
          {isUploaded && (
            <div className="upload-complete-banner panel">
              <CheckCircle size={20} style={{ color: "var(--accent4)" }} />
              <span>
                Assets linked! Story <strong>{story.dashStatus === "review" ? "Review mein hai" : "Uploaded"}</strong>.
              </span>
            </div>
          )}
        </>
      )}

      {!story && (
        <div className="upload-placeholder panel">
          <Link size={48} style={{ color: "var(--dimmer)" }} />
          <p>Upar se story select karein phir Drive links paste karein</p>
        </div>
      )}
    </section>
  );
}
