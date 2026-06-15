# 📦 Installation Guide — MG-YT-Dashboard

## Prerequisites

- Node.js 18+ and npm 9+
- A Google account with access to Google Cloud Console
- A Google Sheet with the `Code.gs` Apps Script deployed

---

## Step 1 — Clone & Install

```bash
git clone https://github.com/0utLawzz/MG-YT-Dashboard.git
cd MG-YT-Dashboard
npm install
```

---

## Step 2 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Where to Get |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 |
| `VITE_GOOGLE_API_KEY` | Google Cloud Console → APIs & Services → Credentials → API Keys |
| `VITE_SCRIPT_URL` | Google Apps Script → Deploy → Web App → URL |
| `VITE_YOUTUBE_CHANNEL_ID` | YouTube Studio → Customization → Channel URL |
| `VITE_DRIVE_FOLDER_ID` | Google Drive → Open folder → copy ID from URL |
| `VITE_YOUTUBE_PLAYLIST_ID` | YouTube Studio → Playlists (optional) |

### Required Google APIs to Enable

In Google Cloud Console → APIs & Services → Library, enable:
- ✅ Google Drive API
- ✅ YouTube Data API v3
- ✅ Google Picker API *(for Drive Picker button)*
- ✅ Google Sheets API *(optional, used by Apps Script)*

### OAuth 2.0 Setup

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** → Web application
3. Add to **Authorized JavaScript origins**:
   - `http://localhost:5173` (for local dev)
   - `https://your-project.vercel.app` (for production)
4. Copy the **Client ID** to `VITE_GOOGLE_CLIENT_ID`

### API Key Setup

1. Create an **API Key** in Credentials
2. Click **Restrict Key** → HTTP referrers → add your domains
3. Restrict to APIs: **Drive API**, **YouTube Data API v3**, **Picker API**
4. Copy the key to `VITE_GOOGLE_API_KEY`

---

## Step 3 — Deploy Google Apps Script

1. Open your Google Sheet
2. Extensions → Apps Script
3. Paste the contents of `Code.gs` from this repo
4. Click **Deploy** → **New Deployment**
5. Type: **Web App** | Execute as: **Me** | Access: **Anyone**
6. Copy the **Web App URL** → paste to `VITE_SCRIPT_URL` in `.env`

---

## Step 4 — Run Locally

```bash
npm run dev
```

Opens at `http://localhost:5173`

---

## Step 5 — Deploy to Vercel

### One-command deploy:
```bash
npm run deploy
# Runs: npm run build && vercel --prod
```

### Or manually:
```bash
npm run build
vercel --prod
```

### Vercel Environment Variables

In **Vercel Dashboard → Project → Settings → Environment Variables**, add all 6 variables from your `.env` file:

| Variable | Environment |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Production, Preview, Development |
| `VITE_GOOGLE_API_KEY` | Production, Preview, Development |
| `VITE_SCRIPT_URL` | Production, Preview, Development |
| `VITE_YOUTUBE_CHANNEL_ID` | Production |
| `VITE_DRIVE_FOLDER_ID` | Production |
| `VITE_YOUTUBE_PLAYLIST_ID` | Production (optional) |

After adding variables, **redeploy** the project.

---

## Runtime Configuration (No Redeploy)

Click the **⚙️ Settings** icon in the top-right of the dashboard. You can update URLs and IDs at runtime — they're saved to localStorage and override the `.env` values without redeploying.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Stories failed to load" | Check `VITE_SCRIPT_URL` is correct and Apps Script is deployed |
| "Sign in with Google" fails | Check `VITE_GOOGLE_CLIENT_ID` and domain is in OAuth origins |
| Drive Picker doesn't open | Check `VITE_GOOGLE_API_KEY` is set and Picker API is enabled |
| Video preview blocked | File must be shared "Anyone with link" in Google Drive |
| Thumbnail not showing | File must be shared "Anyone with link" in Google Drive |
