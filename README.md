# 🌟 Bright Little Stories Dashboard (Magic Upgrade)

Welcome to your modernized **Bright Little Stories** dashboard! This app is a professional command center designed to manage story creation from draft to YouTube release. 

It uses a "Modern Stack" (React + Supabase), which means it's fast, secure, and very powerful.

---

## 🚀 Quick Start (Running the App)

If you have the code on your computer, follow these 3 simple steps to start the "Magic":

1.  **Open your Terminal** (like Command Prompt or PowerShell).
2.  **Move to this folder**: 
    ```powershell
    cd E:\Raplit
    ```
3.  **Start the app**:
    ```powershell
    npm run dev
    ```
4.  **Open your browser**: Go to `http://localhost:5173`. You should see your dashboard!

---

## 🏗️ What's Under the Hood? (The Magic Parts)

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
