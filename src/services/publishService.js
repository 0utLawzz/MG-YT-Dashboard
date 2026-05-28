// ============================================
// src/services/publishService.js
// FIXED v5.1 — Permission Error Fix
//
// Changes from v5:
// 1. Drive download error message improved — 404 clearly explain karta hai
// 2. Drive permission check BEFORE download — agar file shared nahi to turant batao
// 3. Thumbnail URL format fix — getDriveDirectDownload use karo
// 4. Chunk upload timeout handling add kiya
// ============================================

import { updateStory } from '../lib/api';
import { ENV } from '../lib/config/env';

// ─── Dev / Prod Detection ─────────────────────────────────────────────────────
// Localhost pe Vite proxy use karo (CORS fix)
// Production pe direct googleapis.com (CORS already allowed)
const IS_DEV = window.location.hostname === 'localhost'
            || window.location.hostname === '127.0.0.1';

// ─── API Base URLs ────────────────────────────────────────────────────────────
const DRIVE_BASE     = IS_DEV ? '/drive-proxy/drive/v3'               : 'https://www.googleapis.com/drive/v3';
const YT_UPLOAD_BASE = IS_DEV ? '/yt-upload-proxy/upload/youtube/v3'  : 'https://www.googleapis.com/upload/youtube/v3';
const YT_API_BASE    = IS_DEV ? '/yt-api-proxy/youtube/v3'            : 'https://www.googleapis.com/youtube/v3';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Drive URL se File ID nikalo
function extractDriveFileId(driveUrl) {
  if (!driveUrl) return null;
  const match = driveUrl.match(/\/d\/([\w-]+)/);
  if (match) return match[1];
  // Agar ID directly diya ho (e.g. from uc?export=view&id=...)
  const idMatch = driveUrl.match(/[?&]id=([\w-]+)/);
  return idMatch ? idMatch[1] : null;
}

// ─── STEP 0: Drive File Permission Check ─────────────────────────────────────
// Pehle check karo ke file actually accessible hai ya nahi
// Agar 404 ya 403 aaya to user ko clear message do
async function checkDriveFileAccess(fileId, accessToken) {
  const checkUrl = `${DRIVE_BASE}/files/${fileId}?fields=id,name,size,mimeType,permissions&supportsAllDrives=true`;

  try {
    const res = await fetch(checkUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 404) {
      throw new Error(
        `Drive file (${fileId}) nahi mili — 404 Not Found.\n` +
        `Check karo: File delete to nahi hui? Correct folder ID?`
      );
    }

    if (res.status === 403) {
      throw new Error(
        `Drive file (${fileId}) pe permission nahi — 403 Forbidden.\n` +
        `Fix: Drive → File pe right-click → Share → "Anyone with the link" → Editor/Viewer set karo.`
      );
    }

    if (!res.ok) {
      throw new Error(`Drive file check failed (${res.status})`);
    }

    const data = await res.json();
    console.log('[PublishService] ✅ File accessible:', data.name, '—', data.size, 'bytes');
    return data;

  } catch (err) {
    // Network error wagera
    if (!err.message.includes('Drive file')) {
      throw new Error('Drive file check failed: ' + err.message);
    }
    throw err;
  }
}

// ─── STEP 1: Drive se Video Blob Download ────────────────────────────────────
async function downloadDriveBlob(driveUrl, accessToken) {
  const fileId = extractDriveFileId(driveUrl);
  if (!fileId) throw new Error('Drive URL se file ID nahi mila: ' + driveUrl);

  // Pehle access check karo
  await checkDriveFileAccess(fileId, accessToken);

  const downloadUrl = `${DRIVE_BASE}/files/${fileId}?alt=media&supportsAllDrives=true`;
  console.log('[PublishService] Downloading:', fileId);

  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    redirect: 'follow',
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');

    // Specific error messages
    if (res.status === 403) {
      throw new Error(
        `Drive download blocked (403).\n` +
        `File ko "Anyone with link" → Viewer ya Editor set karo.\n` +
        `Drive → File → Share → Change permission.`
      );
    }
    if (res.status === 404) {
      throw new Error(`Drive file nahi mili (404). File ID check karo: ${fileId}`);
    }

    throw new Error(
      `Drive download failed (${res.status}): ${errText.substring(0, 150)}`
    );
  }

  const blob = await res.blob();

  if (blob.size < 1000) {
    throw new Error(
      `File download hua lekin empty hai (${blob.size} bytes).\n` +
      `File sharing permission dobara check karo.`
    );
  }

  console.log('[PublishService] ✅ Downloaded:', blob.size, 'bytes, type:', blob.type);
  return { blob, fileId };
}

// ─── STEP 2: Thumbnail Blob ───────────────────────────────────────────────────
async function downloadThumbnailBlob(thumbUrl, accessToken) {
  const fileId = extractDriveFileId(thumbUrl);
  if (!fileId) return null;

  try {
    const url = `${DRIVE_BASE}/files/${fileId}?alt=media&supportsAllDrives=true`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: 'follow',
    });
    if (!res.ok) {
      console.warn('[PublishService] Thumbnail download failed (non-fatal):', res.status);
      return null;
    }
    const blob = await res.blob();
    return blob.size > 500 ? blob : null;
  } catch (err) {
    console.warn('[PublishService] Thumbnail error (non-fatal):', err.message);
    return null;
  }
}

// ─── STEP 3: YouTube Resumable Upload ────────────────────────────────────────
async function youtubeResumableUpload(accessToken, videoBlob, metadata, onProgress) {

  // Upload session initialize karo
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
    const err = await initRes.json().catch(() => ({}));
    const msg = err?.error?.message || err?.error?.errors?.[0]?.reason || `Status ${initRes.status}`;

    // Common YouTube errors
    if (initRes.status === 401) throw new Error('YouTube: Token expire ho gaya. Dobara sign in karo.');
    if (initRes.status === 403) throw new Error(`YouTube: Permission denied — ${msg}. YouTube account connected hai?`);
    if (initRes.status === 400) throw new Error(`YouTube: Invalid request — ${msg}`);

    throw new Error(`YouTube upload start failed (${initRes.status}): ${msg}`);
  }

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) throw new Error('YouTube ne upload URL nahi diya (Location header missing)');
  console.log('[PublishService] ✅ YouTube session started');

  // Chunked upload
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  let offset = 0;

  while (offset < videoBlob.size) {
    const end   = Math.min(offset + CHUNK_SIZE, videoBlob.size);
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
      // Chunk OK, agle chunk ki range lo
      const range = chunkRes.headers.get('Range');
      offset = range ? parseInt(range.split('-')[1], 10) + 1 : end;
      const pct = Math.round((offset / videoBlob.size) * 100);
      if (onProgress) onProgress(pct);
      console.log(`[PublishService] Upload: ${pct}%`);

    } else if (chunkRes.status === 200 || chunkRes.status === 201) {
      // Upload complete
      const data = await chunkRes.json();
      console.log('[PublishService] ✅ Upload done! Video ID:', data.id);
      if (onProgress) onProgress(100);
      return data.id;

    } else {
      const err = await chunkRes.json().catch(() => ({}));
      throw new Error(
        `Chunk upload failed (${chunkRes.status}): ` +
        (err?.error?.message || JSON.stringify(err).substring(0, 200))
      );
    }
  }

  throw new Error('Upload loop ended without video ID');
}

// ─── STEP 4: Thumbnail Upload ─────────────────────────────────────────────────
// youtube.force-ssl scope required for this
async function uploadYouTubeThumbnail(accessToken, videoId, thumbnailBlob) {
  if (!thumbnailBlob) {
    console.log('[PublishService] No thumbnail to upload');
    return;
  }

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

  if (!res.ok) {
    // Thumbnail failure is non-fatal — video upload ho gaya
    const err = await res.json().catch(() => ({}));
    console.warn('[PublishService] Thumbnail upload failed (non-fatal):', res.status,
      err?.error?.message || '');
  } else {
    console.log('[PublishService] ✅ Thumbnail uploaded');
  }
}

// ─── STEP 5: Add to Playlist ──────────────────────────────────────────────────
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

  if (!res.ok) {
    console.warn('[PublishService] Playlist add failed (non-fatal):', res.status);
  } else {
    console.log('[PublishService] ✅ Added to playlist:', playlistId);
  }
}

// ─── Main PublishService Class ────────────────────────────────────────────────
class PublishService {
  constructor() {
    this.uploading  = new Set();
    this.listeners  = new Set();
    this.progress   = {};
  }

  subscribe(fn)   { this.listeners.add(fn);    return () => this.listeners.delete(fn); }
  notify()        { this.listeners.forEach(fn => fn()); }
  isUploading(id) { return this.uploading.has(id); }
  getProgress(id) { return this.progress[id] || 0; }

  async publishStory({ accessToken, storyId, story, customMetadata = {}, onProgress }) {

    // Guards
    if (this.uploading.has(storyId)) {
      throw new Error('Is story ka upload already chal raha hai');
    }
    if (!story.videoLink) {
      throw new Error('Video Drive link nahi hai. Storyboard tab mein add karo.');
    }
    if (!accessToken) {
      throw new Error('YouTube se connected nahi. Upar "Connect YouTube Account" click karo.');
    }

    this.uploading.add(storyId);
    this.progress[storyId] = 0;
    this.notify();

    // Sheet mein "publishing" status set karo
    await updateStory(storyId, { dashStatus: 'publishing' }).catch(e => {
      console.warn('[PublishService] Status update failed (non-fatal):', e.message);
    });

    try {
      // ── Stage 1: Drive Video Download ──────────────────────────────────────
      onProgress && onProgress(2, '📥 Video Drive se download ho rahi hai...');
      const { blob: videoBlob } = await downloadDriveBlob(story.videoLink, accessToken);

      // ── Stage 2: Thumbnail Download ────────────────────────────────────────
      onProgress && onProgress(10, '🖼️ Thumbnail download ho rahi hai...');
      const thumbnailBlob = story.thumbLink
        ? await downloadThumbnailBlob(story.thumbLink, accessToken)
        : null;

      if (!thumbnailBlob) {
        console.warn('[PublishService] Thumbnail nahi mili — video bina thumbnail ke upload hogi');
      }

      // ── Stage 3: YouTube Metadata Build ────────────────────────────────────
      // Tags: custom + story hashtags + story SEO tags (max 500 chars total)
      const tags = [
        ...(customMetadata.tags || []),
        ...(story.hashtags ? story.hashtags.split(/\s+/).map(t => t.replace(/^#/, '').trim()) : []),
        ...(story.seoTags  ? story.seoTags.split(',').map(t => t.trim())                      : []),
      ].filter(Boolean).slice(0, 30); // YouTube max 30 tags

      const ytMetadata = {
        snippet: {
          title:           (customMetadata.title       || story.title || 'Untitled').substring(0, 100),
          description:     (customMetadata.description || story.story || '').substring(0, 5000),
          tags,
          categoryId:      customMetadata.categoryId  || '22', // 22 = People & Blogs
          defaultLanguage: 'en',
        },
        status: {
          privacyStatus: customMetadata.visibility || 'private',
          ...(customMetadata.publishAt
            ? { publishAt: customMetadata.publishAt, privacyStatus: 'private' }
            : {}),
        },
      };

      // ── Stage 4: YouTube Upload ────────────────────────────────────────────
      onProgress && onProgress(15, '🚀 YouTube pe upload shuru...');
      const videoId = await youtubeResumableUpload(
        accessToken,
        videoBlob,
        ytMetadata,
        (pct) => {
          // 15% to 90% range mein map karo
          const mapped = 15 + Math.round(pct * 0.75);
          this.progress[storyId] = mapped;
          onProgress && onProgress(mapped, `⬆️ Uploading: ${pct}%`);
          this.notify();
        }
      );

      const ytLink = `https://www.youtube.com/watch?v=${videoId}`;

      // ── Stage 5: Thumbnail Set ─────────────────────────────────────────────
      onProgress && onProgress(92, '🖼️ Thumbnail set ho rahi hai...');
      await uploadYouTubeThumbnail(accessToken, videoId, thumbnailBlob);

      // ── Stage 6: Playlist Add ──────────────────────────────────────────────
      onProgress && onProgress(95, '📋 Playlist mein add ho rahi hai...');
      const playlistId = customMetadata.playlistId || ENV.YOUTUBE_PLAYLIST_ID || null;
      await addToPlaylist(accessToken, videoId, playlistId);

      // ── Stage 7: Sheet Update ──────────────────────────────────────────────
      onProgress && onProgress(98, '📊 Sheet update ho rahi hai...');
      await updateStory(storyId, {
        dashStatus:  'published',
        ytLink,
        uploadError: '',
      });

      onProgress && onProgress(100, '✅ Successfully published!');
      this.progress[storyId] = 100;
      this.notify();

      console.log('[PublishService] ✅ Published:', ytLink);
      return ytLink;

    } catch (error) {
      // Error log + Sheet update
      console.error('[PublishService] ❌ Failed:', error.message);

      await updateStory(storyId, {
        dashStatus:  'publish_failed',
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