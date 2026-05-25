// ============================================
// src/components/Upload/UploadZone.jsx
// Google Drive file upload + link paste support
// Video + Thumbnail upload directly to Drive
// ============================================

import { useState, useEffect, useRef } from "react";
import { Link, CheckCircle, AlertTriangle, ExternalLink, ArrowRight, Upload, Cloud, Lock, Unlock } from "lucide-react";
import {
  isDriveAuthenticated,
  authenticateWithDrive,
  uploadToDrive,
  getDriveShareableLink,
  loadGoogleScript,
} from "../../lib/drive";
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
  const [uploadMode, setUploadMode] = useState("file"); // "file" or "link"
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ video: 0, thumb: 0 });
  const [authLoading, setAuthLoading] = useState(false);
  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  // Load Google script on mount
  useEffect(() => {
    loadGoogleScript().catch(console.error);
  }, []);

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

  // Drive link validate karo
  const isValidDriveLink = (link) => {
    if (!link) return false;
    return (
      link.includes("drive.google.com") ||
      link.includes("docs.google.com") ||
      /^[\w-]{25,}$/.test(link)
    );
  };

  // Google OAuth handle karo
  const handleAuth = async () => {
    setAuthLoading(true);
    try {
      await authenticateWithDrive();
    } catch (err) {
      setError("Google Drive authentication failed: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // File upload to Drive
  const handleFileUpload = async (file, type) => {
    if (!file) return;

    const setProgress = type === "video" ? (p) => setUploadProgress((prev) => ({ ...prev, video: p })) : (p) => setUploadProgress((prev) => ({ ...prev, thumb: p }));

    try {
      setProgress(10);
      const result = await uploadToDrive(file);
      setProgress(80);

      // Get shareable link
      const shareableLink = await getDriveShareableLink(result.id);
      setProgress(100);

      if (type === "video") {
        setVideoLink(shareableLink);
      } else {
        setThumbLink(shareableLink);
      }

      // Auto-save after upload
      await handleSave();

      setTimeout(() => setProgress((prev) => ({ ...prev, [type]: 0 })), 2000);
    } catch (err) {
      setError(`${type} upload failed: ` + err.message);
      setProgress(0);
    }
  };

  // File drop handler
  const handleDrop = (e, type) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (type === "video" && !file.type.startsWith("video/")) {
        setError("Please select a video file");
        return;
      }
      if (type === "thumb" && !file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (type === "video") setVideoFile(file);
      if (type === "thumb") setThumbFile(file);
      handleFileUpload(file, type);
    }
  };

  // File input handler
  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "video") setVideoFile(file);
      if (type === "thumb") setThumbFile(file);
      handleFileUpload(file, type);
    }
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
      await onUpdate(story.id, {
        videoLink: videoLink,
        thumbLink: thumbLink,
      });

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

  // Review ke liye bhejo
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
  const isAuthenticated = isDriveAuthenticated();

  return (
    <section
      className="upload-section animate-fade-in"
      id="panel-upload"
      role="tabpanel"
      aria-labelledby="tab-upload"
    >
      <h2 className="section-title">⬆️ Upload Assets</h2>
      <p className="section-desc">
        Google Drive mein directly upload karein ya Drive links paste karein.
      </p>

      {/* Auth Section */}
      <div className="drive-auth panel">
        <div className="auth-header">
          <Cloud size={24} style={{ color: isAuthenticated ? "var(--accent4)" : "var(--dimmer)" }} />
          <div>
            <h3>Google Drive Connection</h3>
            <p className="auth-status">
              {isAuthenticated ? (
                <>
                  <Unlock size={14} style={{ color: "var(--accent4)" }} /> Connected
                </>
              ) : (
                <>
                  <Lock size={14} style={{ color: "var(--accent)" }} /> Not connected
                </>
              )}
            </p>
          </div>
        </div>
        {!isAuthenticated && (
          <button
            className="btn btn-primary"
            onClick={handleAuth}
            disabled={authLoading}
          >
            {authLoading ? "Connecting…" : <><Cloud size={16} /> Connect Google Drive</>}
          </button>
        )}
      </div>

      {/* Upload Mode Toggle */}
      <div className="upload-mode-toggle">
        <button
          className={`btn btn-sm ${uploadMode === "file" ? "btn-primary" : ""}`}
          onClick={() => setUploadMode("file")}
        >
          <Upload size={14} /> File Upload
        </button>
        <button
          className={`btn btn-sm ${uploadMode === "link" ? "btn-primary" : ""}`}
          onClick={() => setUploadMode("link")}
        >
          <Link size={14} /> Paste Link
        </button>
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
      {story && isAuthenticated && uploadMode === "file" && (
        <>
          <div className="upload-form panel">
            <h3 className="upload-story-name">
              {story.title}
              <span className={`badge badge-${story.dashStatus === "uploaded" ? "complete" : "draft"}`} style={{ marginLeft: "0.75rem" }}>
                {story.dashStatus?.toUpperCase()}
              </span>
            </h3>

            {/* Video Upload Zone */}
            <div
              className={`upload-zone panel ${videoFile || videoLink ? "has-file" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "video")}
              onClick={() => videoInputRef.current?.click()}
            >
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e, "video")}
              />
              <div className="upload-icon-wrap">
                {videoLink ? <CheckCircle size={40} style={{ color: "var(--accent4)" }} /> : <Upload size={40} />}
              </div>
              <h3 className="upload-label">
                {videoLink ? "✓ Video Uploaded" : "Drop Video Here"}
              </h3>
              <p className="upload-hint">
                {videoFile ? videoFile.name : "MP4, MOV, WEBM • Max 2GB"}
              </p>
              {uploadProgress.video > 0 && uploadProgress.video < 100 && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress.video}%` }}>
                    <span className="progress-text">{Math.round(uploadProgress.video)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Upload Zone */}
            <div
              className={`upload-zone panel ${thumbFile || thumbLink ? "has-file" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "thumb")}
              onClick={() => thumbInputRef.current?.click()}
            >
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e, "thumb")}
              />
              <div className="upload-icon-wrap thumb">
                {thumbLink ? <CheckCircle size={40} style={{ color: "var(--accent4)" }} /> : <Upload size={40} />}
              </div>
              <h3 className="upload-label">
                {thumbLink ? "✓ Thumbnail Uploaded" : "Drop Thumbnail Here"}
              </h3>
              <p className="upload-hint">
                {thumbFile ? thumbFile.name : "PNG, JPG, WEBP • 1280×720 recommended"}
              </p>
              {uploadProgress.thumb > 0 && uploadProgress.thumb < 100 && (
                <div className="progress-bar">
                  <div className="progress-fill thumb-fill" style={{ width: `${uploadProgress.thumb}%` }}>
                    <span className="progress-text">{Math.round(uploadProgress.thumb)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="upload-error">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {/* Status Banner */}
            {isUploaded && (
              <div className="upload-complete-banner panel">
                <CheckCircle size={20} style={{ color: "var(--accent4)" }} />
                <span>
                  Assets uploaded! Story <strong>{story.dashStatus === "review" ? "Review mein hai" : "Uploaded"}</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Send to Review */}
          {bothLinked && (
            <button
              className="btn btn-warning"
              onClick={handleSendToReview}
              disabled={saving}
            >
              <ArrowRight size={14} /> Send to Review
            </button>
          )}
        </>
      )}

      {/* Link Paste Mode */}
      {story && uploadMode === "link" && (
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

              {/* Review ke liye bhejo */}
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
          <Upload size={48} style={{ color: "var(--dimmer)" }} />
          <p>Upar se story select karein</p>
        </div>
      )}
    </section>
  );
}
