# ✨ Features — MG-YT-Dashboard v1.1.0

## Core Pipeline

- ✅ **Story Pipeline**: pending → storyboard → review → approved → publishing → published
- ✅ **Google Sheets Backend**: All data stored in Google Sheets via Apps Script Web App
- ✅ **Google OAuth2 Authentication**: Browser-side login using Google Identity Services
- ✅ **Real-time State Updates**: Local state syncs after every Sheet write

## Storyboard Tab

- ✅ **Drive URL Paste**: Manually paste Google Drive share links for video/thumbnail
- ✅ **Google Drive Picker**: Native Drive file picker — browse and select files directly
- ✅ **Local File Upload**: Upload video/image from your device → auto-uploads to Drive
- ✅ **Auto-route to Review**: Saving both video + thumbnail automatically moves story to Review
- ✅ **Editor Notes**: Production notes with auto-save debounce (300ms)

## Review Tab

- ✅ **Drive Video Preview**: Embedded iframe using Drive's `/preview` endpoint (streams properly)
- ✅ **Thumbnail Preview**: `export=view` image preview with proper 16:9 aspect ratio box
- ✅ **Placeholder Boxes**: Empty 16:9 placeholder shown even when no asset is linked
- ✅ **Fallback on Block**: Graceful fallback with "Open in Drive" link for blocked files
- ✅ **Approve / Reject**: Move stories to approved or back to storyboard
- ✅ **Editor Notes**: Add/edit review notes per story

## Publish Tab

- ✅ **Drive → YouTube Upload**: 7-stage chunked resumable upload engine
- ✅ **Upload Progress Bar**: Real-time upload progress display
- ✅ **Schedule Videos**: Set publish date/time
- ✅ **Metadata Prefill**: Title, description, tags auto-filled from story data

## Analytics Tab

- ✅ **8 KPI Cards**: Total, Published, In Progress, Completion Rate, In Review, Approved, Scheduled, Storyboard
- ✅ **Pipeline Bar Chart**: Stories count per status (color-coded)
- ✅ **Category Breakdown Donut**: Stories per category (with dynamic color palette)
- ✅ **Activity Timeline**: Line chart of stories updated per week
- ✅ **Asset Coverage**: Video %, Thumbnail %, Both Assets % with progress bars
- ✅ **Missing Assets Alert**: Count of stories without full assets
- ✅ **All Stories Table**: Sortable quick-view with asset indicators
- ✅ **Recently Updated**: Last 5 modified stories with timestamp

## Dashboard

- ✅ **KPI Overview**: Summary cards on pipeline status
- ✅ **Pipeline Chart**: Bar chart of story distribution
- ✅ **Category Chart**: Donut chart breakdown
- ✅ **All Stories Quick View**: Table with video/thumb/schedule columns

## Theming

- ✅ **5 Themes**: Dark (default), Light, Glass, Midnight, Neon
- ✅ **Theme Context**: All charts re-render with correct label colors on theme switch
- ✅ **CSS Variables**: All colors via CSS custom properties for easy customization

## Developer Experience

- ✅ **Vite 8**: Fast HMR development server
- ✅ **Lazy Loading**: All tab components lazy-loaded with Suspense
- ✅ **Structured Logging**: Prefixed console logs for all API and data operations
- ✅ **Retry Logic**: 3-retry exponential backoff for all API calls
- ✅ **ESLint**: Configured with react-hooks and react-refresh plugins
- ✅ **Vitest**: Test framework configured (vitest.setup.js)
- ✅ **Deploy Script**: `npm run deploy` builds and deploys to Vercel in one step

## Removed in v1.1.0 (Legacy Flask Tool)

- ❌ ~~Video Processing Modal~~ — required external Flask + FFmpeg server
- ❌ ~~useVideoProcessor hook~~ — socket.io connection to Flask
- ❌ ~~socket.io-client dependency~~ — removed from package.json
- ❌ ~~VIDEO_PROCESSING_SETUP.md~~ — outdated Flask setup guide
