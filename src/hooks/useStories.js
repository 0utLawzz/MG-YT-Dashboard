// ============================================
// src/components/Upload/UploadZone.jsx — FIXED
// FIX 1: videoLink + thumbLink ek hi call mein save
// FIX 2: Save ke baad dashStatus bhi update hota hai
// FIX 3: "Send to Review" properly kaam karta hai
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
  const [sendingToReview, setSendingToReview] = useState(false);
  const [error, setError] = useState("");

  // Story change hone par fields populate karo
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

  // Drive link basic validation
  const isValidLink = (link) => {
    if (!link) return false;
    return (
      link.includes("drive.google.com") ||
      link.includes("docs.google.com") ||
      /^[\w-]{25,}$/.test(link)
    );
  };

  // ---- SAVE LINKS ----
  // FIX: videoLink + thumbLink dono ek hi updateStory call mein
  // Pehle alag alag call hoti thi — doosri call pehli overwrite kar deti thi
  const handleSave = async () => {
    setError("");
    setSaved(false);

    if (!story) { setError("Pehle story select karein"); return; }
    if (!videoLink && !thumbLink) { setError("Kam az kam ek link daalen"); return; }
    if (videoLink && !isValidLink(videoLink)) { setError("Video Drive link valid nahi hai"); return; }
    if (thumbLink && !isValidLink(thumbLink)) { setError("Thumbnail Drive link valid nahi hai"); return; }

    setSaving(true);
    try {
      // ✅ FIX: Ek hi object mein dono links — ek API call
      const updates = {};
      if (videoLink) updates.videoLink = videoLink;
      if (thumbLink) updates.thumbLink = thumbLink;

      // Agar dono hain to status bhi uploaded set karo
      if (videoLink && thumbLink) {
        updates.dashStatus = "uploaded";
      }

      console.log("Saving updates:", updates);
      await onUpdate(story.id, updates);

      // Agar sirf ek link hai to manually moveToUploaded nahi call karo
      // Jab dono honge tab status change hoga
      if (videoLink && thumbLink) {
        await onMoveToUploaded(story.id);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error("Save error:", err);
      setError("Save fail hua: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---- SEND TO REVIEW ----
  const handleSendToReview = async () => {
    if (!story) return;
    setSendingToReview(true);
    setError("");
    try {
      await onMoveToReview(story.id);
      setSaved(true);
    } catch (err) {
      setError("Review mein bhejne mein masla: " + err.message);
    } finally {
      setSendingToReview(false);
    }
  };

  const bothLinked = videoLink && thumbLink;
  const isUploaded = ["uploaded", "review", "approved", "scheduled", "published"]
    .includes(story?.dashStatus);

  return (
    <section
      className="upload-section animate-fade-in"
      id="panel-upload"
      role="tabpanel"
      aria-labelledby="tab-upload"
    >
      <h2 className="section-title">⬆️ Upload Assets</h2>
      <p className="section-desc">
        Google Drive mein video/thumbnail upload karein.
        <strong> Share → Anyone with link → Copy</strong> karein aur paste karein.
      </p>

      {/* Drive Guide */}
      <div className="upload-guide panel">
        <h4 className="guide-title">📋 Quick Guide</h4>
        <ol className="guide-steps">
          <li>Google Drive → <strong>New → File Upload</strong></li>
          <li>File upload hone ke baad right-click → <strong>Share</strong></li>
          <li><strong>Anyone with the link</strong> select karein</li>
          <li><strong>Copy link</strong> karein aur yahan paste karein</li>
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
      {story ? (
        <>
          <div className="upload-form panel">
            <h3 className="upload-story-name">
              {story.title}
              <span
                className={`badge badge-${
                  story.dashStatus === "uploaded" ? "complete" :
                  story.dashStatus === "review"   ? "review" :
                  "draft"
                }`}
                style={{ marginLeft: "0.75rem" }}
              >
                {story.dashStatus?.toUpperCase()}
              </span>
            </h3>

            {/* Video Link Input */}
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
                  placeholder="https://drive.google.com/file/d/xxxxxxx/view"
                />
                {videoLink && isValidLink(videoLink) && (
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
              {videoLink && !isValidLink(videoLink) && (
                <p className="link-warning">⚠️ Yeh valid Drive link nahi lagti</p>
              )}
            </div>

            {/* Thumbnail Link Input */}
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
                  placeholder="https://drive.google.com/file/d/xxxxxxx/view"
                />
                {thumbLink && isValidLink(thumbLink) && (
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
                <Link size={12} /> 1280×720px PNG/JPG recommended
              </p>
              {thumbLink && !isValidLink(thumbLink) && (
                <p className="link-warning">⚠️ Yeh valid Drive link nahi lagti</p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="upload-error">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="upload-btn-row">
              {/* Save Links */}
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || (!videoLink && !thumbLink)}
              >
                {saving ? "Saving…" : saved ? "✅ Saved!" : "💾 Save Links"}
              </button>

              {/* Send to Review — sirf tab show ho jab uploaded ya dono links hon */}
              {(story.dashStatus === "uploaded" || (bothLinked && saved)) && (
                <button
                  className="btn btn-warning"
                  onClick={handleSendToReview}
                  disabled={sendingToReview}
                >
                  <ArrowRight size={14} />
                  {sendingToReview ? "Bhej raha hoon…" : "📤 Send to Review"}
                </button>
              )}
            </div>

            {/* Both links tip */}
            {(videoLink || thumbLink) && !bothLinked && (
              <p className="upload-tip">
                💡 Tip: Dono links save karne se status automatically "Uploaded" ho jaata hai.
              </p>
            )}
          </div>

          {/* Completion Banner */}
          {isUploaded && (
            <div className="upload-complete-banner panel">
              <CheckCircle size={20} style={{ color: "var(--accent4)" }} />
              <span>
                Assets linked! Status:{" "}
                <strong style={{ color: "var(--accent4)" }}>
                  {story.dashStatus?.toUpperCase()}
                </strong>
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="upload-placeholder panel">
          <Link size={48} style={{ color: "var(--dimmer)" }} />
          <p>Upar se story select karein phir Drive links paste karein</p>
        </div>
      )}
    </section>
  );
}