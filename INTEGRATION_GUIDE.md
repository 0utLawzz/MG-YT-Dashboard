# 🎬 Video Processing Integration Guide

## Overview
Your MG-YT-Dashboard now integrates with the Flask video processing backend (from Magic Video Addon). The workflow is:

1. **Review Stage**: Reviewer sees video + metadata in Review panel
2. **Process Button**: Click "Process" to trim, add logo, customize
3. **Modal Settings**: Choose trim seconds, logo position & size
4. **Auto-Upload**: Processed video uploads to Drive automatically
5. **Dashboard Update**: Video link updates in story

---

## 🚀 Setup Instructions

### Step 1: Install Flask Backend Dependencies

```bash
cd "E:\Pythons\Magic Video Addon\backend"
pip install -r requirements.txt
```

### Step 2: Configure Flask Assets

Place your logo file in the backend/assets folder:
```
E:\Pythons\Magic Video Addon\backend\assets\
├── logo.png          # Your watermark/logo (required)
├── endscreen.mp4     # Optional endscreen video
└── client_secrets.json # Google Drive OAuth (auto-generated)
```

### Step 3: Start Flask Backend

```bash
cd "E:\Pythons\Magic Video Addon\backend"
python app.py
```

Flask will run on **http://localhost:5000**

### Step 4: Start React Dashboard

```bash
cd "E:\Pythons\MG-YT-Dashboard"
npm run dev
```

React will run on **http://localhost:5173**

---

## 📋 Workflow

### 1. Upload Video to Drive (Storyboard)
- Upload video and thumbnail to Drive
- Story moves to "review" status

### 2. Review & Approve
- Reviewer checks video, title, tags, etc.
- If OK, clicks **"Process"** button (new)

### 3. Process Video Modal
- **Trim**: Adjust trailing seconds (0-30s)
- **Logo**: Enable/disable overlay
- **Position**: Choose corner or center placement
- **Size**: Adjust logo size (20-200px)
- Click **"Process Video"** button

### 4. Processing Status
- Real-time progress bar shows:
  - Download: Video from Drive
  - Process: Apply trim + logo
  - Upload: Re-upload to Drive
  - Completion: ~2-5 minutes per video

### 5. Auto-Update
- Processed video URL updates in story
- Reviewer can still:
  - Download processed video
  - Approve for publishing
  - Or process again with different settings

---

## 🔗 API Integration

### Process Video Endpoint

**URL**: `POST http://localhost:5000/api/process`

**Request**:
```json
{
  "videoLink": "https://drive.google.com/file/d/...",
  "trimSeconds": 3,
  "logoEnabled": true,
  "logoPosition": "bottom-right",
  "logoSize": 80
}
```

**Response**:
```json
{
  "processedVideoUrl": "https://drive.google.com/file/d/..."
}
```

**Positions**: `top-left`, `top-right`, `bottom-left`, `bottom-right`, `center`

---

## 🔧 Configuration

### Environment Variables (Optional)

Create `.env` in React project:
```env
REACT_APP_FLASK_URL=http://localhost:5000
```

### Flask Configuration

Flask runs with CORS enabled for all origins (safe for local dev).

Edit `E:\Pythons\Magic Video Addon\backend\app.py` line 33 to restrict:
```python
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
```

---

## 🐛 Troubleshooting

### Video Processing Hangs
- Check FFmpeg is installed: `ffmpeg -version`
- Check Flask console for errors
- Ensure temp folder exists: `backend/temp/`

### Upload to Drive Fails
- Verify Google OAuth credentials: `backend/client_secrets.json`
- Check Drive file sharing permissions
- Ensure video isn't too large (>1GB)

### Thumbnail Not Displaying
- Ensure thumbnail file is shared "Anyone with link"
- Clear browser cache and reload

### Process Button Not Showing
- Install socket.io-client: `npm install socket.io-client`
- Restart React dev server: `npm run dev`

---

## 📝 Notes

- Processing time depends on video resolution and trim/logo settings
- Processed videos are in temp folder + Drive backup
- Original videos remain unchanged
- Multiple videos can't process simultaneously (queue-based)

---

## Next Steps

1. ✅ Start Flask backend
2. ✅ Start React dashboard
3. ✅ Upload test video in Storyboard
4. ✅ Move to Review
5. ✅ Click "Process" button
6. ✅ Configure settings and process
7. ✅ Verify video link updates

Good luck! 🚀
