// ============================================
// src/services/publishService.js
// CORE PUBLISH ENGINE
// Flow: Drive URL → Download blob → YouTube Resumable Upload
//       → Thumbnail upload → Playlist add → Sheet update
// ============================================

import { updateStory } from '../lib/api';
import { ENV } from '../lib/config/env';

// Helper: wait for N milliseconds (used in retry backoff)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// STEP 1: Download video blob from Google Drive
// Drive file must be "Anyone with link" shareable.
// We use the export/download URL format.
// ============================================
async function downloadDriveBlob(driveUrl, accessToken) {
  // Extract the Drive file ID from the URL
  // Example URL: https://drive.google.com/file/d/FILE_ID/view
  const match = driveUrl.match(/\/d\/([\w-]+)/);
  if (!match) throw new Error('Invalid Drive URL — file ID nikal nahi saka: ' + driveUrl);

  const fileId = match[1];

  // Try authenticated download first (using OAuth token)
  // This works even for private files
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  console.log('[PublishService] Downloading Drive file:', fileId);

  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive download failed (${res.status}): ${errText.substring(0, 200)}`);
  }

  // Convert response to Blob
  const blob = await res.blob();
  console.log('[PublishService] Drive file downloaded, size:', blob.size, 'bytes');
  return { blob, fileId };
}

// ============================================
// STEP 2: Download thumbnail blob from Drive
// Same logic as video download
// ============================================
async function downloadThumbnailBlob(thumbUrl, accessToken) {
  const match = thumbUrl.match(/\/d\/([\w-]+)/);
  if (!match) return null; // Thumbnail optional hai

  const fileId = match[1];
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    console.warn('[PublishService] Thumbnail download failed, skipping:', res.status);
    return null;
  }

  const blob = await res.blob();
  return blob;
}

// ============================================
// STEP 3: YouTube Resumable Upload
// Uploads video in chunks (256KB each)
// Returns YouTube video ID on success
// ============================================
async function youtubeResumableUpload(accessToken, videoBlob, metadata, onProgress) {
  // 3a. Initiate upload session — get upload URL from YouTube
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': videoBlob.size,
        'X-Upload-Content-Type': videoBlob.type || 'video/mp4',
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`YouTube upload initiation failed (${initRes.status}): ${errText.substring(0, 300)}`);
  }

  // YouTube returns upload URL in Location header
  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) throw new Error('YouTube ne upload URL nahi diya (Location header missing)');

  console.log('[PublishService] YouTube upload session started');

  // 3b. Upload in chunks
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks (256KB minimum, 5MB recommended)
  let offset = 0;

  while (offset < videoBlob.size) {
    const end = Math.min(offset + chunkSize, videoBlob.size);
    const chunk = videoBlob.slice(offset, end);

    const chunkRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${offset}-${end - 1}/${videoBlob.size}`,
        'Content-Type': videoBlob.type || 'video/mp4',
      },
      body: chunk,
    });

    // 308 = chunk received, more to send
    if (chunkRes.status === 308) {
      const range = chunkRes.headers.get('Range');
      offset = range ? parseInt(range.split('-')[1], 10) + 1 : end;

      // Report progress percentage
      const pct = Math.round((offset / videoBlob.size) * 100);
      if (onProgress) onProgress(pct);
      console.log(`[PublishService] Upload progress: ${pct}%`);

    } else if (chunkRes.ok) {
      // 200/201 = upload complete!
      const data = await chunkRes.json();
      console.log('[PublishService] Upload complete! Video ID:', data.id);
      return data.id; // YouTube video ID

    } else {
      const errText = await chunkRes.text();
      throw new Error(`Chunk upload failed (${chunkRes.status}): ${errText.substring(0, 200)}`);
    }
  }

  throw new Error('Upload loop ended without completion — unexpected');
}

// ============================================
// STEP 4: Upload thumbnail to YouTube video
// Requires youtube.upload scope
// ============================================
async function uploadYouTubeThumbnail(accessToken, videoId, thumbnailBlob) {
  if (!thumbnailBlob) {
    console.log('[PublishService] No thumbnail blob, skipping thumbnail upload');
    return;
  }

  const thumbRes = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}&uploadType=media`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': thumbnailBlob.type || 'image/jpeg',
      },
      body: thumbnailBlob,
    }
  );

  if (!thumbRes.ok) {
    const err = await thumbRes.text();
    console.warn('[PublishService] Thumbnail upload failed:', err.substring(0, 200));
    // Non-fatal — video still uploaded successfully
  } else {
    console.log('[PublishService] Thumbnail uploaded successfully');
  }
}

// ============================================
// STEP 5: Add video to YouTube Playlist (Album)
// Only runs if YOUTUBE_PLAYLIST_ID is set in Settings
// ============================================
async function addToPlaylist(accessToken, videoId, playlistId) {
  if (!playlistId) {
    console.log('[PublishService] No playlist ID set, skipping playlist add');
    return;
  }

  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          playlistId: playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId: videoId,
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.warn('[PublishService] Playlist add failed (non-fatal):', err.substring(0, 200));
  } else {
    console.log('[PublishService] Video added to playlist:', playlistId);
  }
}

// ============================================
// MAIN CLASS: PublishService
// Call publishStory() to run the full pipeline
// ============================================
class PublishService {
  constructor() {
    // Track which stories are currently uploading to prevent duplicates
    this.uploading = new Set();
    // Listeners for progress updates (UI can subscribe)
    this.listeners = new Set();
    // Store per-story progress (0–100)
    this.progress = {};
  }

  // Subscribe to progress updates
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all subscribers of state change
  notify() {
    this.listeners.forEach(l => l());
  }

  // Check if a story is currently uploading
  isUploading(storyId) {
    return this.uploading.has(storyId);
  }

  // Get current upload progress for a story (0–100)
  getProgress(storyId) {
    return this.progress[storyId] || 0;
  }

  // ============================================
  // FULL PUBLISH PIPELINE
  // accessToken: Google OAuth token (from useAuth)
  // storyId: Sheet row ID (e.g. "Row-001-02")
  // story: full story object from Sheet
  // customMetadata: { title, description, tags, visibility, playlistId }
  // onProgress: callback(pct) for UI progress bar
  // ============================================
  async publishStory({ accessToken, storyId, story, customMetadata = {}, onProgress }) {
    // Prevent duplicate upload
    if (this.uploading.has(storyId)) {
      console.warn('[PublishService] Already uploading:', storyId);
      return;
    }

    // Validate required fields
    if (!story.videoLink) {
      throw new Error('Video Drive link missing — pehle Storyboard mein video link save karo');
    }
    if (!accessToken) {
      throw new Error('YouTube account connected nahi hai — pehle Connect to YouTube karo');
    }

    this.uploading.add(storyId);
    this.progress[storyId] = 0;
    this.notify();

    // Mark as "publishing" in Sheet immediately
    await updateStory(storyId, { dashStatus: 'publishing' }).catch(e =>
      console.warn('[PublishService] Status update to publishing failed:', e.message)
    );

    try {
      // --- STEP 1: Download video from Drive ---
      onProgress && onProgress(2, 'Downloading video from Drive...');
      const { blob: videoBlob } = await downloadDriveBlob(story.videoLink, accessToken);

      // --- STEP 2: Download thumbnail from Drive (optional) ---
      onProgress && onProgress(5, 'Downloading thumbnail...');
      const thumbnailBlob = story.thumbLink
        ? await downloadThumbnailBlob(story.thumbLink, accessToken)
        : null;

      // --- STEP 3: Build YouTube metadata ---
      // Merge story data with any overrides from the form
      const tags = [
        ...(customMetadata.tags || []),
        ...(story.hashtags ? story.hashtags.split(' ').map(t => t.replace('#', '').trim()) : []),
        ...(story.seoTags ? story.seoTags.split(',').map(t => t.trim()) : []),
      ].filter(Boolean).slice(0, 500); // YouTube max 500 tags

      const ytMetadata = {
        snippet: {
          title: customMetadata.title || story.title || 'Untitled Story',
          description: customMetadata.description || story.story || story.storytext || '',
          tags,
          categoryId: customMetadata.categoryId || '22', // 22 = People & Blogs
          defaultLanguage: 'en',
        },
        status: {
          privacyStatus: customMetadata.visibility || 'private',
          // If scheduled, set publishAt time
          ...(customMetadata.publishAt
            ? { publishAt: customMetadata.publishAt, privacyStatus: 'private' }
            : {}),
        },
      };

      // --- STEP 4: Upload to YouTube ---
      onProgress && onProgress(8, 'Starting YouTube upload...');
      const videoId = await youtubeResumableUpload(
        accessToken,
        videoBlob,
        ytMetadata,
        (pct) => {
          // Map upload progress to 8%–90% range
          const mapped = 8 + Math.round(pct * 0.82);
          this.progress[storyId] = mapped;
          onProgress && onProgress(mapped, `Uploading to YouTube: ${pct}%`);
          this.notify();
        }
      );

      const ytLink = `https://www.youtube.com/watch?v=${videoId}`;

      // --- STEP 5: Upload thumbnail ---
      onProgress && onProgress(92, 'Uploading thumbnail...');
      await uploadYouTubeThumbnail(accessToken, videoId, thumbnailBlob);

      // --- STEP 6: Add to playlist/album ---
      onProgress && onProgress(95, 'Adding to playlist...');
      const playlistId = customMetadata.playlistId || ENV.YOUTUBE_PLAYLIST_ID;
      await addToPlaylist(accessToken, videoId, playlistId);

      // --- STEP 7: Update Sheet status to "published" ---
      onProgress && onProgress(98, 'Updating Sheet...');
      await updateStory(storyId, {
        dashStatus: 'published',
        ytLink: ytLink,
        uploadError: '',
      });

      onProgress && onProgress(100, 'Published!');
      this.progress[storyId] = 100;
      this.notify();

      console.log('[PublishService] ✅ Story published successfully:', ytLink);
      return ytLink;

    } catch (error) {
      console.error('[PublishService] ❌ Publish failed:', error.message);

      // Update Sheet with error status
      await updateStory(storyId, {
        dashStatus: 'publish_failed',
        uploadError: error.message || 'Unknown error',
      }).catch(() => {});

      this.progress[storyId] = 0;
      this.notify();
      throw error; // Re-throw so UI can show error message

    } finally {
      this.uploading.delete(storyId);
      this.notify();
    }
  }
}

// Export singleton instance — poori app mein ek hi instance use hoga
export const publishService = new PublishService();
