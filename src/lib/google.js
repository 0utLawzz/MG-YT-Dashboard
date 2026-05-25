/**
 * Google Services Helper
 * Handles YouTube Data API and Google Sheets API interactions
 */

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Fetch data from a Google Sheet (Read-only via API Key)
 * @param {string} spreadsheetId 
 * @param {string} range 
 */
export async function fetchSheetData(spreadsheetId, range = 'Sheet1!A:Z') {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${GOOGLE_API_KEY}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Failed to fetch sheet data');
    const data = await resp.json();
    return data.values; // Returns array of arrays
  } catch (err) {
    console.error('Sheet fetch error:', err);
    return null;
  }
}

/**
 * YouTube Upload Helper (Skeleton)
 * Real implementation requires OAuth2 token flow
 */
export async function uploadToYouTube(metadata, videoBlob) {
  console.log('Publishing to YouTube with metadata:', metadata);
  // This would typically use the YouTube Data API v3 upload endpoint
  // with a multipart/resumable upload strategy.
}
