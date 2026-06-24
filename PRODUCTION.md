# 🚢 Production & Deployment Guide

> Complete reference for taking **Bright Little Stories — Production Dashboard** from your local machine to a live Vercel deployment with Google Apps Script as the backend.

---

## ✅ Pre-flight Checklist

Before deploying, confirm everything below:

| Item | Check |
|---|---|
| Google Cloud project created | ☐ |
| OAuth2 Client ID configured (Web App) | ☐ |
| Google API Key created & restricted | ☐ |
| Apps Script (`Code.gs`) deployed as Web App | ☐ |
| Script URL copied into `.env` / Settings Drawer | ☐ |
| YouTube Data API v3 enabled in Cloud Console | ☐ |
| Google Sheets API enabled in Cloud Console | ☐ |
| Google Drive API enabled in Cloud Console | ☐ |
| `Cred` sheet exists with correct column order | ☐ |
| `.env` file filled in (never committed) | ☐ |

---

## 🔑 Step 1 — Google Cloud Setup

### 1a. Create a Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project → New Project**
3. Give it a name (e.g. `BLS-Dashboard`)

### 1b. Enable APIs
In **APIs & Services → Library**, enable:
- **YouTube Data API v3**
- **Google Sheets API**
- **Google Drive API**
- **Google Picker API**

### 1c. Create OAuth2 Client ID
1. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Add your domains under **Authorized JavaScript origins**:
   - `http://localhost:5173` (dev)
   - `https://your-vercel-domain.vercel.app` (production)
4. Copy the **Client ID** → this is `VITE_GOOGLE_CLIENT_ID`

### 1d. Create API Key
1. **Create Credentials → API Key**
2. Restrict it:
   - **API Restrictions** → Select: YouTube Data API v3, Sheets API, Drive API, Picker API
   - **Website Restrictions** → add your domain(s)
3. Copy the key → this is `VITE_GOOGLE_API_KEY`

---

## 📋 Step 2 — Google Sheets Setup

### Sheet1 — Stories (columns A–Q)

| Col | Header | Description |
|---|---|---|
| A | `Row_ID` | Unique story ID |
| B | `Status` | Story status |
| C | `Category` | Content category |
| D | `Title` | Story title |
| E | `Story` | Full story text |
| F | `Character` | Character name |
| G | `Hashtags` | Hashtags |
| H | `SEO_Tags` | SEO tags |
| I | `Dashboard_Status` | `pending/storyboard/review/approved/publishing/published` |
| J | `Video_Drive_Link` | Drive video URL |
| K | `Thumbnail_Drive_Link` | Drive thumbnail URL |
| L | `Review_Notes` | Reviewer notes |
| M | `Schedule_DateTime` | ISO datetime for scheduled publish |
| N | `YouTube_Link` | Final YT URL after publish |
| O | `Approved_By` | Approver name |
| P | `Last_Updated` | ISO timestamp of last update |
| Q | `Upload_Error` | Upload error message (if any) |

### Cred Sheet — Accounts (columns A–D)

| Col | Key | Description |
|---|---|---|
| A | `username` | Email / Account login |
| B | `password` | Password |
| C | `tags` | `new` / `verified` / `v-pending` / `used` |
| D | `Credit` | Credit balance (number) |

> ⚠️ **Security**: Keep the Google Sheet sharing set to **Restricted** — do not share publicly.

---

## ⚙️ Step 3 — Apps Script (Code.gs)

1. Open your Google Sheet → **Extensions → Apps Script**
2. Delete any existing code and paste your full `Code.gs`
3. Ensure `doGet` handles all these actions:
   - `getAllStories`
   - `getAnalytics`
   - `updateStory`
   - `getAccounts` ← Required for the Accounts tab
   - `updateAccount` ← Required for inline Credit/Tag edits
4. **Deploy as Web App:**
   - Click **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone** (or restrict to specific Google accounts)
   - Click **Deploy** → copy the **Web App URL**
5. Paste the URL into `.env` as `VITE_SCRIPT_URL` or into the app's **Settings Drawer**

### `getAccounts` function to add to Code.gs

```javascript
function getAccounts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cred");
  if (!sheet) return { error: "Sheet 'Cred' not found" };

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const accounts = [];

  data.forEach((row, index) => {
    if (!row[0] && !row[1]) return;
    accounts.push({
      username: String(row[0] || ""),
      password: String(row[1] || ""),
      tags:     String(row[2] || ""),
      Credit:   Number(row[3] || 0),
      sheetRow: index + 2,
    });
  });

  return accounts;
}
```

### `updateAccount` function to add to Code.gs

```javascript
function updateAccount(sheetRow, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cred");
  if (!sheet) return { error: "Sheet 'Cred' not found" };

  const row = parseInt(sheetRow);
  if (isNaN(row) || row < 2) return { error: "Invalid sheetRow: " + sheetRow };

  if (updates.tags   !== undefined) sheet.getRange(row, 3).setValue(String(updates.tags));
  if (updates.Credit !== undefined) sheet.getRange(row, 4).setValue(Number(updates.Credit));

  return { success: true, sheetRow: row, updatedFields: Object.keys(updates) };
}
```

### Add these inside `doGet` (inside the `try` block):

```javascript
if (action === "getAccounts")  return jsonResponse(getAccounts());

if (action === "updateAccount") {
  const sheetRow   = e.parameter.sheetRow;
  const updatesStr = e.parameter.updates;
  if (!sheetRow)   return jsonResponse({ error: "sheetRow missing" });
  if (!updatesStr) return jsonResponse({ error: "updates missing" });
  let updates;
  try { updates = JSON.parse(updatesStr); }
  catch (pe) { return jsonResponse({ error: "updates JSON invalid: " + pe.message }); }
  return jsonResponse(updateAccount(sheetRow, updates));
}
```

---

## 💻 Step 4 — Local Development

```bash
git clone https://github.com/0utLawzz/MG-YT-Dashboard.git
cd MG-YT-Dashboard
npm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_API_KEY=your_api_key_here
VITE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxxxx
VITE_DRIVE_FOLDER_ID=optional_folder_id
VITE_YOUTUBE_PLAYLIST_ID=optional_playlist_id
```

```bash
npm run dev
# → http://localhost:5173
```

---

## 🌐 Step 5 — Deploy to Vercel

### Option A — One command (recommended)
```bash
npm run deploy
# Runs: npm run build && vercel --prod
```

### Option B — Manual
```bash
npm run build
vercel --prod
```

### Option C — Vercel Dashboard (GitHub auto-deploy)
1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import the `MG-YT-Dashboard` GitHub repository
3. Set **Framework Preset** to **Vite**
4. Under **Environment Variables**, add all values from your `.env`
5. Click **Deploy**

Every future `git push origin main` will trigger an automatic redeploy.

### Vercel Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | ✅ | OAuth2 Client ID |
| `VITE_GOOGLE_API_KEY` | ✅ | Google API Key |
| `VITE_SCRIPT_URL` | ✅ | Apps Script Web App URL |
| `VITE_YOUTUBE_CHANNEL_ID` | ✅ | YouTube channel ID |
| `VITE_DRIVE_FOLDER_ID` | Optional | Drive upload folder |
| `VITE_YOUTUBE_PLAYLIST_ID` | Optional | Auto-add playlist |

---

## 🔒 Security Hardening

- **Restrict your API Key** in Google Cloud Console to specific APIs and your Vercel domain only.
- **Never commit `.env`** — it's in `.gitignore`. Use Vercel's encrypted env vars instead.
- **Restrict the Google Sheet** — Set sharing to "Restricted" so only authorised Google accounts can access it. The `Cred` sheet contains passwords.
- **Apps Script access** — Deploy with "Who has access: Anyone" only if the OAuth flow is protecting the app. Alternatively restrict to your organisation.
- **OAuth Consent Screen** — Set the app to "Internal" (Google Workspace) or verify it with Google to remove the "unverified app" warning.

---

## 🔄 Redeploying / Updating

### Frontend changes
```bash
git add .
git commit -m "feat: describe your change"
git push origin main
# Vercel auto-deploys from main
```

### Apps Script changes
1. Edit `Code.gs` in the Apps Script editor
2. Click **Deploy → Manage Deployments**
3. Edit your active deployment → change **Version** to **New version**
4. Click **Deploy**
5. The Web App URL stays the same — no frontend change needed.

---

## 📈 Monitoring & Logs

| Tool | What to check |
|---|---|
| **Vercel Dashboard → Deployments** | Build logs, function errors |
| **Vercel Analytics** | Page views, performance |
| **Apps Script Editor → Executions** | GAS function errors, execution time |
| **Browser DevTools → Console** | `[BLS-API]` / `[BLS-STORIES]` / `[BLS-ACCOUNTS]` prefixed logs |
| **Google Cloud Console → Quotas** | API usage limits |

---

## 🆘 Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Unknown action: getAccounts` | `getAccounts` not in `doGet` | Add it inside the `try` block (see Step 3) |
| `Unknown action: updateAccount` | `updateAccount` not in `doGet` | Add it inside the `try` block |
| Accounts tab shows empty | `Cred` sheet name mismatch | Confirm sheet tab is named exactly `Cred` |
| Auth loop / no sign-in button | Wrong Client ID or domain not in OAuth origins | Check Google Cloud → Credentials → Authorized JS origins |
| `HTML instead of JSON` error | Apps Script not deployed / wrong URL | Redeploy the Apps Script as Web App |
| Videos not uploading | YouTube quota exceeded | Check Google Cloud → YouTube Data API v3 → Quotas |

---

**You're all set — your Bright Little Stories dashboard is production-ready! 🎬**

*By OutLawZ™ — https://www.brandex.pk*
