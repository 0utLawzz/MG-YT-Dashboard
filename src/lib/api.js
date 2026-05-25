// ============================================
// src/lib/api.js
// Google Sheet API — replaces Supabase completely
// Apps Script URL se connect hota hai
// ============================================

// Yahan apna Apps Script URL paste karein
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxUN4BZX6pXpcABnTwvXRoMmhYiBvH444HL97AkfXKGx0oclJFPqbJtjC-YEfrQV96Pfw/exec";

// ============================================
// GET: Sari stories fetch karo
// Apps Script → getAllStories action
// ============================================
export async function fetchStories() {
  const url = `${SCRIPT_URL}?action=getAllStories`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Sheet se data nahi aaya: " + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data; // Array of story objects
}

// ============================================
// GET: Analytics data fetch karo
// Apps Script → getAnalytics action
// ============================================
export async function fetchAnalytics() {
  const url = `${SCRIPT_URL}?action=getAnalytics`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Analytics nahi aaya");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ============================================
// POST: Story update karo (status, links, notes)
// rowId = Col A ki value (e.g. "Row-001-01")
// updates = { dashStatus, videoLink, thumbLink, etc. }
// ============================================
export async function updateStory(rowId, updates) {
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" }, // Apps Script ke liye text/plain
    body: JSON.stringify({
      action: "updateStory",
      rowId: rowId,
      updates: updates,
    }),
  });
  if (!res.ok) throw new Error("Update fail: " + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ============================================
// Helper: Drive file ID se direct link banao
// User Drive link paste kare to ID extract karo
// ============================================
export function getDriveDirectLink(driveUrl) {
  if (!driveUrl) return "";

  // Agar already direct link hai
  if (driveUrl.includes("uc?export=view")) return driveUrl;

  // File ID extract karo
  const match = driveUrl.match(/\/d\/([\w-]+)/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Agar already just ID hai
  if (/^[\w-]{25,}$/.test(driveUrl)) {
    return `https://drive.google.com/uc?export=view&id=${driveUrl}`;
  }

  return driveUrl; // As-is return karo
}

// ============================================
// Helper: Drive video embed link banao
// ============================================
export function getDriveEmbedLink(driveUrl) {
  if (!driveUrl) return "";
  const match = driveUrl.match(/\/d\/([\w-]+)/);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return driveUrl;
}

