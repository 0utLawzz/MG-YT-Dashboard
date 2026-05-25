# 🌟 Bright Little Stories Dashboard (Google Sheets Edition)

Welcome to your modernized **Bright Little Stories** dashboard! This app is a professional command center designed to manage story creation from draft to YouTube release.

It uses a **Google Sheets + Google Apps Script** backend, which means it's fast, simple, and requires no database setup.

---

## 🚀 Quick Start (Running the App)

If you have the code on your computer, follow these 3 simple steps to start:

1. **Open your Terminal** (like Command Prompt or PowerShell).
2. **Move to this folder**:
   ```powershell
   cd E:\Pythons\MG-YT-Dashboard
   ```
3. **Install dependencies** (first time only):
   ```powershell
   npm install
   ```
4. **Start the app**:
   ```powershell
   npm run dev
   ```
5. **Open your browser**: Go to `http://localhost:5173`. You should see your dashboard!

---

## 🏗️ What's Under the Hood? (The Magic Parts)

### Tech Stack
- **Frontend**: React + Vite
- **Backend**: Google Sheets + Google Apps Script
- **Styling**: Custom CSS with CSS Variables
- **Charts**: Chart.js + React-Chartjs-2

### Architecture
The app connects to a Google Sheet via a Google Apps Script URL. All data (stories, status, links) is stored in the Sheet. The frontend fetches data using the Apps Script API and updates the Sheet when you make changes.

### Key Features
- **Dashboard**: KPI cards showing story counts by status
- **Stories Table**: View and filter all stories
- **Storyboard**: Detailed view of story content, hashtags, SEO tags
- **Upload**: Paste Google Drive links for video and thumbnail
- **Review**: Approve or reject stories for publishing
- **Publish**: Schedule stories or mark as published with YouTube link
- **Analytics**: Pipeline status charts and category breakdown

---

## 📋 Setup Instructions

### 1. Google Sheet Setup
Create a Google Sheet with the following columns:
- **Column A**: Row ID (e.g., "Row-001-01")
- **Column B**: Title
- **Column C**: Category
- **Column D**: Age Group
- **Column E**: Story Text
- **Column F**: Character Description
- **Column G**: Hashtags
- **Column H**: SEO Tags
- **Column I**: Dashboard Status (pending, storyboard, uploaded, review, approved, scheduled, published)
- **Column J**: Video Link (Google Drive)
- **Column K**: Thumbnail Link (Google Drive)
- **Column L**: YouTube Link
- **Column M**: Schedule Date/Time
- **Column N**: Review Notes
- **Column O**: Updated At

### 2. Google Apps Script Setup
1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Paste the following code:

```javascript
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getAllStories') {
    return getAllStories();
  } else if (action === 'getAnalytics') {
    return getAnalytics();
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === 'updateStory') {
    return updateStory(data.rowId, data.updates);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAllStories() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const stories = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const story = {};
    headers.forEach((header, index) => {
      story[header.toLowerCase().replace(/\s+/g, '')] = row[index];
    });
    stories.push(story);
  }
  
  return ContentService.createTextOutput(JSON.stringify(stories))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateStory(rowId, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === rowId) {
      Object.keys(updates).forEach(key => {
        const colIndex = getColumnIndex(key);
        if (colIndex >= 0) {
          sheet.getRange(i + 1, colIndex + 1).setValue(updates[key]);
        }
      });
      break;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getColumnIndex(key) {
  const columns = ['rowid', 'title', 'category', 'agegroup', 'story', 'character', 'hashtags', 'seotags', 'dashstatus', 'videolink', 'thumblink', 'ytlink', 'schedule', 'reviewnotes', 'updatedat'];
  return columns.indexOf(key.toLowerCase());
}

function getAnalytics() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const statusCounts = {};
  
  for (let i = 1; i < data.length; i++) {
    const status = data[i][8] || 'pending';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }
  
  return ContentService.createTextOutput(JSON.stringify(statusCounts))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Save the script
5. Click **Deploy → New Deployment**
6. Select type: **Web app**
7. Description: "Dashboard API"
8. Execute as: **Me**
9. Who has access: **Anyone**
10. Click **Deploy**
11. Copy the **Web App URL**

### 3. Update App Configuration
1. Open `src/lib/api.js`
2. Replace the `SCRIPT_URL` with your Google Apps Script URL:
   ```javascript
   const SCRIPT_URL = "YOUR_APPS_SCRIPT_URL_HERE";
   ```

### 4. Run the App
```powershell
npm run dev
```

---

## 📊 Workflow

1. **Pending**: New stories appear in the Dashboard
2. **Storyboard**: Review story details, mark as storyboard
3. **Upload**: Paste Google Drive links for video and thumbnail
4. **Review**: Approve or reject stories
5. **Publish**: Schedule stories or mark as published with YouTube link
6. **Analytics**: View pipeline status and category breakdown

---

## 🎨 Customization

### Colors
Edit `src/styles/globals.css` to change the color scheme:
- `--accent`: Primary accent color
- `--accent2`: Secondary accent color
- `--accent3`: Tertiary accent color
- etc.

### Fonts
The app uses Google Fonts (Inter, Poppins, Share Tech Mono). You can change these in `index.html`.

---

## 🐛 Troubleshooting

### Blank Page
- Check browser console for errors (F12)
- Ensure Google Apps Script URL is correct
- Make sure the Sheet has the correct column structure
- Check that the Apps Script is deployed as a Web App with "Anyone" access

### Data Not Loading
- Verify the Apps Script URL is accessible
- Check that the Sheet has data
- Ensure CORS is enabled in Apps Script

### Updates Not Saving
- Check that the Apps Script has edit permissions
- Verify the row ID matches exactly
- Check browser console for error messages

---

## 📝 License

This project is open source and available for personal and commercial use.

For a non-coder, here is how the different parts work together:

### 1. The "Brain" (Supabase)
*   **Database**: All your stories, views, likes, and statuses are saved here safely.
*   **Storage**: When you upload a video or a picture in the "Upload" tab, it goes here.
*   **Safety**: It has a "Service Role" which is like a master key that keeps everything private.

### 2. The "Publishing Office" (Google & YouTube)
*   **YouTube Data API**: This allows the app to talk to YouTube to upload videos.
*   **Google Sheets**: You can still use your sheets to view data, and the app can read from them.

### 3. The "Look & Feel" (React + Vite)
*   **Brutalist Design**: The bold borders and colors make it look like a high-end production tool.
*   **Real-time Charts**: These update instantly to show you how stories are performing.

---

## 🛠️ How to Manage the App

### Adding New Stories
Click the **"NEW STORY"** button in the top right. Enter a title and category, and it will appear in your database instantly.

### Uploading Files
In the **"Upload"** tab, you can drag and drop your `.mp4` video and thumbnail picture. The progress bar will show you the real upload status to your storage vault.

### Changing Settings
Click the **Gear Icon (⚙️)** in the top right to open the Settings drawer. This is where you put your "keys" (API links and Folder IDs) if they ever change.

---

## 🌐 Taking it Live (Production)

When you are ready to put this on the web (like on Vercel or Netlify):

1.  **Build the final version**:
    ```powershell
    npm run build
    ```
2.  **Upload the `dist` folder**: This is the "packaged" app that works on any web server.

---

## ❓ FAQ for No-Coders

**Q: Where is my data actually kept?**
A: It's in the cloud, hosted by **Supabase**. You can log in to your Supabase dashboard at any time to see the "raw" data.

**Q: Do I need to be a coder to update the styles?**
A: Most styles are in `src/styles/globals.css`. You can change "Colors" (like `--accent`) by just typing new color codes there.

**Q: I see a blank screen?**
A: Make sure you ran `npm install` first to get all the "tools" the app needs to run.

---

**Developed with ❤️ by Antigravity AI**
