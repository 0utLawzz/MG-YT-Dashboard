// ============================================
// src/services/upload/driveUpload.js
// Google Drive Upload Service
// ============================================

import { ENV } from '../../lib/config/env';

// Get Drive folder ID from Settings or .env
function getDriveFolderId() {
  // First check localStorage (Settings)
  try {
    const saved = localStorage.getItem('bls_config');
    if (saved) {
      const config = JSON.parse(saved);
      if (config.driveFolderId) return config.driveFolderId;
    }
  } catch (e) {
    console.warn('[DriveUpload] Failed to read config from localStorage:', e);
  }
  
  // Fall back to .env
  return ENV.DRIVE_FOLDER_ID || '';
}

// Helper: Convert direct Google API URL to proxy URL in dev mode
function proxyUrl(url) {
  const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!IS_DEV) return url;
  
  // Convert https://www.googleapis.com/upload/drive/v3/... to /drive-proxy/upload/...
  if (url.includes('www.googleapis.com')) {
    return url.replace('https://www.googleapis.com', '/drive-proxy');
  }
  return url;
}

// Upload file to Google Drive
export async function uploadToDrive(file, accessToken, onProgress) {
  const folderId = getDriveFolderId();
  
  if (!folderId) {
    throw new Error('Drive Folder ID not configured. Set it in Settings or .env file.');
  }

  console.log('[DriveUpload] Starting upload to folder:', folderId);
  console.log('[DriveUpload] File:', file.name, file.size, 'bytes');

  // Check if running on localhost (dev mode)
  const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const DRIVE_BASE = IS_DEV
    ? '/drive-proxy/drive/v3'
    : 'https://www.googleapis.com/drive/v3';

  // Step 1: Initialize resumable upload session
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: folderId ? [folderId] : undefined,
  };

  const initUrl = `${DRIVE_BASE}/files?uploadType=resumable&supportsAllDrives=true`;
  
  const initRes = await fetch(initUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Length': String(file.size),
      'X-Upload-Content-Type': file.type,
    },
    body: JSON.stringify(metadata),
  });

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`Drive upload init failed (${initRes.status}): ${errText.substring(0, 200)}`);
  }

  let uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) throw new Error('Drive ne upload URL nahi diya');

  // In dev mode, convert upload URL to proxy URL
  uploadUrl = proxyUrl(uploadUrl);
  console.log('[DriveUpload] Upload session started, URL:', uploadUrl);

  // Step 2: Upload in chunks
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  let offset = 0;

  while (offset < file.size) {
    const end = Math.min(offset + chunkSize, file.size);
    const chunk = file.slice(offset, end);

    const chunkRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${offset}-${end - 1}/${file.size}`,
        'Content-Type': file.type,
      },
      body: chunk,
    });

    if (chunkRes.status === 308) {
      // Resume Incomplete - chunk uploaded successfully
      const range = chunkRes.headers.get('Range');
      offset = range ? parseInt(range.split('-')[1], 10) + 1 : end;
      const pct = Math.round((offset / file.size) * 100);
      if (onProgress) onProgress(pct);
      console.log(`[DriveUpload] Upload: ${pct}%`);

    } else if (chunkRes.ok) {
      // Upload complete
      const data = await chunkRes.json();
      console.log('[DriveUpload] Upload complete! File ID:', data.id);
      
      // Return the Drive sharing link
      return {
        fileId: data.id,
        webViewLink: data.webViewLink,
        shareLink: `https://drive.google.com/file/d/${data.id}/view`,
      };

    } else {
      const err = await chunkRes.text();
      throw new Error(`Chunk failed (${chunkRes.status}): ${err.substring(0, 200)}`);
    }
  }

  throw new Error('Upload loop ended without completion');
}

// Set file permissions to "Anyone with link"
export async function setDriveFilePermissions(fileId, accessToken) {
  const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const DRIVE_BASE = IS_DEV
    ? '/drive-proxy/drive/v3'
    : 'https://www.googleapis.com/drive/v3';

  const res = await fetch(`${DRIVE_BASE}/files/${fileId}/permissions?supportsAllDrives=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });

  if (!res.ok) {
    console.warn('[DriveUpload] Failed to set permissions:', res.status);
    return false;
  }

  console.log('[DriveUpload] Permissions set to "Anyone with link"');
  return true;
}
