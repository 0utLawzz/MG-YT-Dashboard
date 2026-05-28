# 🎬 Bright Little Stories — Production Dashboard

> **v1.0.0** · YouTube content pipeline manager for kids' story channels.  
> Google Sheets backend · OAuth2 auth · Drive-to-YouTube publish engine · NeoBrutalism UI

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev)

---

## 📋 What is This?

A full-stack production dashboard for managing a YouTube kids' story channel — from raw story scripts to live YouTube uploads. No traditional backend or database needed; **Google Sheets is the database**, **Google Apps Script is the API**, and **Google Drive is the file store**.

The entire pipeline is:

```
Story in Sheet → Storyboard (review + attach assets) → Review/Approve → Publish to YouTube
```

---

## ✨ Features

| Tab | What it does |
|-----|-------------|
| **Dashboard** | KPI cards, pipeline status counts, bar charts, donut chart |
| **Stories** | Full story table with search, filter by status, push to storyboard |
| **Storyboard** | Review story content, attach video + thumbnail Drive links, upload direct to Drive |
| **Review** | Approve or edit stories before publish |
| **Publish** | One-click Drive → YouTube upload with progress bar, playlist select, SEO metadata, schedule |
| **Analytics** | Story distribution charts, category breakdown |

---

## 🏗️ Architecture

```
Browser (React SPA)
    │
    ├── Google OAuth2 (Identity Services)
    │       └── Scopes: YouTube upload, Drive, userinfo.email
    │
    ├── Google Apps Script (REST-like API)
    │       └── getAllStories / updateStory / getAnalytics
    │               └── Google Sheets (Database)
    │
    ├── Google Drive API (direct from browser)
    │       └── File upload (chunked resumable)
    │       └── File download for YouTube upload
    │
    └── YouTube Data API v3
            └── Resumable video upload
            └── Thumbnail set
            └── Playlist add
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/mg-yt-dashboard.git
cd mg-yt-dashboard
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

> Get your Client ID from [Google Cloud Console](https://console.cloud.google.com/) →  
> APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application)

### 3. Google Cloud Setup (one-time)

Enable these APIs in your GCP project:
- YouTube Data API v3
- Google Drive API
- Google Sheets API

Add your domain to **Authorized JavaScript Origins**:
- `http://localhost:5173` (dev)
- `https://your-app.vercel.app` (production)

### 4. Google Apps Script Setup

Open your Google Sheet → Extensions → Apps Script → paste the contents of `Code.gs`.

Deploy as **Web App**:
- Execute as: **Me**
- Who has access: **Anyone**

Copy the deployment URL. Either:
- Set it in `.env.local` as `VITE_SCRIPT_URL=https://script.google.com/...`
- Or paste it in the app's ⚙️ Settings drawer at runtime

### 5. Run Locally

```bash
npm run dev
```

Open `http://localhost:5173`

---

## 🔧 Settings Drawer

All config can be changed at runtime via the ⚙️ button in the header — no redeploy needed:

| Setting | Description |
|---------|-------------|
| **Google Sheet Script URL** | Apps Script web app URL (your backend) |
| **Google Client ID** | OAuth client for YouTube + Drive login |
| **Drive Folder ID** | Default folder for video/thumbnail uploads |
| **YouTube Channel ID** | Your channel's UC... ID |
| **YouTube Playlist ID** | Optional — auto-adds uploaded videos to this playlist |

Settings are saved to `localStorage` under the key `bls_config`.

---

## 📂 Project Structure

```
src/
├── components/
│   ├── Analytics/          # Analytics tab charts
│   ├── common/             # ErrorBoundary
│   ├── Dashboard/          # KPI cards, pipeline bar, donut chart
│   ├── Publish/            # PublishForm — Drive → YouTube engine
│   ├── Review/             # ReviewCard — approve/reject panel
│   ├── SheetImport/        # (placeholder for future import UI)
│   ├── Stories/            # StoryTable with search + filter
│   ├── Storyboard/         # Asset attachment + Drive upload
│   ├── Header.jsx          # Top nav — refresh, settings, signout
│   ├── SettingsDrawer.jsx  # Slide-in config panel
│   └── Tabs.jsx            # Tab navigation
│
├── context/
│   ├── AuthContext.jsx     # Google OAuth2 token lifecycle
│   └── ThemeContext.jsx    # Dark/light/glass/neon themes
│
├── hooks/
│   ├── useAuth.js          # Auth context consumer hook
│   └── useStories.js       # Stories state, KPIs, pipeline counts
│
├── lib/
│   ├── api.js              # fetchStories, updateStory, Drive link helpers
│   ├── api/client.js       # fetchWithRetry — retry + GAS redirect handling
│   └── config/env.js       # Central config (localStorage → .env fallback)
│
├── services/
│   ├── publishService.js   # 7-stage Drive → YouTube publish pipeline
│   └── upload/
│       └── driveUpload.js  # Chunked resumable Drive upload
│
└── styles/
    ├── globals.css
    └── themes/             # dark, light, glass, midnight, neon
```

---

## 🔑 Google Sheets Schema

The Apps Script expects columns **A through Q** in `Sheet1`:

| Col | Field | Description |
|-----|-------|-------------|
| A | `Row_ID` | Unique story identifier |
| B | `Status` | Original pipeline status |
| C | `Category` | Story category/genre |
| D | `Title` | Story title |
| E | `Story` | Full story text |
| F | `Character` | Character description |
| G | `Hashtags` | Space-separated hashtags |
| H | `SEO_Tags` | Comma-separated SEO tags |
| I | `Dashboard_Status` | Dashboard workflow status (see below) |
| J | `Video_Drive_Link` | Google Drive video file link |
| K | `Thumbnail_Drive_Link` | Google Drive thumbnail link |
| L | `Review_Notes` | Editor/director notes |
| M | `Schedule_DateTime` | ISO datetime for scheduled publish |
| N | `YouTube_Link` | YouTube video URL after publish |
| O | `Approved_By` | Approver name |
| P | `Last_Updated` | ISO timestamp of last change |
| Q | `Upload_Error` | Error message if upload failed |

### Dashboard Status Flow

```
pending → storyboard → review → approved → publishing → published
                                                       ↘ scheduled
                                              publish_failed (retryable)
```

Run `addNewColumns()` from Apps Script editor once to set up columns I–Q on an existing sheet.

---

## 📦 Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Build tool + dev server |
| Chart.js + react-chartjs-2 | 4.x / 5.x | Dashboard charts |
| lucide-react | 1.x | Icons |
| sonner | 2.x | Toast notifications |
| vite-plugin-compression | — | Gzip build output |

No backend server. No database. No API keys in production beyond the Google OAuth Client ID.

---

## 🚢 Deployment (Vercel)

```bash
# One-time setup
npm i -g vercel
vercel

# Production deploy
vercel --prod
```

Set `VITE_GOOGLE_CLIENT_ID` in Vercel's Environment Variables dashboard.

The included `vercel.json` handles SPA routing (all paths → `index.html`) and sets asset cache headers.

> **Why Vercel over GitHub Pages?**  
> GitHub Pages doesn't support SPA routing rewrites natively, and environment variables require build-time workarounds. Vercel handles both out of the box.

---

## 🛠️ Available Scripts

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint check
npm run test      # Run Vitest unit tests
```

---

## 📝 License

Private project — Bright Little Stories channel.
