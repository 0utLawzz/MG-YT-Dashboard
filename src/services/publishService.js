// ============================================
// src/services/publishService.js
// CORE PUBLISH ENGINE — v5 FINAL
//
// Dev (localhost): Vite proxy use karta hai → CORS fix
// Prod (GitHub Pages): Direct googleapis.com → CORS
//   already allowed kyunki deployed domain trusted hai
// ============================================

import { updateStory } from '../lib/api';
import { ENV } from '../lib/config/env';

// ============================================
// DEV ya PROD detect karo
// Localhost pe proxy use karo, production mein direct
// ============================================
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// ============================================
// API URLs — Dev mein proxy, Prod mein direct
// ============================================
const DRIVE_BASE = IS_DEV
  ? '/drive-proxy/drive/v3'                  // → Vite proxy → googleapis.com/drive/v3
  : 'https://www.googleapis.com/drive/v3';

const YT_UPLOAD_BASE = IS_DEV
  ? '/yt-upload-proxy/upload/youtube/v3'     // → Vite proxy → googleapis.com/upload/youtube/v3
  : 'https://www.googleapis.com/upload/youtube/v3';

const YT_API_BASE = IS_DEV
  ? '/yt-api-proxy/youtube/v3'               // → Vite proxy → googleapis.com/youtube/v3
  : 'https://www.googleapis.com/youtube/v3';

// ============================================
// HELPER: Drive URL se File ID nikalo
// ============================================
function extractDriveFileId(driveUrl) {
  if (!driveUrl) return null;
  const match = driveUrl.match(/\/d\/([\w-]+)/);
  return match ? match[1] : null;
}

// ============================================
// STEP 1: Drive se Video Blob download karo
// Dev: /drive-proxy/FILEID?alt=media (Vite proxy handles CORS)
// Prod: googleapis.com/drive/v3/files/FILEID?alt=media
// ============================================
async function downloadDriveBlob(driveUrl, accessToken) {
  const fileId = extractDriveFileId(driveUrl);
  if (!fileId) throw new Error('Drive URL se file ID nahi mila: ' + driveUrl);

  const downloadUrl = `${DRIVE_BASE}/${fileId}?alt=media&supportsAllDrives=true`;

  console.log('[PublishService] Downloading Drive file:', fileId);
  console.log('[PublishService] URL:', downloadUrl);

  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    redirect: 'follow',
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `Drive download failed (${res.status}). ` +
      `File "Anyone with link" pe share karo. ` +
      errText.substring(0, 150)
    );
  }

  const blob = await res.blob();

  if (blob.size < 1000) {
    throw new Error(
      `Drive file mili lekin empty hai (${blob.size} bytes). ` +
      `File permission check karo.`
    );
  }

  console.log('[PublishService] Drive downloaded, size:', blob.size, 'bytes');
  return { blob, fileId };
}

// ============================================
// STEP 2: Thumbnail Blob (optional)
// ============================================
async function downloadThumbnailBlob(thumbUrl, accessToken) {
  const fileId = extractDriveFileId(thumbUrl);
  if (!fileId) return null;

  try {
    const url = `${DRIVE_BASE}/${fileId}?alt=media&supportsAllDrives=true`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return blob.size > 500 ? blob : null;
  } catch (err) {
    console.warn('[PublishService] Thumbnail error (non-fatal):', err.message);
    return null;
  }
}

// ============================================
// STEP 3: YouTube Resumable Upload
// ============================================
async function youtubeResumableUpload(accessToken, videoBlob, metadata, onProgress) {
  const initRes = await fetch(
    `${YT_UPLOAD_BASE}/videos?uploadType=resumable&part=snippet,status`,
    {
      method: 'POST',
      headers: {
        Authorization:             `Bearer ${accessToken}`,
        'Content-Type':            'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(videoBlob.size),
        'X-Upload-Content-Type':   videoBlob.type || 'video/mp4',
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`YouTube upload init failed (${initRes.status}): ${err.substring(0, 300)}`);
  }

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) throw new Error('YouTube ne upload URL nahi diya');

  console.log('[PublishService] YouTube session started');

  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  let offset = 0;

  while (offset < videoBlob.size) {
    const end   = Math.min(offset + chunkSize, videoBlob.size);
    const chunk = videoBlob.slice(offset, end);

    const chunkRes = await fetch(uploadUrl, {
      method:  'PUT',
      headers: {
        'Content-Range': `bytes ${offset}-${end - 1}/${videoBlob.size}`,
        'Content-Type':  videoBlob.type || 'video/mp4',
      },
      body: chunk,
    });

    if (chunkRes.status === 308) {
      const range = chunkRes.headers.get('Range');
      offset = range ? parseInt(range.split('-')[1], 10) + 1 : end;
      const pct = Math.round((offset / videoBlob.size) * 100);
      if (onProgress) onProgress(pct);
      console.log(`[PublishService] Upload: ${pct}%`);

    } else if (chunkRes.ok) {
      const data = await chunkRes.json();
      console.log('[PublishService] Upload done! ID:', data.id);
      return data.id;

    } else {
      const err = await chunkRes.text();
      throw new Error(`Chunk failed (${chunkRes.status}): ${err.substring(0, 200)}`);
    }
  }

  throw new Error('Upload loop ended without completion');
}

// ============================================
// STEP 4: Thumbnail Upload
// ============================================
async function uploadYouTubeThumbnail(accessToken, videoId, thumbnailBlob) {
  if (!thumbnailBlob) return;

  const res = await fetch(
    `${YT_UPLOAD_BASE}/thumbnails/set?videoId=${videoId}&uploadType=media`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': thumbnailBlob.type || 'image/jpeg',
      },
      body: thumbnailBlob,
    }
  );

  if (!res.ok) console.warn('[PublishService] Thumbnail failed (non-fatal):', res.status);
  else console.log('[PublishService] Thumbnail uploaded');
}

// ============================================
// STEP 5: Playlist Add
// ============================================
async function addToPlaylist(accessToken, videoId, playlistId) {
  if (!playlistId) return;

  const res = await fetch(`${YT_API_BASE}/playlistItems?part=snippet`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      snippet: {
        playlistId,
        resourceId: { kind: 'youtube#video', videoId },
      },
    }),
  });

  if (!res.ok) console.warn('[PublishService] Playlist add failed (non-fatal):', res.status);
  else console.log('[PublishService] Added to playlist:', playlistId);
}

// ============================================
// MAIN CLASS: PublishService
// ============================================
class PublishService {
  constructor() {
    this.uploading = new Set();
    this.listeners = new Set();
    this.progress  = {};
  }

  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  notify()            { this.listeners.forEach(l => l()); }
  isUploading(id)     { return this.uploading.has(id); }
  getProgress(id)     { return this.progress[id] || 0; }

  async publishStory({ accessToken, storyId, story, customMetadata = {}, onProgress }) {
    if (this.uploading.has(storyId)) return;
    if (!story.videoLink) throw new Error('Video Drive link missing');
    if (!accessToken)     throw new Error('YouTube connect nahi — upar se login karo');

    this.uploading.add(storyId);
    this.progress[storyId] = 0;
    this.notify();

    await updateStory(storyId, { dashStatus: 'publishing' }).catch(() => {});

    try {
      onProgress && onProgress(2,  'Downloading video from Drive...');
      const { blob: videoBlob } = await downloadDriveBlob(story.videoLink, accessToken);

      onProgress && onProgress(10, 'Downloading thumbnail...');
      const thumbnailBlob = story.thumbLink
        ? await downloadThumbnailBlob(story.thumbLink, accessToken)
        : null;

      const tags = [
        ...(customMetadata.tags || []),
        ...(story.hashtags ? story.hashtags.split(' ').map(t => t.replace('#','').trim()) : []),
        ...(story.seoTags   ? story.seoTags.split(',').map(t => t.trim())                 : []),
      ].filter(Boolean).slice(0, 500);

      const ytMetadata = {
        snippet: {
          title:           customMetadata.title       || story.title || 'Untitled',
          description:     customMetadata.description || story.story || '',
          tags,
          categoryId:      customMetadata.categoryId  || '22',
          defaultLanguage: 'en',
        },
        status: {
          privacyStatus: customMetadata.visibility || 'private',
          ...(customMetadata.publishAt
            ? { publishAt: customMetadata.publishAt, privacyStatus: 'private' }
            : {}),
        },
      };

      onProgress && onProgress(15, 'Starting YouTube upload...');
      const videoId = await youtubeResumableUpload(accessToken, videoBlob, ytMetadata, (pct) => {
        const mapped = 15 + Math.round(pct * 0.75);
        this.progress[storyId] = mapped;
        onProgress && onProgress(mapped, `Uploading: ${pct}%`);
        this.notify();
      });

      const ytLink = `https://www.youtube.com/watch?v=${videoId}`;

      onProgress && onProgress(92, 'Uploading thumbnail...');
      await uploadYouTubeThumbnail(accessToken, videoId, thumbnailBlob);

      onProgress && onProgress(95, 'Adding to playlist...');
      await addToPlaylist(accessToken, videoId,
        customMetadata.playlistId || ENV.YOUTUBE_PLAYLIST_ID || null);

      onProgress && onProgress(98, 'Updating Sheet...');
      await updateStory(storyId, { dashStatus: 'published', ytLink, uploadError: '' });

      onProgress && onProgress(100, '✅ Published!');
      this.progress[storyId] = 100;
      this.notify();

      console.log('[PublishService] ✅ Published:', ytLink);
      return ytLink;

    } catch (error) {
      console.error('[PublishService] ❌ Failed:', error.message);
      await updateStory(storyId, {
        dashStatus: 'publish_failed',
        uploadError: error.message || 'Unknown error',
      }).catch(() => {});
      this.progress[storyId] = 0;
      this.notify();
      throw error;

    } finally {
      this.uploading.delete(storyId);
      this.notify();
    }
  }
}

export const publishService = new PublishService();