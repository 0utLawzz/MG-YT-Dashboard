# 📖 User Guide — MG-YT-Dashboard

## Overview

The dashboard follows a linear production pipeline:

```
Stories → Storyboard → Review → Publish → Analytics
```

---

## 🗂️ Stories Tab

- View all stories loaded from Google Sheets
- Search by title, category, or ID
- Filter by pipeline status
- Click **"Push to Storyboard"** to move a story into production

---

## 🎬 Storyboard Tab

### Selecting a Story

Use the dropdown to pick a story assigned to storyboard status.

### Reading Content

View the story text, character brief, hashtags, and SEO tags.

### Editor Notes

Add director / voice-over notes — auto-saved with debounce.

### Attaching Assets (Video + Thumbnail)

There are **3 ways** to attach assets:

| Method | How |
|---|---|
| **Paste URL** | Copy a Google Drive share link and paste into the input |
| **Pick from Drive** | Click the 📂 **Drive** button to open the native Google Drive Picker. Browse and select a file directly. |
| **Upload local file** | Click the ⬆️ **Upload** button to select a local file. It uploads to your Google Drive folder and generates a share link. |

> **Important:** The file must be shared "Anyone with link" for previews to work in the Review tab.

Clicking **💾 Save Assets** saves the links to the Google Sheet. If **both** video and thumbnail are provided, the story is **automatically moved to the Review queue**.

---

## ✅ Review Tab

Stories that have both assets attached appear here.

### Previewing Assets

- **Video** plays directly in an embedded iframe (Google Drive stream)
- **Thumbnail** displays as an image
- If a file is blocked (not shared publicly), a fallback shows with a "Open in Drive" link

### Actions

| Button | Action |
|---|---|
| **✅ Approve** | Moves story to "Approved" — ready for publishing |
| **↩ Reject** | Sends story back to Storyboard for fixes |
| **📝 Edit Notes** | Add or edit review notes for the story |

---

## 🚀 Publish Tab

Approved stories appear here for YouTube publishing.

- **Schedule**: Set a date/time for the video
- **Publish Now**: Starts the Drive → YouTube upload process
- Progress is shown in a 7-stage progress bar

---

## 📈 Analytics Tab

Real-time pipeline overview:

| Section | What it Shows |
|---|---|
| **8 KPI Cards** | Total, Published, In Progress, Completion Rate, In Review, Approved, Scheduled, Storyboard |
| **Pipeline Bar Chart** | Stories by status |
| **Category Donut** | Stories per category |
| **Asset Coverage** | % of stories with video / thumbnail / both |
| **Activity Timeline** | Stories updated per week (line chart) |
| **All Stories Table** | Full list with asset status |
| **Recently Updated** | Last 5 stories modified |

---

## ⚙️ Settings Drawer

Click the **⚙️ Settings** icon (top right) to configure:

- Google Sheet / Apps Script URL
- YouTube Channel ID
- Drive Folder ID
- Theme selection (Dark, Light, Glass, Midnight, Neon)

All settings are saved to `localStorage` and override `.env` values — no redeploy needed.

---

## 🔑 Authentication

Click **"Sign in with Google"** on the login screen.

The OAuth flow grants:
- Google Drive access (for file upload and picker)
- YouTube access (for video publishing)
- No Sheets access needed client-side (handled by Apps Script)

---

## 🧑‍💻 NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Local dev server (`http://localhost:5173`) |
| `npm run build` | Build production bundle to `/dist` |
| `npm run preview` | Preview the `/dist` bundle locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest test suite |
| `npm run deploy` | `npm run build && vercel --prod` |
