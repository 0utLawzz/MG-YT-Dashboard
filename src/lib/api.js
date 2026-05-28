// ============================================
// src/lib/api.js
// Hardened API layer with array guards and
// structured logging for all data operations
// ============================================
import { ENV } from './config/env';
import { apiClient } from './api/client';

function dataLog(level, message, data) {
  const prefix = `[BLS-DATA][${new Date().toISOString()}]`;
  if (level === 'error') console.error(prefix, message, data ?? '');
  else if (level === 'warn') console.warn(prefix, message, data ?? '');
  else console.log(prefix, message, data ?? '');
}

export async function fetchStories() {
  const url = `${ENV.SCRIPT_URL}?action=getAllStories`;
  dataLog('info', 'Fetching stories...', { url: url.substring(0, 80) });

  const data = await apiClient.get(url);

  // Guard: GAS sometimes returns { error: "..." }
  if (data?.error) {
    dataLog('error', 'Server returned error', data.error);
    throw new Error(data.error);
  }

  // Guard: Ensure we always return an array
  if (!Array.isArray(data)) {
    dataLog('warn', 'fetchStories: response is not an array, wrapping', {
      type: typeof data,
      value: data,
    });
    // If it's an object with a data/rows property, try to extract
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.rows && Array.isArray(data.rows)) return data.rows;
    if (data?.stories && Array.isArray(data.stories)) return data.stories;
    // If it's null/undefined, return empty
    if (!data) return [];
    // Unknown shape — return empty to prevent crash
    dataLog('error', 'fetchStories: unexpected response shape', data);
    return [];
  }

  dataLog('info', `Fetched ${data.length} stories`);
  return data;
}

export async function fetchAnalytics() {
  const url = `${ENV.SCRIPT_URL}?action=getAnalytics`;
  dataLog('info', 'Fetching analytics...');

  const data = await apiClient.get(url);
  if (data?.error) throw new Error(data.error);

  // Guard: ensure analytics is usable
  if (!data) {
    dataLog('warn', 'fetchAnalytics: empty response');
    return {};
  }
  return data;
}

export async function updateStory(rowId, updates) {
  // SAFETY: rowId kabhi bhi object nahi hona chahiye
  let safeRowId;
  if (typeof rowId === "object" && rowId !== null) {
    dataLog('warn', 'updateStory: rowId was an object, extracting .id', rowId);
    safeRowId = rowId.id;
  } else {
    safeRowId = rowId;
  }

  safeRowId = String(safeRowId).trim();

  if (!safeRowId || safeRowId === "undefined" || safeRowId === "null") {
    throw new Error("updateStory: valid rowId nahi mila — " + safeRowId);
  }

  const updatesParam = encodeURIComponent(JSON.stringify(updates));
  const rowIdParam   = encodeURIComponent(safeRowId);
  const url = `${ENV.SCRIPT_URL}?action=updateStory&rowId=${rowIdParam}&updates=${updatesParam}`;

  dataLog('info', 'Updating story', { rowId: safeRowId, updates });

  const data = await apiClient.get(url);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ============================================
// Drive link helpers
// ============================================
export function getDriveDirectLink(driveUrl) {
  if (!driveUrl) return "";
  if (driveUrl.includes("uc?export=view")) return driveUrl;
  const match = driveUrl.match(/\/d\/([\w-]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  if (/^[\w-]{25,}$/.test(driveUrl)) return `https://drive.google.com/uc?export=view&id=${driveUrl}`;
  return driveUrl;
}

export function getDriveDirectDownload(driveUrl) {
  // Returns a direct streamable URL for video preview
  // Works only if file is "Anyone with link" shared
  if (!driveUrl) return "";
  const match = driveUrl.match(/\/d\/([\w-]+)/);
  if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  return driveUrl;
}

// Kept for backward compatibility — same as getDriveDirectDownload
export function getDriveEmbedLink(driveUrl) {
  return getDriveDirectDownload(driveUrl);
}

export function getDriveThumbnail(driveUrl) {
  if (!driveUrl) return "";
  const match = driveUrl.match(/\/d\/([\w-]+)/);
  if (match) {
    // sz=w500 limits the size, which makes it load as a proper thumbnail preview
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w500`;
  }
  return driveUrl;
}

// -------------------------------------------------
// postToYouTube — NOT IMPLEMENTED in Code.gs yet
// Code.gs doGet() has no 'publishVideo' action handler.
// Keeping for future GAS-side YouTube integration.
// -------------------------------------------------
// export async function postToYouTube(videoId, metadata = {}) {
//   const url = `${ENV.SCRIPT_URL}?action=publishVideo&videoId=...`;
//   ...
// }