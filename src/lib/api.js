// ============================================
// src/lib/api.js
// FIX: rowId safety — agar object aaye to .id extract karo
// ============================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxUN4BZX6pXpcABnTwvXRoMmhYiBvH444HL97AkfXKGx0oclJFPqbJtjC-YEfrQV96Pfw/exec";

export async function fetchStories() {
  const url = `${SCRIPT_URL}?action=getAllStories`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Sheet se data nahi aaya: " + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function fetchAnalytics() {
  const url = `${SCRIPT_URL}?action=getAnalytics`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Analytics nahi aaya");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function updateStory(rowId, updates) {
  // ============================================
  // SAFETY FIX: rowId kabhi bhi object nahi hona chahiye
  // Agar koi galti se poora story object pass kare
  // to usse .id extract karo
  // ============================================
  let safeRowId;
  if (typeof rowId === "object" && rowId !== null) {
    console.warn("updateStory: rowId was an object! Extracting .id", rowId);
    safeRowId = rowId.id; // story.id nikalo
  } else {
    safeRowId = rowId;
  }

  // String ensure karo
  safeRowId = String(safeRowId).trim();

  if (!safeRowId || safeRowId === "undefined" || safeRowId === "null") {
    throw new Error("updateStory: valid rowId nahi mila — " + safeRowId);
  }

  const updatesParam = encodeURIComponent(JSON.stringify(updates));
  const rowIdParam   = encodeURIComponent(safeRowId);
  const url = `${SCRIPT_URL}?action=updateStory&rowId=${rowIdParam}&updates=${updatesParam}`;

  console.log("updateStory →", safeRowId, updates);

  const res = await fetch(url);
  if (!res.ok) throw new Error("Update fail: " + res.status);
  const data = await res.json();
  console.log("updateStory ←", data);
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