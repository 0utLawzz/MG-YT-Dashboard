// ============================================
// src/lib/drive.js
// Google Drive API integration for file uploads
// OAuth 2.0 flow + file upload functions
// ============================================

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Token storage key
const TOKEN_KEY = 'drive_access_token';

// ============================================
// Check if user is authenticated with Google Drive
// ============================================
export function isDriveAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}

// ============================================
// Get stored access token
// ============================================
export function getDriveToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// ============================================
// Store access token
// ============================================
export function setDriveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

// ============================================
// Clear access token (logout)
// ============================================
export function clearDriveToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ============================================
// Initialize Google OAuth client
// ============================================
export function initGoogleAuth() {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google API not loaded'));
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPES,
      callback: (response) => {
        if (response.access_token) {
          setDriveToken(response.access_token);
          resolve(response.access_token);
        } else {
          reject(new Error('Failed to get access token'));
        }
      },
    });

    resolve(client);
  });
}

// ============================================
// Trigger Google OAuth popup
// ============================================
export async function authenticateWithDrive() {
  try {
    const client = await initGoogleAuth();
    client.requestAccessToken();
  } catch (error) {
    console.error('Drive authentication failed:', error);
    throw error;
  }
}

// ============================================
// Upload file to Google Drive
// ============================================
export async function uploadToDrive(file, folderId = null) {
  const token = getDriveToken();
  if (!token) {
    throw new Error('Not authenticated with Google Drive');
  }

  const metadata = {
    name: file.name,
    mimeType: file.type,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  try {
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return {
      id: data.id,
      webViewLink: data.webViewLink,
      webContentLink: data.webContentLink,
    };
  } catch (error) {
    console.error('Drive upload failed:', error);
    throw error;
  }
}

// ============================================
// Set file permissions to "Anyone with link"
// ============================================
export async function setDriveFilePublic(fileId) {
  const token = getDriveToken();
  if (!token) {
    throw new Error('Not authenticated with Google Drive');
  }

  try {
    // First, get the file to check current permissions
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to set permissions');
    }

    return true;
  } catch (error) {
    console.error('Failed to set file permissions:', error);
    throw error;
  }
}

// ============================================
// Get shareable link for a Drive file
// ============================================
export async function getDriveShareableLink(fileId) {
  const token = getDriveToken();
  if (!token) {
    throw new Error('Not authenticated with Google Drive');
  }

  try {
    // Set permissions first
    await setDriveFilePublic(fileId);

    // Get file details with webViewLink
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink,webContentLink`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get file link');
    }

    const data = await response.json();
    return data.webViewLink || data.webContentLink;
  } catch (error) {
    console.error('Failed to get shareable link:', error);
    throw error;
  }
}

// ============================================
// Load Google API script
// ============================================
export function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
