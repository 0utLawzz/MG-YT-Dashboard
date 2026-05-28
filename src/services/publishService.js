// ============================================
// src/services/publishService.js
// CORE PUBLISH ENGINE — v3 (Server-Side Upload)
//
// FIX (2026-05-28):
// PEHLE: Browser → googleapis.com/drive → CORS block ❌
// AB:    Browser → Apps Script doPost → Drive + YouTube
//        server-side — CORS ka koi masla nahi ✅
//
// Flow:
//   1. Browser Apps Script ko POST karta hai
//      (fileId + youtubeToken + metadata)
//   2. Apps Script server pe DriveApp se video padhta hai
//   3. UrlFetchApp se YouTube pe seedha upload karta hai
//   4. Video ID wapas aata hai
//   5. Browser Sheet update karta hai
// ============================================

import { updateStory } from '../lib/api';
import { ENV } from '../lib/config/env';

// ============================================
// HELPER: Drive URL se File ID nikalo
// Input:  "https://drive.google.com/file/d/ABC123/view"
// Output: "ABC123"
// ============================================
function extractDriveFileId(driveUrl) {
  if (!driveUrl) return null;
  const match = driveUrl.match(/\/d\/([\w-]+)/);
  return match ? match[1] : null;
}

// ============================================
// MAIN UPLOAD FUNCTION
// Apps Script ko POST karo — server side upload
//
// Ye function browser se sirf ek POST request karta hai
// Apps Script baaki sab kuch karta hai:
//   - Drive se video padhna
//   - YouTube pe upload karna
//   - Thumbnail set karna
//   - Playlist mein add karna
//
// CORS ka koi masla nahi — sab server pe hota hai
// ============================================
async function uploadViaAppsScript({
  scriptUrl,     // Apps Script deployed URL
  fileId,        // Drive video file ID
  thumbFileId,   // Drive thumbnail file ID (optional)
  youtubeToken,  // User ka YouTube OAuth token
  playlistId,    // YouTube playlist ID (optional)
  metadata,      // { title, description, tags, categoryId, privacyStatus }
}) {
  console.log('[PublishService] Starting server-side upload via Apps Script...');
  console.log('[PublishService] Drive fileId:', fileId);

  // POST body banao — sab data Apps Script ko bhejo
  const payload = {
    action:       "uploadVideoToYouTube",   // doPost mein ye action handle hoga
    fileId:       fileId,                   // Drive video file ID
    thumbFileId:  thumbFileId || null,      // Drive thumbnail ID (optional)
    youtubeToken: youtubeToken,             // YouTube OAuth token
    playlistId:   playlistId   || null,     // Playlist ID (optional)
    metadata:     metadata,                 // YouTube metadata
  };

  // Apps Script ko POST request bhejo
  const res = await fetch(scriptUrl, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  // HTTP level error check karo
  if (!res.ok) {
    throw new Error(`Apps Script request failed (HTTP ${res.status})`);
  }

  // JSON response parse karo
  const data = await res.json();

  // Apps Script ne error bheja?
  if (data.error) {
    throw new Error("Upload error: " + data.error);
  }

  // Success — video ID aur link return karo
  if (!data.videoId) {
    throw new Error("Apps Script ne videoId nahi diya — response: " + JSON.stringify(data));
  }

  console.log('[PublishService] Upload complete! YouTube ID:', data.videoId);
  return {
    videoId: data.videoId,
    ytLink:  data.ytLink,
  };
}

// ============================================
// MAIN CLASS: PublishService
// ============================================
class PublishService {
  constructor() {
    // Currently uploading stories — duplicate prevent karo
    this.uploading = new Set();
    // UI progress listeners
    this.listeners = new Set();
    // Per-story progress (0–100)
    this.progress  = {};
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(l => l());
  }

  isUploading(storyId) {
    return this.uploading.has(storyId);
  }

  getProgress(storyId) {
    return this.progress[storyId] || 0;
  }

  // ============================================
  // FULL PUBLISH PIPELINE
  //
  // accessToken:    Google OAuth token (from useAuth)
  // storyId:        Sheet row ID e.g. "Row-001-04"
  // story:          Full story object from Sheet
  // customMetadata: { title, description, tags,
  //                   visibility, playlistId }
  // onProgress:     callback(pct, message)
  // ============================================
  async publishStory({ accessToken, storyId, story, customMetadata = {}, onProgress }) {
    // Duplicate upload rokna
    if (this.uploading.has(storyId)) {
      console.warn('[PublishService] Already uploading:', storyId);
      return;
    }

    // Zaruri fields check karo
    if (!story.videoLink) {
      throw new Error('Video Drive link missing — Storyboard mein video link save karo pehle');
    }
    if (!accessToken) {
      throw new Error('YouTube account connected nahi — upar se Connect YouTube karo');
    }

    this.uploading.add(storyId);
    this.progress[storyId] = 0;
    this.notify();

    // Sheet mein "publishing" mark karo — taake UI update ho
    await updateStory(storyId, { dashStatus: 'publishing' }).catch(e =>
      console.warn('[PublishService] publishing status update failed:', e.message)
    );

    try {
      // ── Drive File IDs nikalo ──
      const fileId     = extractDriveFileId(story.videoLink);
      const thumbFileId = story.thumbLink
        ? extractDriveFileId(story.thumbLink)
        : null;

      if (!fileId) {
        throw new Error('Drive video URL se file ID nahi mila: ' + story.videoLink);
      }

      // ── YouTube metadata banao ──
      const tags = [
        ...(customMetadata.tags || []),
        ...(story.hashtags
          ? story.hashtags.split(' ').map(t => t.replace('#', '').trim())
          : []),
        ...(story.seoTags
          ? story.seoTags.split(',').map(t => t.trim())
          : []),
      ].filter(Boolean).slice(0, 500);   // YouTube max 500 tags

      const metadata = {
        title:         customMetadata.title       || story.title || 'Untitled Story',
        description:   customMetadata.description || story.story || story.storytext || '',
        tags:          tags,
        categoryId:    customMetadata.categoryId  || '22',
        privacyStatus: customMetadata.visibility  || 'private',
      };

      // ── Progress update: starting ──
      onProgress && onProgress(5, 'Sending to Apps Script server...');
      this.progress[storyId] = 5;
      this.notify();

      // ── APPS SCRIPT SERVER-SIDE UPLOAD ──
      // Ye ek single POST request hai — sab kuch server pe hota hai
      // Progress 5% se 90% tak simulate karte hain
      // (server pe actual progress track nahi ho sakti browser se)
      const progressInterval = setInterval(() => {
        // Simulate slow progress — user ko pata chale ke kuch ho raha hai
        const current = this.progress[storyId] || 5;
        if (current < 88) {
          this.progress[storyId] = current + 3;
          onProgress && onProgress(
            this.progress[storyId],
            `Uploading to YouTube via server... ${this.progress[storyId]}%`
          );
          this.notify();
        }
      }, 3000); // har 3 second mein 3% badao

      let videoId, ytLink;
      try {
        const result = await uploadViaAppsScript({
          scriptUrl:    ENV.SCRIPT_URL,
          fileId:       fileId,
          thumbFileId:  thumbFileId,
          youtubeToken: accessToken,
          playlistId:   customMetadata.playlistId || ENV.YOUTUBE_PLAYLIST_ID || null,
          metadata:     metadata,
        });
        videoId = result.videoId;
        ytLink  = result.ytLink;
      } finally {
        // Interval hamesha clear karo chahe success ho ya error
        clearInterval(progressInterval);
      }

      // ── Sheet update: published ──
      onProgress && onProgress(95, 'Updating Sheet...');
      await updateStory(storyId, {
        dashStatus:  'published',
        ytLink:      ytLink,
        uploadError: '',
      });

      // ── Done ──
      onProgress && onProgress(100, '✅ Published successfully!');
      this.progress[storyId] = 100;
      this.notify();

      console.log('[PublishService] ✅ Published:', ytLink);
      return ytLink;

    } catch (error) {
      console.error('[PublishService] ❌ Publish failed:', error.message);

      // Sheet mein error save karo
      await updateStory(storyId, {
        dashStatus:  'publish_failed',
        uploadError: error.message || 'Unknown error',
      }).catch(() => {});

      this.progress[storyId] = 0;
      this.notify();
      throw error;   // UI ko bhi error dikhao

    } finally {
      this.uploading.delete(storyId);
      this.notify();
    }
  }
}

// Singleton — poori app mein ek hi instance
export const publishService = new PublishService();