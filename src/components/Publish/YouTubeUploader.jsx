import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { postToYouTube } from '../../lib/api.js';
import { ResumableUpload } from '../../services/upload/resumableUpload.js';

/**
 * YouTubeUploader – handles resumable upload of a video file to YouTube.
 * Props:
 *   metadata: { title, description, tags, categoryId, privacyStatus, thumbnailBlob }
 *   videoFile: File object
 *   onComplete: (ytLink: string) => void
 *   onError: (error: Error) => void
 */
export default function YouTubeUploader({ metadata, videoFile, onComplete, onError }) {
  const { accessToken } = useAuth();
  const [progress, setProgress] = useState(0); // 0‑100
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error | cancelled
  const [errorMsg, setErrorMsg] = useState('');
  const abortControllerRef = useRef(null);

  const startUpload = useCallback(() => {
    if (!accessToken) {
      setErrorMsg('User not authenticated');
      setStatus('error');
      return;
    }
    
    setStatus('uploading');
    setProgress(0);
    setErrorMsg('');

    const uploader = new ResumableUpload({
      accessToken,
      file: videoFile,
      metadata: {
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags || [],
          categoryId: metadata.categoryId || '22'
        },
        status: {
          privacyStatus: metadata.privacyStatus || 'private'
        }
      },
      onProgress: (pct) => setProgress(pct),
      onComplete: (ytLink) => {
        setStatus('success');
        onComplete && onComplete(ytLink);
      },
      onError: (err) => {
        if (err.name !== 'AbortError') {
          setErrorMsg(err.message);
          setStatus('error');
          onError && onError(err);
        }
      }
    });

    abortControllerRef.current = uploader;
    uploader.start().catch((err) => {
      // caught by onError callback already
    });
  }, [accessToken, videoFile, metadata, onComplete, onError]);

  const cancelUpload = () => {
    abortControllerRef.current?.abort();
    setStatus('cancelled');
  };

  const retryUpload = () => {
    setProgress(0);
    setErrorMsg('');
    startUpload();
  };

  useEffect(() => {
    // Auto‑start when component mounts with required props
    if (videoFile && accessToken) {
      startUpload();
    }
  }, [videoFile, accessToken, startUpload]);

  return (
    <div className="youtube-uploader">
      {status === 'uploading' && (
        <div className="upload-progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <p>Uploading… {progress}%</p>
          <button className="btn btn-sm" onClick={cancelUpload}>
            <X size={14} /> Cancel
          </button>
        </div>
      )}
      {status === 'success' && (
        <div className="upload-success">
          <CheckCircle size={24} className="text-success" /> Upload complete!
        </div>
      )}
      {status === 'error' && (
        <div className="upload-error">
          <AlertCircle size={24} className="text-error" /> {errorMsg}
          <button className="btn btn-sm" onClick={retryUpload}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}
      {status === 'cancelled' && (
        <div className="upload-cancelled">
          <AlertCircle size={24} className="text-warning" /> Upload cancelled.
        </div>
      )}
    </div>
  );
}
