# Changelog

All notable changes to MG-YT-Dashboard.

---

## [1.1.0] — 2026-06-15

### Added
- **Google Drive Picker** button on Storyboard asset inputs — native Drive file browser via Picker API
- `VITE_GOOGLE_API_KEY` environment variable for Picker API developer key
- `GOOGLE_API_KEY` added to `src/lib/config/env.js`
- `gapi.js` script loaded in `index.html` for Drive Picker support
- Analytics: **Activity Timeline** line chart (stories updated per week)
- Analytics: **Asset Coverage** section with progress bars (video %, thumbnail %, both %)
- Analytics: **4 new KPI cards** — In Review, Approved, Scheduled, Storyboard (8 total)
- Analytics: Dynamic chart label colors (theme-aware, no more white-on-white)
- Review Tab: **iframe video preview** using Drive `/preview` endpoint (streams properly)
- Review Tab: **Placeholder 16:9 boxes** shown even with no assets linked
- Review Tab: `preview-open-link` styled "Open in Drive" links below each preview
- `npm run deploy` script — runs `npm run build && vercel --prod`

### Fixed
- Review Tab: video preview was using `export=download` which browsers block — fixed to iframe embed
- Review Tab: thumbnail not rendering inside 16:9 aspect-ratio box
- Review Tab: text visibility — `review-detail-text`, `review-notes-text` now use `var(--text)` not `var(--dim)`
- Analytics: chart axis labels and titles now use theme-aware color (visible on light theme)
- Analytics: table header color fixed to `var(--text)` with opacity

### Removed
- `src/hooks/useVideoProcessor.js` — Flask socket.io hook (Flask backend no longer supported)
- `src/components/Review/ProcessVideoModal.jsx` — Flask video processing modal
- `src/components/Review/ProcessVideoModal.css` — Flask modal styles
- `VIDEO_PROCESSING_SETUP.md` — Flask backend setup guide
- `socket.io-client` npm dependency
- "Process Video" (Zap) button from Review card header

### Changed
- Storyboard: "Attach Drive Assets" description updated to mention all 3 methods
- `.env.example` — expanded with all 6 variables and setup instructions
- `README.md` — complete rewrite with Vercel secrets table, Drive Picker docs, NPM scripts
- `INSTALL.md` — rewritten with full Vercel deploy instructions and API enabling guide
- `GUIDE.md` — rewritten with Drive Picker usage, all tab workflows
- `FEATURES.md` — updated with all v1.1.0 features
- `package.json` version bumped to `1.1.0`

---

## [1.0.0] — 2026-06 (Initial)

### Added
- Full pipeline UI: Story → Storyboard → Review → Publish
- Google OAuth2 authentication
- Google Apps Script Web App backend
- Drive → YouTube resumable upload engine
- Dashboard with KPI cards, bar chart, donut chart
- Multi-theme support (Dark, Light, Glass, Midnight, Neon)
- Settings Drawer for runtime configuration
- Vercel deployment with `vercel.json` SPA routing
