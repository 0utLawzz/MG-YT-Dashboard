import { useState, useRef } from 'react';
import { Upload, Film, Image, CheckCircle, ChevronDown, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './UploadZone.css';

export default function UploadZone({ stories, onStoryUpdate }) {
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [dragOverType, setDragOverType] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [thumbProgress, setThumbProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);
  const videoRef = useRef(null);
  const thumbRef = useRef(null);

  const draftStories = (stories || []).filter(s => s.status === 'draft');
  const selectedStory = stories?.find(s => String(s.id) === String(selectedStoryId));

  const uploadFile = async (file, type) => {
    const setProgress = type === 'video' ? setVideoProgress : setThumbProgress;
    setProgress(5);

    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedStoryId}_${type}_${Date.now()}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    // Simulate progress since supabase-js doesn't expose progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 85));
    }, 400);

    const { data, error } = await supabase.storage
      .from('story-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    clearInterval(progressInterval);

    if (error) {
      console.error('Upload error:', error);
      setProgress(0);
      return null;
    }

    setProgress(100);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('story-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleDrop = (type) => (e) => {
    e.preventDefault();
    setDragOverType(null);
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file || !selectedStoryId) return;

    if (type === 'video') {
      setVideoFile(file);
      uploadFile(file, 'video').then(url => {
        if (url) {
          setVideoUrl(url);
          // Update story with video URL
          onStoryUpdate?.(Number(selectedStoryId), { videoUrl: url });
          // Check if both uploads are done
          if (thumbUrl || thumbFile) {
            autoMarkComplete(url, thumbUrl);
          }
        }
      });
    } else {
      setThumbFile(file);
      uploadFile(file, 'thumb').then(url => {
        if (url) {
          setThumbUrl(url);
          // Update story with thumbnail URL
          onStoryUpdate?.(Number(selectedStoryId), { thumbnail: url });
          // Check if both uploads are done
          if (videoUrl || videoFile) {
            autoMarkComplete(videoUrl, url);
          }
        }
      });
    }
  };

  const autoMarkComplete = (vUrl, tUrl) => {
    if (vUrl && tUrl && selectedStoryId) {
      // Both files uploaded — mark story as complete (held for review)
      onStoryUpdate?.(Number(selectedStoryId), { status: 'complete' });
    }
  };

  const handleStorySelect = (id) => {
    setSelectedStoryId(id);
    // Reset uploads when story changes
    setVideoFile(null);
    setThumbFile(null);
    setVideoProgress(0);
    setThumbProgress(0);
    setVideoUrl(null);
    setThumbUrl(null);

    // Pre-populate if story already has uploads
    const story = stories?.find(s => String(s.id) === String(id));
    if (story?.videoUrl) setVideoUrl(story.videoUrl);
    if (story?.thumbnail) setThumbUrl(story.thumbnail);
  };

  const bothUploaded = (videoFile || videoUrl) && (thumbFile || thumbUrl);

  return (
    <section className="upload-section animate-fade-in" id="panel-upload" role="tabpanel" aria-labelledby="tab-upload">
      <h2 className="section-title">Upload Assets</h2>
      <p className="section-desc">Select a story, then upload its video and thumbnail. When both are uploaded, the story is automatically marked as <strong>Complete</strong> and held for review.</p>

      {/* Story Selector */}
      <div className="upload-story-selector panel">
        <div className="form-group">
          <label className="form-label" htmlFor="upload-story-select">
            <ChevronDown size={14} /> Select Story to Upload For
          </label>
          <select
            className="input"
            id="upload-story-select"
            value={selectedStoryId}
            onChange={e => handleStorySelect(e.target.value)}
          >
            <option value="">Choose a draft story…</option>
            {draftStories.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} — {s.category || 'No Category'}
              </option>
            ))}
          </select>
          {draftStories.length === 0 && (
            <p className="form-hint warning">
              <AlertTriangle size={13} /> No draft stories available. Add a story first.
            </p>
          )}
        </div>

        {selectedStory && (
          <div className="upload-story-info">
            <span className="badge badge-draft">DRAFT</span>
            <span className="upload-story-title">{selectedStory.title}</span>
            {selectedStory.category && <span className="upload-story-cat">📁 {selectedStory.category}</span>}
          </div>
        )}
      </div>

      {/* Upload Zones */}
      {selectedStoryId ? (
        <div className="upload-grid">
          {/* Video Upload */}
          <div
            className={`upload-zone panel ${dragOverType === 'video' ? 'drag-over' : ''} ${videoFile || videoUrl ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverType('video'); }}
            onDragLeave={() => setDragOverType(null)}
            onDrop={handleDrop('video')}
            onClick={() => videoRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload video file"
            id="upload-video-zone"
          >
            <input
              ref={videoRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleDrop('video')}
            />
            <div className="upload-icon-wrap">
              {videoFile || videoUrl ? <CheckCircle size={40} className="upload-done-icon" /> : <Film size={40} />}
            </div>
            <h3 className="upload-label">
              {videoFile ? videoFile.name : videoUrl ? '✓ Video Attached' : 'Drop Video Here'}
            </h3>
            <p className="upload-hint">
              {videoFile ? `${(videoFile.size / 1024 / 1024).toFixed(1)} MB` : 'MP4, MOV, WEBM • Max 2GB'}
            </p>
            {videoProgress > 0 && videoProgress < 100 && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${videoProgress}%` }}>
                  <span className="progress-text">{Math.round(videoProgress)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div
            className={`upload-zone panel ${dragOverType === 'thumb' ? 'drag-over' : ''} ${thumbFile || thumbUrl ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverType('thumb'); }}
            onDragLeave={() => setDragOverType(null)}
            onDrop={handleDrop('thumb')}
            onClick={() => thumbRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload thumbnail"
            id="upload-thumb-zone"
          >
            <input
              ref={thumbRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleDrop('thumb')}
            />
            <div className="upload-icon-wrap thumb">
              {thumbFile || thumbUrl ? <CheckCircle size={40} className="upload-done-icon" /> : <Image size={40} />}
            </div>
            <h3 className="upload-label">
              {thumbFile ? thumbFile.name : thumbUrl ? '✓ Thumbnail Attached' : 'Drop Thumbnail Here'}
            </h3>
            <p className="upload-hint">
              {thumbFile ? `${(thumbFile.size / 1024 / 1024).toFixed(1)} MB` : 'PNG, JPG, WEBP • 1280×720 recommended'}
            </p>
            {thumbProgress > 0 && thumbProgress < 100 && (
              <div className="progress-bar">
                <div className="progress-fill thumb-fill" style={{ width: `${thumbProgress}%` }}>
                  <span className="progress-text">{Math.round(thumbProgress)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="upload-placeholder panel">
          <Upload size={48} style={{ color: 'var(--dimmer)' }} />
          <p>Select a story above to start uploading assets</p>
        </div>
      )}

      {/* Completion Status */}
      {selectedStoryId && bothUploaded && (
        <div className="upload-complete-banner panel">
          <CheckCircle size={20} className="upload-done-icon" />
          <span>Both files uploaded! Story has been marked as <strong>Complete</strong> and is now held for review.</span>
        </div>
      )}
    </section>
  );
}
