# 🚢 Production & Deployment Guide

This guide explains how to take your "Bright Little Stories" Dashboard from your local computer and put it on the world wide web for anyone (with access) to use.

## 🌈 Choice of Hosting
We recommend **Vercel** or **Netlify**. They are free for small projects and extremely easy to use.

### Step 1: Push to GitHub
1.  Save all your changes.
2.  In your terminal, run:
    ```powershell
    git add .
    git commit -m "Ready for production"
    git push origin main
    ```

### Step 2: Connect to Vercel
1.  Go to [Vercel.com](https://vercel.com) and log in with your GitHub account.
2.  Click **"Add New"** -> **"Project"**.
3.  Choose the `Magic-Upgradev1` repository.
4.  **CRITICAL**: Under "Environment Variables", add everything from your `.env` file:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   `VITE_GOOGLE_API_KEY`
    *   `VITE_GOOGLE_CLIENT_ID`
5.  Click **"Deploy"**.

### Step 3: Configure Redirects (Optional)
If you are using a custom domain, add it in the Vercel dashboard under "Settings" -> "Domains".

---

## 🔒 Security for Production

### Database Protection
*   Go to your **Supabase Dashboard**.
*   Check **RLS (Row Level Security)** on the `stories` table.
*   Make sure you have policies that only allow authorized users if you want to keep the dashboard private.

### YouTube API Limits
*   Check your **Google Cloud Console**.
*   Make sure your API Key has "API Restrictions" to only allow the "YouTube Data API v3" and "Google Sheets API".

---

## 📈 Monitoring
Once live, you can use the **Supabase Logs** or **Vercel Analytics** to see how your app is performing and if there are any errors.

---

**You're all set! Your magic dashboard is now ready for the world.**
