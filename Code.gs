// ============================================
// Google Apps Script — FINAL VERSION
// Columns: A–P (16 cols) + Q = Upload_Error
// ============================================

const SHEET_NAME = "Sheet1";

const COL = {
  ROW_ID:        1,  // A
  STATUS:        2,  // B
  CATEGORY:      3,  // C
  TITLE:         4,  // D
  STORY:         5,  // E
  CHARACTER:     6,  // F
  HASHTAGS:      7,  // G
  SEO_TAGS:      8,  // H
  DASH_STATUS:   9,  // I - Dashboard_Status
  VIDEO_LINK:   10,  // J - Video_Drive_Link
  THUMB_LINK:   11,  // K - Thumbnail_Drive_Link
  REVIEW_NOTES: 12,  // L - Review_Notes
  SCHEDULE:     13,  // M - Schedule_DateTime
  YT_LINK:      14,  // N - YouTube_Link
  APPROVED_BY:  15,  // O - Approved_By
  UPDATED_AT:   16,  // P - Last_Updated
  UPLOAD_ERROR: 17,  // Q - Upload_Error (nayi column)
};

// ============================================
// doGet — 3 actions handle karta hai
// ?action=getAllStories
// ?action=getAnalytics
// ?action=updateStory&rowId=xxx&updates={...}
// ============================================
function doGet(e) {
  const action = e.parameter.action || "getAllStories";

  try {
    if (action === "getAllStories") return jsonResponse(getAllStories());
    if (action === "getAnalytics")  return jsonResponse(getAnalytics());

    if (action === "updateStory") {
      const rowId = e.parameter.rowId;
      const updatesStr = e.parameter.updates;
      if (!rowId)      return jsonResponse({ error: "rowId missing" });
      if (!updatesStr) return jsonResponse({ error: "updates missing" });

      let updates;
      try {
        updates = JSON.parse(updatesStr);
      } catch (parseErr) {
        return jsonResponse({ error: "updates JSON invalid: " + parseErr.message });
      }

      return jsonResponse(updateStory(rowId, updates));
    }

    return jsonResponse({ error: "Unknown action: " + action });

  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack });
  }
}

// ============================================
// doPost — sirf addColumns ke liye (one-time setup)
// ============================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === "addColumns") return jsonResponse(addNewColumns());
    return jsonResponse({ error: "Unknown POST action" });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ============================================
// FUNCTION 1: Get All Stories
// ============================================
function getAllStories() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // 17 columns tak padho (A to Q)
  const data = sheet.getRange(2, 1, lastRow - 1, 17).getValues();
  const stories = [];

  data.forEach((row, index) => {
    if (!row[COL.ROW_ID - 1] && !row[COL.TITLE - 1]) return;
    stories.push({
      id:           String(row[COL.ROW_ID - 1]      || ""),
      status:       String(row[COL.STATUS - 1]       || ""),
      category:     String(row[COL.CATEGORY - 1]     || ""),
      title:        String(row[COL.TITLE - 1]        || ""),
      story:        String(row[COL.STORY - 1]        || ""),
      character:    String(row[COL.CHARACTER - 1]    || ""),
      hashtags:     String(row[COL.HASHTAGS - 1]     || ""),
      seoTags:      String(row[COL.SEO_TAGS - 1]     || ""),
      dashStatus:   String(row[COL.DASH_STATUS - 1]  || "pending"),
      videoLink:    String(row[COL.VIDEO_LINK - 1]   || ""),
      thumbLink:    String(row[COL.THUMB_LINK - 1]   || ""),
      reviewNotes:  String(row[COL.REVIEW_NOTES - 1] || ""),
      schedule:     String(row[COL.SCHEDULE - 1]     || ""),
      ytLink:       String(row[COL.YT_LINK - 1]      || ""),
      approvedBy:   String(row[COL.APPROVED_BY - 1]  || ""),
      updatedAt:    String(row[COL.UPDATED_AT - 1]   || ""),
      uploadError:  String(row[COL.UPLOAD_ERROR - 1] || ""),  // nayi field
      sheetRow:     index + 2,
    });
  });

  return stories;
}

// ============================================
// FUNCTION 2: Get Analytics
// ============================================
function getAnalytics() {
  const stories = getAllStories();
  const counts = {
    pending: 0, storyboard: 0, uploaded: 0,
    review: 0, approved: 0, scheduled: 0,
    published: 0, publishing: 0, publish_failed: 0,
  };
  const categories = {};

  stories.forEach(s => {
    const ds = s.dashStatus || "pending";
    if (counts[ds] !== undefined) counts[ds]++;
    else counts[ds] = 1;
    if (s.category) categories[s.category] = (categories[s.category] || 0) + 1;
  });

  return {
    total:       stories.length,
    statusCounts: counts,
    categories:  categories,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================
// FUNCTION 3: Update Story
// rowId se row dhundo, updates apply karo
// ============================================
function updateStory(rowId, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: false, error: "No data in sheet" };

  // Column A mein Row ID dhundo
  const colAData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let targetRow = -1;

  colAData.forEach((row, index) => {
    if (String(row[0]).trim() === String(rowId).trim()) {
      targetRow = index + 2;
    }
  });

  if (targetRow === -1) {
    const sampleIds = colAData.slice(0, 5).map(r => String(r[0]));
    return {
      success: false,
      error: `Row not found: "${rowId}". First 5 IDs: ${sampleIds.join(", ")}`,
    };
  }

  // Har supported field write karo
  if (updates.dashStatus   !== undefined) sheet.getRange(targetRow, COL.DASH_STATUS).setValue(String(updates.dashStatus));
  if (updates.videoLink    !== undefined) sheet.getRange(targetRow, COL.VIDEO_LINK).setValue(String(updates.videoLink));
  if (updates.thumbLink    !== undefined) sheet.getRange(targetRow, COL.THUMB_LINK).setValue(String(updates.thumbLink));
  if (updates.reviewNotes  !== undefined) sheet.getRange(targetRow, COL.REVIEW_NOTES).setValue(String(updates.reviewNotes));
  if (updates.schedule     !== undefined) sheet.getRange(targetRow, COL.SCHEDULE).setValue(String(updates.schedule));
  if (updates.ytLink       !== undefined) sheet.getRange(targetRow, COL.YT_LINK).setValue(String(updates.ytLink));
  if (updates.approvedBy   !== undefined) sheet.getRange(targetRow, COL.APPROVED_BY).setValue(String(updates.approvedBy));
  if (updates.uploadError  !== undefined) sheet.getRange(targetRow, COL.UPLOAD_ERROR).setValue(String(updates.uploadError));

  // Last_Updated hamesha update karo
  sheet.getRange(targetRow, COL.UPDATED_AT).setValue(new Date().toISOString());

  return {
    success: true,
    rowId: rowId,
    targetRow: targetRow,
    updatedFields: Object.keys(updates),
  };
}

// ============================================
// FUNCTION 4: Add New Columns (one-time setup)
// Apps Script editor mein manually run karo
// ============================================
function addNewColumns() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const newHeaders = {
    9:  "Dashboard_Status",
    10: "Video_Drive_Link",
    11: "Thumbnail_Drive_Link",
    12: "Review_Notes",
    13: "Schedule_DateTime",
    14: "YouTube_Link",
    15: "Approved_By",
    16: "Last_Updated",
    17: "Upload_Error",        // nayi column Q
  };

  Object.entries(newHeaders).forEach(([col, name]) => {
    const colNum = parseInt(col);
    if (!sheet.getRange(1, colNum).getValue()) {
      sheet.getRange(1, colNum).setValue(name);
    }
  });

  // Pending status set karo jo rows blank hain
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    for (let r = 2; r <= lastRow; r++) {
      if (!sheet.getRange(r, COL.DASH_STATUS).getValue()) {
        sheet.getRange(r, COL.DASH_STATUS).setValue("pending");
      }
    }
  }
  return { success: true, message: "All columns added successfully" };
}

// ============================================
// Helper: JSON Response with CORS headers
// ============================================
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
