import { useState, useRef } from 'react';
import { Upload, Film, Image, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './UploadZone.css';

export default function UploadZone() {
  const [dragOver, setDragOver] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [thumbProgress, setThumbProgress] = useState(0);
  const videoRef = useRef(null);
  const thumbRef = useRef(null);

  const uploadFile = async (file, type) => {
    const setProgress = type === 'video' ? setVideoProgress : setThumbProgress;
    setProgress(1);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    const { data, error } = await supabase.storage
      .from('story-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      setProgress(0);
      return;
    }

    setProgress(100);
    console.log('Uploaded:', data.path);
    // You could also get the public URL here:
    // const { data: { publicUrl } } = supabase.storage.from('story-assets').getPublicUrl(filePath);
  };

  const handleDrop = (type) => (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file) return;

    if (type === 'video') {
      setVideoFile(file);
      uploadFile(file, 'video');
    } else {
      setThumbFile(file);
      uploadFile(file, 'thumb');
    }
  };


  return (
    <section className="upload-section animate-fade-in" id="panel-upload" role="tabpanel" aria-labelledby="tab-upload">
      <h2 className="section-title">Upload Assets</h2>
      <p className="section-desc">Drag & drop or click to upload video files and thumbnails for your stories.</p>

      <div className="upload-grid">
        {/* Video Upload */}
        <div
          className={`upload-zone panel ${dragOver ? 'drag-over' : ''} ${videoFile ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
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
            {videoFile ? <CheckCircle size={40} className="upload-done-icon" /> : <Film size={40} />}
          </div>
          <h3 className="upload-label">
            {videoFile ? videoFile.name : 'Drop Video Here'}
          </h3>
          <p className="upload-hint">
            {videoFile ? `${(videoFile.size / 1024 / 1024).toFixed(1)} MB` : 'MP4, MOV, WEBM • Max 2GB'}
          </p>
          {videoProgress > 0 && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${videoProgress}%` }}>
                <span className="progress-text">{videoProgress}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail Upload */}
        <div
          className={`upload-zone panel ${thumbFile ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); }}
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
            {thumbFile ? <CheckCircle size={40} className="upload-done-icon" /> : <Image size={40} />}
          </div>
          <h3 className="upload-label">
            {thumbFile ? thumbFile.name : 'Drop Thumbnail Here'}
          </h3>
          <p className="upload-hint">
            {thumbFile ? `${(thumbFile.size / 1024 / 1024).toFixed(1)} MB` : 'PNG, JPG, WEBP • 1280×720 recommended'}
          </p>
          {thumbProgress > 0 && (
            <div className="progress-bar">
              <div className="progress-fill thumb-fill" style={{ width: `${thumbProgress}%` }}>
                <span className="progress-text">{thumbProgress}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
