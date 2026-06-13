# Video Processing Feature Setup

The **Process Video** button in the Review tab allows you to:
- ✂️ Trim trailing seconds from videos
- 🏷️ Add logo overlays with customizable position and size

## Requirements

This feature requires a **Flask backend server** to handle video processing with FFmpeg.

### Backend Server Location

The Flask backend is located at: `E:\Pythons\Magic Video Addon\backend\app.py`

### Setup Instructions

1. **Navigate to the backend directory:**
   ```bash
   cd E:\Pythons\Magic Video Addon\backend
   ```

2. **Install dependencies (if not already done):**
   ```bash
   pip install flask flask-cors python-socketio flask-socketio ffmpeg-python google-auth-oauthlib google-auth-httplib2 google-api-python-client
   ```

3. **Start the Flask server:**
   ```bash
   python app.py
   ```
   
   The server should start on `http://localhost:5000` by default.

4. **Verify the server is running:**
   - Open `http://localhost:5000` in your browser
   - You should see a confirmation or the Flask welcome page

### Using the Feature

Once the Flask backend is running:

1. Navigate to the **Review** tab in the dashboard
2. Click the **Process** button on any story
3. Adjust the settings:
   - **Trim Trailing Seconds** (0-30s): Remove seconds from the end of the video
   - **Add Logo Overlay**: Toggle logo overlay on/off
   - **Logo Position**: Choose from Top Left, Top Right, Bottom Left, Bottom Right, or Center
   - **Logo Size** (20-200px): Adjust the size of the logo
4. Click **Process Video** to start processing
5. Monitor the progress bar as the video is processed
6. Once complete, the video link is automatically updated in the story

### Troubleshooting

**Error: "Cannot connect to backend at http://localhost:5000"**
- Make sure the Flask server is running (see Setup Instructions above)
- Check that the server is on port 5000
- Try accessing `http://localhost:5000` in your browser to verify

**Error: "Request timeout (60s)"**
- The video is too large or your internet connection is slow
- Try with a smaller video file
- Increase the timeout in `src/hooks/useVideoProcessor.js` if needed

**Error: "Processing complete but no video URL returned"**
- Check the Flask server logs for errors
- Ensure the output video was successfully uploaded to Google Drive
- Verify your Google Drive authentication is still valid

### How It Works

1. You select a story from the Review queue
2. You configure processing options (trim, logo)
3. The React app sends a request to the Flask backend with:
   - Original video URL (from Google Drive)
   - Processing settings (trim seconds, logo settings)
4. Flask backend:
   - Downloads the video from Google Drive
   - Uses FFmpeg to process it (trim, add logo)
   - Uploads the processed video back to Google Drive
   - Returns the new video URL
5. The dashboard updates the story with the new processed video URL

### Architecture

- **Frontend**: React app (`src/components/Review/ProcessVideoModal.jsx`)
- **Hook**: `src/hooks/useVideoProcessor.js` - manages API communication
- **Backend**: Flask server (`E:\Pythons\Magic Video Addon\backend\app.py`) - handles FFmpeg processing
- **API Endpoint**: `POST /api/process` - processes video and returns new URL
