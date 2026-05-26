// ============================================
// src/components/Upload/UploadZone.jsx
// NEW: Fake progress bar during save
// NEW: Auto send to review when both links saved
// FIX: Single API call for both links
// ============================================

import { useState, useEffect } from "react";
import { Link, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import "./UploadZone.css";

export default function UploadZone({
  story,
  stories,
  onSelectStory,
  onUpdate,
  onMoveToReview,
}) {
  const [videoLink, setVideoLink] = useState("");
  const [thumbLink, setThumbLink] = useState("");
  const [saving, setSaving]       = useState(false);
  const [progress, setProgress]   = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (story) {
      setVideoLink(story.videoLink || "");
      setThumbLink(story.thumbLink || "");
      setDone(false);
      setError("");
      setProgress(0);
      setStatusMsg("");
    }
  }, [story]);

  const handleSelectStory = (id) => {
    const found = stories.find((s) => s.id === id);
    if (found) onSelectStory(found);
  };

  const isValidLink = (link) => {
    if (!link) return false;
    return (
      link.includes("drive.google.com") ||
      link.includes("docs.google.com") ||
      /^[\w-]{25,}$/.test(link)
    );
  };

  // ---- Fake progress bar helper ----
  // Saving ke doran progress bar animate hota hai
  const runProgress = (stages) => {
    return new Promise((resolve) => {
      let i = 0;
      const run = () => {
        if (i >= stages.length) { resolve(); return; }
        const [pct, msg, delay] = stages[i];
        setProgress(pct);
        setStatusMsg(msg);
        i++;
        setTimeout(run, delay);
      };
      run();
    });
  };

  // ---- SAVE + AUTO REVIEW ----
  const handleSave = async () => {
    setError("");
    setDone(false);

    if (!story)                   { setError("Pehle story select karein"); return; }
    if (!videoLink && !thumbLink) { setError("Kam az kam ek link daalen"); return; }
    if (videoLink && !isValidLink(videoLink)) { setError("Video link valid nahi hai"); return; }
    if (thumbLink && !isValidLink(thumbLink)) { setError("Thumbnail link valid nahi hai"); return; }

    setSaving(true);
    setProgress(0);

    try {
      // Stage 1: Links validate ho rahi hain
      await runProgress([[15, "Links validate ho rahi hain…", 400]]);

      // Stage 2: Sheet mein save ho raha hai
      setProgress(30);
      setStatusMsg("Sheet mein save ho raha hai…");

      const updates = {};
      if (videoLink) updates.videoLink = videoLink;
      if (thumbLink) updates.thumbLink = thumbLink;

      const bothPresent = !!(videoLink && thumbLink);
      if (bothPresent) updates.dashStatus = "uploaded";

      // Actual API call
      await onUpdate(story.id, updates);

      // Stage 3: Sheet write confirm
      await runProgress([[70, "Sheet update hua…", 300]]);

      // Stage 4: Agar dono links hain to auto review
      if (bothPresent) {
        setProgress(85);
        setStatusMsg("Review queue mein bhej raha hoon…");
        await onMoveToReview(story.id); // ✅ Auto send to review
        await runProgress([[100, "✅ Review queue mein aa gaya!", 400]]);
      } else {
        await runProgress([[100, "✅ Links save ho gaye!", 400]]);
      }

      setDone(true);
    } catch (err) {
      console.error("Save error:", err);
      setError("Save fail: " + err.message);
      setProgress(0);
      setStatusMsg("");
    } finally {
      setSaving(false);
    }
  };

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
        Google Drive mein files upload karein.
        Phir <strong>Share → Anyone with link → Copy</strong> karke paste karein.
        Dono links save hone par story automatically Review queue mein chali jaegi.
      </p>

      {/* Guide */}
      <div className="upload-guide panel">
        <h4 className="guide-title">📋 Quick Guide</h4>
        <ol className="guide-steps">
          <li>Google Drive → <strong>New → File Upload</strong></li>
          <li>Upload ke baad right-click → <strong>Share → Anyone with link</strong></li>
          <li><strong>Copy link</strong> → yahan paste karein</li>
          <li>Dono links save karne par ✅ auto Review mein jaegi</li>
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

      {story ? (
        <>
          <div className="upload-form panel">
            <h3 className="upload-story-name">
              {story.title}
              <span
                className={`badge badge-${
                  story.dashStatus === "uploaded" ? "complete" :
                  story.dashStatus === "review"   ? "review"   : "draft"
                }`}
                style={{ marginLeft: "0.75rem" }}
              >
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
                  placeholder="https://drive.google.com/file/d/xxxxxxx/view"
                  disabled={saving}
                />
                {videoLink && isValidLink(videoLink) && (
                  <a href={videoLink} target="_blank" rel="noopener noreferrer"
                    className="btn btn-sm btn-icon" title="Drive mein dekhen">
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              {videoLink && !isValidLink(videoLink) && (
                <p className="link-warning">⚠️ Valid Drive link nahi lagti</p>
              )}
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
                  placeholder="https://drive.google.com/file/d/xxxxxxx/view"
                  disabled={saving}
                />
                {thumbLink && isValidLink(thumbLink) && (
                  <a href={thumbLink} target="_blank" rel="noopener noreferrer"
                    className="btn btn-sm btn-icon" title="Drive mein dekhen">
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <p className="form-hint">
                <Link size={12} /> 1280×720px PNG/JPG recommended
              </p>
              {thumbLink && !isValidLink(thumbLink) && (
                <p className="link-warning">⚠️ Valid Drive link nahi lagti</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="upload-error">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {/* ============================================
                PROGRESS BAR — saving ke doran dikhta hai
                ============================================ */}
            {saving && (
              <div className="upload-progress">
                <div className="upload-progress-bar">
                  <div
                    className="upload-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="upload-progress-msg">{statusMsg}</p>
              </div>
            )}

            {/* Save Button */}
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || (!videoLink && !thumbLink)}
            >
              {saving ? `Processing… ${progress}%` :
               done   ? "✅ Done!" :
               "💾 Save Links"}
            </button>

            {/* Tip */}
            {(videoLink || thumbLink) && !(videoLink && thumbLink) && !saving && (
              <p className="upload-tip">
                💡 Dono links paste karein — save hone par auto Review mein jaegi
              </p>
            )}
          </div>

          {/* Status banner */}
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