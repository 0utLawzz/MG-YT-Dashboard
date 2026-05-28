// ============================================
// src/lib/config/env.js
// Central config — reads from localStorage (Settings Drawer)
// first, then falls back to .env file values.
// ADD new keys here AND in SettingsDrawer.jsx
// ============================================

// Safely read saved settings from localStorage (set via Settings Drawer)
let savedConfig = {};
try {
  savedConfig = JSON.parse(localStorage.getItem('bls_config') || '{}');
} catch (e) {
  // If JSON is corrupt, ignore and use .env defaults
}

export const ENV = {
  // --- Google OAuth Client ID (for YouTube + Drive login popup) ---
  GOOGLE_CLIENT_ID: savedConfig.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID,

  // --- Apps Script URL (Google Sheet backend) ---
  // This is the deployed Google Apps Script Web App URL
  SCRIPT_URL:
    savedConfig.sheetUrl ||
    import.meta.env.VITE_SCRIPT_URL ||
    'https://script.google.com/macros/s/AKfycbxUN4BZX6pXpcABnTwvXRoMmhYiBvH444HL97AkfXKGx0oclJFPqbJtjC-YEfrQV96Pfw/exec',

  // --- YouTube Channel ID (fixed channel jahan videos jaati hain) ---
  // Format: UC followed by 22 characters
  YOUTUBE_CHANNEL_ID:
    savedConfig.youtubeChannelId ||
    import.meta.env.VITE_YOUTUBE_CHANNEL_ID ||
    'UC2FdFOP-XrLFlWN9VJWmYWQ',

  // --- YouTube Playlist ID (album/playlist jahan video add hogi) ---
  // Optional — agar set hai toh video automatically is playlist mein add hogi
  YOUTUBE_PLAYLIST_ID:
    savedConfig.youtubePlaylistId ||
    import.meta.env.VITE_YOUTUBE_PLAYLIST_ID ||
    '',

  // --- Drive Folder ID (for file uploads) ---
  // Optional — agar set hai toh files is folder mein upload hongi
  DRIVE_FOLDER_ID:
    savedConfig.driveFolderId ||
    import.meta.env.VITE_DRIVE_FOLDER_ID ||
    '',
};
