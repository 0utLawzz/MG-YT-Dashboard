import { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, User, Hash, Tag, ChevronDown, ExternalLink, Upload, Loader2, FolderOpen } from "lucide-react";
import { uploadToDrive, setDriveFilePermissions } from "../../services/upload/driveUpload";
import { useAuth } from "../../context/AuthContext";
import { ENV } from "../../lib/config/env";
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

// Debounce helper
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

/**
 * Opens Google Drive Picker and resolves with a share URL string,
 * or null if the user cancels.
 */
function openDrivePicker({ accessToken, apiKey, mimeTypes = [] }) {
  return new Promise((resolve) => {
    if (!window.gapi?.load) {
      alert("Google API not loaded yet. Please wait a moment and try again.");
      resolve(null);
      return;
    }

    window.gapi.load("picker", () => {
      const google = window.google;
      if (!google?.picker) {
        alert("Google Picker API failed to load.");
        resolve(null);
        return;
      }

      const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false);

      if (mimeTypes.length > 0) {
        view.setMimeTypes(mimeTypes.join(","));
      }

      const picker = new google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey || "")
        .setCallback((data) => {
          if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
            const doc = data[google.picker.Response.DOCUMENTS][0];
            const fileId = doc[google.picker.Document.ID];
            const shareUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
            resolve(shareUrl);
          } else if (
            data[google.picker.Response.ACTION] === google.picker.Action.CANCEL
          ) {
            resolve(null);
          }
        })
        .build();

      picker.setVisible(true);
    });
  });
}

export default function Storyboard({
  story,
  stories,
  onSelectStory,
  onEdit,
  onMoveToReview,
}) {
  const { accessToken } = useAuth();
  const [notes, setNotes] = useState(story?.reviewNotes || "");
  const [videoLink, setVideoLink] = useState(story?.videoLink || "");
  const [thumbLink, setThumbLink] = useState(story?.thumbLink || "");

  const [saving, setSaving] = useState(false);
  const [savedAssets, setSavedAssets] = useState(false);
  const [uploading, setUploading] = useState({ video: false, thumb: false });
  const [uploadProgress, setUploadProgress] = useState({ video: 0, thumb: 0 });
  const [uploadError, setUploadError] = useState(null);
  const [pickingDrive, setPickingDrive] = useState({ video: false, thumb: false });
  // Checkbox: whether local file select should upload to Drive
  const [uploadToDriveEnabled, setUploadToDriveEnabled] = useState(true);

  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  // Sync state when story changes
  useEffect(() => {
    if (story) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setNotes(story.reviewNotes || "");
      setVideoLink(story.videoLink || "");
      setThumbLink(story.thumbLink || "");
      setSavedAssets(false);
      setUploadError(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [story]);

  // Only show stories that have been pushed to storyboard
  const storyboardStories = stories.filter(s => s.dashStatus === "storyboard");

  const handleSelect = useCallback((id) => {
    const found = storyboardStories.find((s) => s.id === id);
    if (found) {
      onSelectStory(found);
    }
  }, [storyboardStories, onSelectStory]);

  const handleSaveNotes = useDebounce(async (notesText, storyId) => {
    if (!storyId) return;
    setSaving(true);
    try {
      await onEdit(storyId, { reviewNotes: notesText });
    } catch (err) {
      console.error('Failed to save notes:', err);
      alert('Failed to save notes: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, 300);

  const isValidLink = (link) => {
    if (!link) return false;
    return link.includes("drive.google.com") || link.includes("docs.google.com") || /^[\w-]{25,}$/.test(link);
  };

  const handleFileUpload = async (type, file) => {
    if (!file) return;

    // If "Upload to Drive" is disabled, do nothing on file select
    if (!uploadToDriveEnabled) {
      alert('"Upload to Drive" is disabled. Enable the checkbox to upload.');
      return;
    }

    if (!accessToken) {
      alert('Please connect your Google account first');
      return;
    }

    if (uploading[type]) {
      alert('Upload already in progress');
      return;
    }

    setUploadError(null);
    setUploading(prev => ({ ...prev, [type]: true }));
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    try {
      // 1. Upload file to Drive
      const result = await uploadToDrive(file, accessToken, (pct) => {
        setUploadProgress(prev => ({ ...prev, [type]: pct }));
      });

      // 2. Set permissions so it's accessible
      const permResult = await setDriveFilePermissions(result.fileId, accessToken);
      if (!permResult) {
        throw new Error('Failed to set file permissions - file may not be accessible');
      }

      // 3. Update local state
      const shareLink = result.shareLink;
      if (type === 'video') {
        setVideoLink(shareLink);
      } else {
        setThumbLink(shareLink);
      }

      // 4. Immediately write URL to sheet — do NOT change status
      if (story?.id) {
        const updates = type === 'video'
          ? { videoLink: shareLink }
          : { thumbLink: shareLink };
        await onEdit(story.id, updates);
      }

      setSavedAssets(true);
      setTimeout(() => setSavedAssets(false), 2000);
    } catch (err) {
      console.error('[Storyboard] Upload failed:', err);
      setUploadError(`${type} upload failed: ${err.message}`);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
    }
  };

  const handlePickFromDrive = async (type) => {
    if (!accessToken) {
      alert('Please sign in with Google first to use the Drive Picker.');
      return;
    }

    setPickingDrive(prev => ({ ...prev, [type]: true }));
    try {
      const mimeTypes = type === 'video'
        ? ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/*']
        : ['image/jpeg', 'image/png', 'image/webp', 'image/*'];

      const apiKey = ENV.GOOGLE_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || '';
      const shareUrl = await openDrivePicker({ accessToken, apiKey, mimeTypes });

      if (shareUrl) {
        // Update local state
        if (type === 'video') {
          setVideoLink(shareUrl);
        } else {
          setThumbLink(shareUrl);
        }

        // Immediately write URL to sheet — do NOT change status
        if (story?.id) {
          const updates = type === 'video'
            ? { videoLink: shareUrl }
            : { thumbLink: shareUrl };
          await onEdit(story.id, updates);
          setSavedAssets(true);
          setTimeout(() => setSavedAssets(false), 2000);
        }
      }
    } catch (err) {
      console.error('[Storyboard] Drive picker error:', err);
      alert('Drive picker failed: ' + err.message);
    } finally {
      setPickingDrive(prev => ({ ...prev, [type]: false }));
    }
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

      // Save the links
      await onEdit(story.id, updates);

      // If both links are provided, move the story to Review automatically
      if (videoLink && thumbLink && onMoveToReview) {
        await onMoveToReview(story.id);
      }

      setSavedAssets(true);
      setTimeout(() => setSavedAssets(false), 2000);
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
               onChange={(e) => {
                 setNotes(e.target.value);
                 if (story) {
                   handleSaveNotes(e.target.value, story.id);
                 }
               }}
               placeholder="Director / Voice-over notes..."
               rows={3}
             />
          </div>

          {/* ASSET UPLOADING EMBED */}
          <div className="sb-notes panel" style={{ border: "1px solid var(--accent2)" }}>
            <h4 className="sb-card-title" style={{ color: "var(--accent2)" }}>🎬 Attach Drive Assets</h4>
            <p className="section-desc" style={{marginBottom: "0.75rem"}}>
              Paste Google Drive URLs, pick directly from Drive, or upload a local file. URLs are saved to the sheet immediately — status is not changed.
            </p>
            {/* Upload to Drive toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={uploadToDriveEnabled}
                onChange={e => setUploadToDriveEnabled(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>📤 Upload to Drive on file select</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--dimmer)' }}>
                (uncheck to skip Drive upload — just paste/pick a URL)
              </span>
            </label>

            {/* Video Link */}
            <div className="form-group">
                <label className="form-label" htmlFor="video-link">Video Drive Link</label>
                <div className="link-input-row" style={{display: "flex", gap: "0.5rem", alignItems: "center"}}>
                  <input
                    className="input"
                    id="video-link"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    disabled={saving || uploading.video}
                  />
                  {/* Pick from Drive */}
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handlePickFromDrive('video')}
                    disabled={pickingDrive.video || uploading.video || saving}
                    title="Pick video from Google Drive"
                    style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    {pickingDrive.video ? <Loader2 size={14} className="spin" /> : <FolderOpen size={14} />}
                    Drive
                  </button>
                  {/* Local Upload */}
                  <input
                    type="file"
                    accept="video/*"
                    ref={videoInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload('video', e.target.files[0])}
                  />
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploading.video || saving}
                    title="Upload local video to Drive"
                  >
                    {uploading.video ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                  </button>
                  {videoLink && isValidLink(videoLink) && (
                    <a href={videoLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-icon"><ExternalLink size={14} /></a>
                  )}
                </div>
                {uploading.video && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--accent3)' }}>
                    Uploading: {uploadProgress.video}%
                  </div>
                )}
            </div>

            {/* Thumbnail Link */}
            <div className="form-group" style={{marginTop: "1rem"}}>
                <label className="form-label" htmlFor="thumb-link">Thumbnail Drive Link (1280x720)</label>
                <div className="link-input-row" style={{display: "flex", gap: "0.5rem", alignItems: "center"}}>
                  <input
                    className="input"
                    id="thumb-link"
                    value={thumbLink}
                    onChange={(e) => setThumbLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    disabled={saving || uploading.thumb}
                  />
                  {/* Pick from Drive */}
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handlePickFromDrive('thumb')}
                    disabled={pickingDrive.thumb || uploading.thumb || saving}
                    title="Pick thumbnail from Google Drive"
                    style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    {pickingDrive.thumb ? <Loader2 size={14} className="spin" /> : <FolderOpen size={14} />}
                    Drive
                  </button>
                  {/* Local Upload */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={thumbInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload('thumb', e.target.files[0])}
                  />
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={uploading.thumb || saving}
                    title="Upload local image to Drive"
                  >
                    {uploading.thumb ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                  </button>
                  {thumbLink && isValidLink(thumbLink) && (
                    <a href={thumbLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-icon"><ExternalLink size={14} /></a>
                  )}
                </div>
                {uploading.thumb && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--accent3)' }}>
                    Uploading: {uploadProgress.thumb}%
                  </div>
                )}
            </div>

            {uploadError && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(255,23,68,0.1)', border: '1px solid var(--accent)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--accent)' }}>
                ⚠️ {uploadError}
              </div>
            )}

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
