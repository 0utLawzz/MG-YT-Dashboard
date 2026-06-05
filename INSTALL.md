# Installation Guide

## Requirements

- Node.js & npm
- Google Cloud Project with YouTube Data API v3, Drive API, and Sheets API enabled.

## Setup

```bash
git clone https://github.com/0utLawzz/mg-yt-dashboard.git
cd mg-yt-dashboard
npm install
cp .env.example .env.local
```

Edit `.env.local` to include your `VITE_GOOGLE_CLIENT_ID`.

## Backend Setup

1. Copy the contents of `Code.gs` into a Google Apps Script project bound to your Google Sheet.
2. Deploy as a Web App (Execute as: Me, Access: Anyone).
3. Set the Web App URL in the Settings Drawer inside the frontend UI.

## Run

```bash
npm run dev
```

---

## 👨‍💻 Credits

**By OutLawZ™** | https://www.brandex.pk | net2tara@gmail.com
