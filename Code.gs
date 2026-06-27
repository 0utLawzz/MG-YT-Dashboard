// ============================================
// Google Apps Script — FINAL VERSION v4
// Columns: A–Q (17 cols) — Sheet1 (Stories)
//          A–D            — Cred  (Accounts)
//
// NEW in v4:
//   checkAndPublishScheduled() — hourly trigger
//   setupScheduleTrigger()     — one-time setup
//
// doGet handles:
//     - getAccounts   → reads "Cred" sheet
//     - updateAccount → updates Credit/tags in "Cred"
//
// doPost handles YouTube server-side upload
//   Drive → YouTube directly — no browser CORS
// ============================================

const SHEET_NAME = "Sheet1";
const CRED_SHEET = "Cred";

const COL = {
  ROW_ID:        1,  // A
  STATUS:        2,  // B
  CATEGORY:      3,  // C
  TITLE:         4,  // D
  STORY:         5,  // E
  CHARACTER:     6,  // F
  HASHTAGS:      7,  // G
  SEO_TAGS:      8,  // H
  DASH_STATUS:   9,  // I
  VIDEO_LINK:   10,  // J
  THUMB_LINK:   11,  // K
  REVIEW_NOTES: 12,  // L
  SCHEDULE:     13,  // M
  YT_LINK:      14,  // N
  APPROVED_BY:  15,  // O
  UPDATED_AT:   16,  // P
  UPLOAD_ERROR: 17,  // Q
};

// ============================================
// doGet — read/write actions via GET requests
// ?action=getAllStories
// ?action=getAnalytics
// ?action=updateStory&rowId=xxx&updates={...}
// ?action=getAccounts
// ?action=updateAccount&sheetRow=2&updates={...}
// ============================================
function doGet(e) {
  const action = e.parameter.action || "getAllStories";

  try {
    if (action === "getAllStories") return jsonResponse(getAllStories());
    if (action === "getAnalytics")  return jsonResponse(getAnalytics());

    // ── Accounts ──
    if (action === "getAccounts")  return jsonResponse(getAccounts());

    if (action === "updateAccount") {
      const sheetRow   = e.parameter.sheetRow;
      const updatesStr = e.parameter.updates;
      if (!sheetRow)   return jsonResponse({ error: "sheetRow missing" });
      if (!updatesStr) return jsonResponse({ error: "updates missing" });

      let updates;
      try { updates = JSON.parse(updatesStr); }
      catch (pe) {
        return jsonResponse({ error: "updates JSON invalid: " + pe.message });
      }
      return jsonResponse(updateAccount(sheetRow, updates));
    }

    // ── Stories ──
    if (action === "updateStory") {
      const rowId = e.parameter.rowId;
      const updatesStr = e.parameter.updates;
      if (!rowId)      return jsonResponse({ error: "rowId missing" });
      if (!updatesStr) return jsonResponse({ error: "updates missing" });

      let updates;
      try { updates = JSON.parse(updatesStr); }
      catch (parseErr) {
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
// doPost — write/upload actions (POST requests)
//
// POST body (JSON):
// {
//   action: "uploadVideoToYouTube",
//   fileId: "Drive file ID",
//   thumbFileId: "Drive thumb ID",
//   youtubeToken: "ya29.xxx",
//   playlistId: "PLxxx",
//   metadata: {
//     title, description, tags[],
//     categoryId, privacyStatus
//   }
// }
// ============================================
function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === "addColumns") {
      return jsonResponse(addNewColumns());
    }

    if (action === "uploadVideoToYouTube") {
      return jsonResponse(uploadVideoToYouTube(body));
    }

    return jsonResponse({ error: "Unknown POST action: " + action });

  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack });
  }
}

// ============================================
// FUNCTION: getAccounts — reads "Cred" sheet
// Returns: [{ username, password, tags, Credit, sheetRow }]
// ============================================
function getAccounts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CRED_SHEET);

  if (!sheet) {
    return { error: "Sheet named '" + CRED_SHEET + "' not found in this spreadsheet." };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // Read columns A–D (username, password, tags, Credit)
  const data     = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const accounts = [];

  data.forEach(function(row, index) {
    // Skip completely empty rows
    if (!row[0] && !row[1]) return;

    accounts.push({
      username: String(row[0] || ""),
      password: String(row[1] || ""),
      tags:     String(row[2] || ""),
      Credit:   Number(row[3] || 0),
      sheetRow: index + 2,           // actual sheet row number (1-indexed, skipping header)
    });
  });

  return accounts;
}

// ============================================
// FUNCTION: updateAccount — update tags/Credit
// Only columns C (tags) and D (Credit) are editable
// ============================================
function updateAccount(sheetRow, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CRED_SHEET);

  if (!sheet) {
    return { error: "Sheet named '" + CRED_SHEET + "' not found." };
  }

  const row = parseInt(sheetRow);
  if (isNaN(row) || row < 2) {
    return { error: "Invalid sheetRow: " + sheetRow };
  }

  const updated = [];

  if (updates.tags !== undefined) {
    sheet.getRange(row, 3).setValue(String(updates.tags));  // Column C
    updated.push("tags");
  }

  if (updates.Credit !== undefined) {
    sheet.getRange(row, 4).setValue(Number(updates.Credit)); // Column D
    updated.push("Credit");
  }

  return {
    success:       true,
    sheetRow:      row,
    updatedFields: updated,
  };
}

// ============================================
// FUNCTION: uploadVideoToYouTube (server-side)
// 1. DriveApp se video blob
// 2. YouTube resumable upload init
// 3. Video bytes send
// 4. Thumbnail upload (optional)
// 5. Playlist add (optional)
// ============================================
function uploadVideoToYouTube(body) {
  const fileId       = body.fileId;
  const youtubeToken = body.youtubeToken;
  const metadata     = body.metadata || {};
  const thumbFileId  = body.thumbFileId || null;
  const playlistId   = body.playlistId  || null;

  if (!fileId)       return { error: "fileId missing" };
  if (!youtubeToken) return { error: "youtubeToken missing" };

  // STEP 1: Drive se video blob
  var videoBlob;
  try {
    videoBlob = DriveApp.getFileById(fileId).getBlob();
  } catch (driveErr) {
    return { error: "Drive video access failed: " + driveErr.message };
  }

  const videoSize     = videoBlob.getBytes().length;
  const videoMimeType = videoBlob.getContentType() || "video/mp4";
  Logger.log("Video size: " + videoSize + " bytes, type: " + videoMimeType);

  // STEP 2: YouTube resumable upload init
  const ytMetadata = {
    snippet: {
      title:           metadata.title        || "Untitled Story",
      description:     metadata.description  || "",
      tags:            metadata.tags         || [],
      categoryId:      metadata.categoryId   || "22",
      defaultLanguage: "en",
    },
    status: {
      privacyStatus: metadata.privacyStatus || "private",
    },
  };

  const initUrl =
    "https://www.googleapis.com/upload/youtube/v3/videos" +
    "?uploadType=resumable&part=snippet,status";

  const initResponse = UrlFetchApp.fetch(initUrl, {
    method:  "POST",
    headers: {
      "Authorization":           "Bearer " + youtubeToken,
      "Content-Type":            "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(videoSize),
      "X-Upload-Content-Type":   videoMimeType,
    },
    payload:            JSON.stringify(ytMetadata),
    muteHttpExceptions: true,
  });

  if (initResponse.getResponseCode() !== 200) {
    return {
      error: "YouTube upload init failed (" +
             initResponse.getResponseCode() + "): " +
             initResponse.getContentText().substring(0, 300),
    };
  }

  const uploadUrl = initResponse.getHeaders()["Location"];
  if (!uploadUrl) {
    return { error: "YouTube ne upload URL nahi diya (Location header missing)" };
  }
  Logger.log("YouTube upload URL: " + uploadUrl.substring(0, 80));

  // STEP 3: Video upload
  const uploadResponse = UrlFetchApp.fetch(uploadUrl, {
    method:  "PUT",
    headers: {
      "Content-Type":  videoMimeType,
      "Content-Range": "bytes 0-" + (videoSize - 1) + "/" + videoSize,
    },
    payload:            videoBlob.getBytes(),
    muteHttpExceptions: true,
  });

  const uploadCode = uploadResponse.getResponseCode();
  if (uploadCode !== 200 && uploadCode !== 201) {
    return {
      error: "YouTube video upload failed (" + uploadCode + "): " +
             uploadResponse.getContentText().substring(0, 300),
    };
  }

  const uploadData = JSON.parse(uploadResponse.getContentText());
  const videoId    = uploadData.id;
  const ytLink     = "https://www.youtube.com/watch?v=" + videoId;
  Logger.log("Video uploaded! ID: " + videoId);

  // STEP 4: Thumbnail (optional)
  if (thumbFileId) {
    try {
      const thumbBlob     = DriveApp.getFileById(thumbFileId).getBlob();
      const thumbBytes    = thumbBlob.getBytes();
      const thumbMimeType = thumbBlob.getContentType() || "image/jpeg";

      const thumbUrl =
        "https://www.googleapis.com/upload/youtube/v3/thumbnails/set" +
        "?videoId=" + videoId + "&uploadType=media";

      const thumbRes = UrlFetchApp.fetch(thumbUrl, {
        method:  "POST",
        headers: {
          "Authorization": "Bearer " + youtubeToken,
          "Content-Type":  thumbMimeType,
        },
        payload:            thumbBytes,
        muteHttpExceptions: true,
      });

      if (thumbRes.getResponseCode() !== 200) {
        Logger.log("Thumbnail upload failed (non-fatal): " + thumbRes.getResponseCode());
      } else {
        Logger.log("Thumbnail uploaded successfully");
      }
    } catch (thumbErr) {
      Logger.log("Thumbnail error (non-fatal): " + thumbErr.message);
    }
  }

  // STEP 5: Playlist (optional)
  if (playlistId) {
    try {
      const plRes = UrlFetchApp.fetch(
        "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
        {
          method:  "POST",
          headers: {
            "Authorization": "Bearer " + youtubeToken,
            "Content-Type":  "application/json",
          },
          payload: JSON.stringify({
            snippet: {
              playlistId: playlistId,
              resourceId: { kind: "youtube#video", videoId: videoId },
            },
          }),
          muteHttpExceptions: true,
        }
      );

      if (plRes.getResponseCode() !== 200) {
        Logger.log("Playlist add failed (non-fatal): " + plRes.getResponseCode());
      } else {
        Logger.log("Video added to playlist: " + playlistId);
      }
    } catch (plErr) {
      Logger.log("Playlist error (non-fatal): " + plErr.message);
    }
  }

  return { success: true, videoId: videoId, ytLink: ytLink };
}

// ============================================
// FUNCTION: getAllStories — Sheet1 se sab stories
// ============================================
function getAllStories() {
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data    = sheet.getRange(2, 1, lastRow - 1, 17).getValues();
  const stories = [];

  data.forEach(function(row, index) {
    if (!row[COL.ROW_ID - 1] && !row[COL.TITLE - 1]) return;
    stories.push({
      id:          String(row[COL.ROW_ID - 1]      || ""),
      status:      String(row[COL.STATUS - 1]       || ""),
      category:    String(row[COL.CATEGORY - 1]     || ""),
      title:       String(row[COL.TITLE - 1]        || ""),
      story:       String(row[COL.STORY - 1]        || ""),
      character:   String(row[COL.CHARACTER - 1]    || ""),
      hashtags:    String(row[COL.HASHTAGS - 1]     || ""),
      seoTags:     String(row[COL.SEO_TAGS - 1]     || ""),
      dashStatus:  String(row[COL.DASH_STATUS - 1]  || "pending"),
      videoLink:   String(row[COL.VIDEO_LINK - 1]   || ""),
      thumbLink:   String(row[COL.THUMB_LINK - 1]   || ""),
      reviewNotes: String(row[COL.REVIEW_NOTES - 1] || ""),
      schedule:    String(row[COL.SCHEDULE - 1]     || ""),
      ytLink:      String(row[COL.YT_LINK - 1]      || ""),
      approvedBy:  String(row[COL.APPROVED_BY - 1]  || ""),
      updatedAt:   String(row[COL.UPDATED_AT - 1]   || ""),
      uploadError: String(row[COL.UPLOAD_ERROR - 1] || ""),
      sheetRow:    index + 2,
    });
  });

  return stories;
}

// ============================================
// FUNCTION: getAnalytics
// ============================================
function getAnalytics() {
  const stories = getAllStories();
  const counts = {
    pending: 0, storyboard: 0, uploaded: 0,
    review: 0, approved: 0, scheduled: 0,
    published: 0, publishing: 0, publish_failed: 0,
  };
  const categories = {};

  stories.forEach(function(s) {
    const ds = s.dashStatus || "pending";
    if (counts[ds] !== undefined) counts[ds]++;
    else counts[ds] = 1;
    if (s.category) categories[s.category] = (categories[s.category] || 0) + 1;
  });

  return {
    total:        stories.length,
    statusCounts: counts,
    categories:   categories,
    lastUpdated:  new Date().toISOString(),
  };
}

// ============================================
// FUNCTION: updateStory — Sheet1 row update
// ============================================
function updateStory(rowId, updates) {
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: false, error: "No data in sheet" };

  const colAData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var targetRow  = -1;

  colAData.forEach(function(row, index) {
    if (String(row[0]).trim() === String(rowId).trim()) targetRow = index + 2;
  });

  if (targetRow === -1) {
    const sampleIds = colAData.slice(0, 5).map(function(r) { return String(r[0]); });
    return {
      success: false,
      error: "Row not found: \"" + rowId + "\". First 5 IDs: " + sampleIds.join(", "),
    };
  }

  if (updates.dashStatus   !== undefined) sheet.getRange(targetRow, COL.DASH_STATUS).setValue(String(updates.dashStatus));
  if (updates.videoLink    !== undefined) sheet.getRange(targetRow, COL.VIDEO_LINK).setValue(String(updates.videoLink));
  if (updates.thumbLink    !== undefined) sheet.getRange(targetRow, COL.THUMB_LINK).setValue(String(updates.thumbLink));
  if (updates.reviewNotes  !== undefined) sheet.getRange(targetRow, COL.REVIEW_NOTES).setValue(String(updates.reviewNotes));
  if (updates.schedule     !== undefined) sheet.getRange(targetRow, COL.SCHEDULE).setValue(String(updates.schedule));
  if (updates.ytLink       !== undefined) sheet.getRange(targetRow, COL.YT_LINK).setValue(String(updates.ytLink));
  if (updates.approvedBy   !== undefined) sheet.getRange(targetRow, COL.APPROVED_BY).setValue(String(updates.approvedBy));
  if (updates.uploadError  !== undefined) sheet.getRange(targetRow, COL.UPLOAD_ERROR).setValue(String(updates.uploadError));

  sheet.getRange(targetRow, COL.UPDATED_AT).setValue(new Date().toISOString());

  return {
    success:       true,
    rowId:         rowId,
    targetRow:     targetRow,
    updatedFields: Object.keys(updates),
  };
}

// ============================================
// FUNCTION: addNewColumns — one-time setup
// Run manually from Apps Script editor
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
    17: "Upload_Error",
  };

  Object.entries(newHeaders).forEach(function(entry) {
    const colNum = parseInt(entry[0]);
    const name   = entry[1];
    if (!sheet.getRange(1, colNum).getValue()) {
      sheet.getRange(1, colNum).setValue(name);
    }
  });

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    for (var r = 2; r <= lastRow; r++) {
      if (!sheet.getRange(r, COL.DASH_STATUS).getValue()) {
        sheet.getRange(r, COL.DASH_STATUS).setValue("pending");
      }
    }
  }

  return { success: true, message: "All columns added successfully" };
}

// ============================================
// Helper: JSON response
// ============================================
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// SCHEDULED AUTO-PUBLISH ENGINE
// ============================================
//
// HOW TO SET UP (one time only):
//   1. Open Apps Script editor
//   2. Run setupScheduleTrigger() ONCE manually
//   3. It creates an hourly time-based trigger
//   4. Every hour it calls checkAndPublishScheduled()
//   5. Any story whose schedule time has passed gets
//      automatically uploaded to YouTube
//
// REQUIREMENTS:
//   - Enable "YouTube Data API v3" in Apps Script:
//     Resources → Advanced Google Services → YouTube ON
//   - The Google account running this script must be
//     the same YouTube channel owner
// ============================================

/**
 * Run ONCE from the Apps Script editor to install the hourly trigger.
 * After running, check Edit → Current project's triggers to verify.
 */
function setupScheduleTrigger() {
  // Remove existing triggers for this function to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'checkAndPublishScheduled') {
      ScriptApp.deleteTrigger(t);
      Logger.log('Removed old trigger: ' + t.getUniqueId());
    }
  });

  // Create a new hourly trigger
  ScriptApp.newTrigger('checkAndPublishScheduled')
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log('✅ Hourly trigger set for checkAndPublishScheduled()');
  return { success: true, message: 'Hourly trigger created. Check Edit > Triggers to verify.' };
}

/**
 * Called every hour by the time trigger.
 * Finds all stories with dashStatus="scheduled" whose
 * schedule datetime has passed, and publishes them to YouTube.
 */
function checkAndPublishScheduled() {
  var sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('No stories found.');
    return;
  }

  var now  = new Date();
  var data = sheet.getRange(2, 1, lastRow - 1, 17).getValues();

  Logger.log('checkAndPublishScheduled() running at: ' + now.toISOString());

  var published = 0;
  var skipped   = 0;
  var errors    = 0;

  data.forEach(function(row, index) {
    var rowId      = String(row[COL.ROW_ID - 1]      || '').trim();
    var dashStatus = String(row[COL.DASH_STATUS - 1] || '').trim();
    var scheduleStr= String(row[COL.SCHEDULE - 1]    || '').trim();
    var videoLink  = String(row[COL.VIDEO_LINK - 1]  || '').trim();
    var thumbLink  = String(row[COL.THUMB_LINK - 1]  || '').trim();
    var title      = String(row[COL.TITLE - 1]       || 'Untitled').trim();
    var story      = String(row[COL.STORY - 1]       || '').trim();
    var hashtags   = String(row[COL.HASHTAGS - 1]    || '').trim();
    var seoTags    = String(row[COL.SEO_TAGS - 1]    || '').trim();
    var sheetRow   = index + 2;

    // Only process stories that are "scheduled"
    if (dashStatus !== 'scheduled') {
      return;
    }

    // Must have a schedule datetime
    if (!scheduleStr) {
      Logger.log('[Row ' + sheetRow + '] Scheduled but no schedule datetime — skipping: ' + title);
      skipped++;
      return;
    }

    // Parse the schedule datetime
    var scheduledTime = new Date(scheduleStr);
    if (isNaN(scheduledTime.getTime())) {
      Logger.log('[Row ' + sheetRow + '] Invalid datetime "' + scheduleStr + '" — skipping: ' + title);
      skipped++;
      return;
    }

    // Not yet time — skip
    if (scheduledTime > now) {
      Logger.log('[Row ' + sheetRow + '] Not yet due (' + scheduleStr + ') — skipping: ' + title);
      skipped++;
      return;
    }

    // Must have a video Drive link
    if (!videoLink) {
      Logger.log('[Row ' + sheetRow + '] No video link — cannot publish: ' + title);
      sheet.getRange(sheetRow, COL.UPLOAD_ERROR).setValue('Auto-publish failed: No video Drive link');
      sheet.getRange(sheetRow, COL.DASH_STATUS).setValue('publish_failed');
      sheet.getRange(sheetRow, COL.UPDATED_AT).setValue(new Date().toISOString());
      errors++;
      return;
    }

    Logger.log('[Row ' + sheetRow + '] Publishing: "' + title + '" (scheduled: ' + scheduleStr + ')');

    // Mark as "publishing" immediately to prevent double-trigger
    sheet.getRange(sheetRow, COL.DASH_STATUS).setValue('publishing');
    sheet.getRange(sheetRow, COL.UPDATED_AT).setValue(new Date().toISOString());
    SpreadsheetApp.flush();

    try {
      var result = publishScheduledStory({
        sheetRow:  sheetRow,
        rowId:     rowId,
        title:     title,
        story:     story,
        hashtags:  hashtags,
        seoTags:   seoTags,
        videoLink: videoLink,
        thumbLink: thumbLink,
      });

      if (result.success) {
        sheet.getRange(sheetRow, COL.DASH_STATUS).setValue('published');
        sheet.getRange(sheetRow, COL.YT_LINK).setValue(result.ytLink);
        sheet.getRange(sheetRow, COL.UPLOAD_ERROR).setValue('');
        sheet.getRange(sheetRow, COL.UPDATED_AT).setValue(new Date().toISOString());
        Logger.log('[Row ' + sheetRow + '] ✅ Published: ' + result.ytLink);
        published++;

        // Email notification (optional — comment out if not wanted)
        try {
          var email = Session.getActiveUser().getEmail();
          if (email) {
            GmailApp.sendEmail(
              email,
              '✅ Auto-Published: ' + title,
              'Your scheduled story "' + title + '" was automatically published to YouTube.\n\nLink: ' + result.ytLink
            );
          }
        } catch (mailErr) {
          Logger.log('Email notification failed (non-fatal): ' + mailErr.message);
        }

      } else {
        sheet.getRange(sheetRow, COL.DASH_STATUS).setValue('publish_failed');
        sheet.getRange(sheetRow, COL.UPLOAD_ERROR).setValue(result.error || 'Unknown error');
        sheet.getRange(sheetRow, COL.UPDATED_AT).setValue(new Date().toISOString());
        Logger.log('[Row ' + sheetRow + '] ❌ Failed: ' + result.error);
        errors++;
      }

    } catch (publishErr) {
      sheet.getRange(sheetRow, COL.DASH_STATUS).setValue('publish_failed');
      sheet.getRange(sheetRow, COL.UPLOAD_ERROR).setValue(publishErr.message);
      sheet.getRange(sheetRow, COL.UPDATED_AT).setValue(new Date().toISOString());
      Logger.log('[Row ' + sheetRow + '] ❌ Exception: ' + publishErr.message);
      errors++;
    }
  });

  Logger.log('Done. Published: ' + published + ', Skipped: ' + skipped + ', Errors: ' + errors);
}

/**
 * Internal helper — uploads a single story to YouTube
 * using Apps Script's YouTube advanced service.
 *
 * @param {Object} params - Story details
 * @returns {{ success: boolean, ytLink?: string, error?: string }}
 */
function publishScheduledStory(params) {
  var title      = (params.title     || 'Untitled').substring(0, 100);
  var description= (params.story     || '').substring(0, 5000);
  var videoLink  = params.videoLink;
  var thumbLink  = params.thumbLink  || '';
  var hashtags   = params.hashtags   || '';
  var seoTags    = params.seoTags    || '';

  // Build tags array
  var tags = [];
  if (hashtags) {
    hashtags.split(/\s+/).forEach(function(t) {
      var clean = t.replace(/^#/, '').trim();
      if (clean) tags.push(clean);
    });
  }
  if (seoTags) {
    seoTags.split(',').forEach(function(t) {
      var clean = t.trim();
      if (clean) tags.push(clean);
    });
  }
  tags = tags.slice(0, 30); // YouTube max 30 tags

  // Extract Drive File ID from link
  var fileIdMatch = videoLink.match(/\/d\/([\w-]+)/);
  if (!fileIdMatch) {
    // Try ?id= format
    var idMatch = videoLink.match(/[?&]id=([\w-]+)/);
    if (!idMatch) {
      return { success: false, error: 'Cannot extract Drive file ID from: ' + videoLink };
    }
    fileIdMatch = idMatch;
  }
  var videoFileId = fileIdMatch[1];

  // Download video blob from Drive
  var videoBlob;
  try {
    videoBlob = DriveApp.getFileById(videoFileId).getBlob();
  } catch (e) {
    return { success: false, error: 'Drive video access failed: ' + e.message };
  }

  var videoBytes    = videoBlob.getBytes();
  var videoSize     = videoBytes.length;
  var videoMimeType = videoBlob.getContentType() || 'video/mp4';

  if (videoSize < 1000) {
    return { success: false, error: 'Video file is too small or empty (' + videoSize + ' bytes). Check Drive sharing.' };
  }

  Logger.log('Video size: ' + videoSize + ' bytes, type: ' + videoMimeType);

  // ── YouTube Resumable Upload ──────────────────────────────────
  // NOTE: Uses the script owner's OAuth token automatically
  // (ScriptApp.getOAuthToken()) — no manual token needed
  var oauthToken = ScriptApp.getOAuthToken();

  // Step 1: Init resumable upload session
  var ytMeta = {
    snippet: {
      title:           title,
      description:     description,
      tags:            tags,
      categoryId:      '22', // People & Blogs
      defaultLanguage: 'en',
    },
    status: {
      privacyStatus: 'public', // Published as public immediately
    },
  };

  var initUrl = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';
  var initRes = UrlFetchApp.fetch(initUrl, {
    method: 'POST',
    headers: {
      'Authorization':           'Bearer ' + oauthToken,
      'Content-Type':            'application/json; charset=UTF-8',
      'X-Upload-Content-Length': String(videoSize),
      'X-Upload-Content-Type':   videoMimeType,
    },
    payload:            JSON.stringify(ytMeta),
    muteHttpExceptions: true,
  });

  if (initRes.getResponseCode() !== 200) {
    return {
      success: false,
      error: 'YouTube upload init failed (' + initRes.getResponseCode() + '): ' +
             initRes.getContentText().substring(0, 300),
    };
  }

  var uploadUrl = initRes.getHeaders()['Location'];
  if (!uploadUrl) {
    return { success: false, error: 'YouTube did not return upload URL (Location header missing)' };
  }

  // Step 2: Upload video bytes
  var uploadRes = UrlFetchApp.fetch(uploadUrl, {
    method:  'PUT',
    headers: {
      'Content-Type':  videoMimeType,
      'Content-Range': 'bytes 0-' + (videoSize - 1) + '/' + videoSize,
    },
    payload:            videoBytes,
    muteHttpExceptions: true,
  });

  var uploadCode = uploadRes.getResponseCode();
  if (uploadCode !== 200 && uploadCode !== 201) {
    return {
      success: false,
      error: 'YouTube video upload failed (' + uploadCode + '): ' +
             uploadRes.getContentText().substring(0, 300),
    };
  }

  var uploadData = JSON.parse(uploadRes.getContentText());
  var videoId    = uploadData.id;
  var ytLink     = 'https://www.youtube.com/watch?v=' + videoId;
  Logger.log('Video uploaded! ID: ' + videoId);

  // Step 3: Thumbnail (optional, non-fatal)
  if (thumbLink) {
    try {
      var thumbMatch = thumbLink.match(/\/d\/([\w-]+)/);
      if (thumbMatch) {
        var thumbBlob     = DriveApp.getFileById(thumbMatch[1]).getBlob();
        var thumbBytes    = thumbBlob.getBytes();
        var thumbMimeType = thumbBlob.getContentType() || 'image/jpeg';
        var thumbUrl = 'https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=' + videoId + '&uploadType=media';
        var thumbRes = UrlFetchApp.fetch(thumbUrl, {
          method:  'POST',
          headers: {
            'Authorization': 'Bearer ' + oauthToken,
            'Content-Type':  thumbMimeType,
          },
          payload:            thumbBytes,
          muteHttpExceptions: true,
        });
        if (thumbRes.getResponseCode() === 200) {
          Logger.log('Thumbnail uploaded successfully');
        } else {
          Logger.log('Thumbnail upload failed (non-fatal): ' + thumbRes.getResponseCode());
        }
      }
    } catch (thumbErr) {
      Logger.log('Thumbnail error (non-fatal): ' + thumbErr.message);
    }
  }

  return { success: true, videoId: videoId, ytLink: ytLink };
}
