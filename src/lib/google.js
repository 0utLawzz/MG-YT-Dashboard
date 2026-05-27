/**
 * Google Services Helper
 * Handles YouTube Data API and Google Sheets API interactions
 */

import { ENV } from './config/env';

const GOOGLE_API_KEY = ENV.GOOGLE_API_KEY;

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
// eslint-disable-next-line no-unused-vars
export async function uploadToYouTube(metadata, videoBlob) {
  // This would typically use the YouTube Data API v3 upload endpoint
  // with a multipart/resumable upload strategy.
}
