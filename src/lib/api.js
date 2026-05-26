// ============================================
// src/lib/api.js  — FIXED VERSION
// ROOT CAUSE: Browser se Apps Script POST → CORS block
// FIX: POST ki jagah GET + URL params use karo
// Google Apps Script GET requests mein CORS nahi hoti
// ============================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxUN4BZX6pXpcABnTwvXRoMmhYiBvH444HL97AkfXKGx0oclJFPqbJtjC-YEfrQV96Pfw/exec";

// ============================================
// GET 1: Sari stories fetch karo
// ============================================
export async function fetchStories() {
  const url = `${SCRIPT_URL}?action=getAllStories`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Sheet se data nahi aaya: " + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ============================================
// GET 2: Analytics fetch karo
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
// GET 3: Story update karo — GET params se
// CORS fix: POST ki jagah GET use karo
// rowId aur updates URL encode hokar jaate hain
// ============================================
export async function updateStory(rowId, updates) {
  // updates object ko JSON string mein convert karo
  // phir URL encode karo taake special chars safe rahein
  const updatesParam = encodeURIComponent(JSON.stringify(updates));
  const rowIdParam = encodeURIComponent(String(rowId));

  const url = `${SCRIPT_URL}?action=updateStory&rowId=${rowIdParam}&updates=${updatesParam}`;

  console.log("updateStory call:", { rowId, updates, url: url.substring(0, 150) + "..." });

  const res = await fetch(url);
  if (!res.ok) throw new Error("Update fail: " + res.status);

  const data = await res.json();
  console.log("updateStory response:", data);

  if (data.error) throw new Error(data.error);
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

export function getDriveEmbedLink(driveUrl) {
  if (!driveUrl) return "";
  const match = driveUrl.match(/\/d\/([\w-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  return driveUrl;
}