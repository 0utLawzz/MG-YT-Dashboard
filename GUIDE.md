# 🕵️ Developer & Installation Guide

This guide is for when you want to set up this project from scratch or move it to a new computer.

## 1. Prerequisites (What you need installed)
*   **Node.js**: The engine that runs this app. [Download here](https://nodejs.org/).
*   **Git**: For saving your progress and pushing to GitHub.

## 2. Installation Steps
1.  **Extract the files** into a folder (e.g., `E:\Raplit`).
2.  **Install dependencies**: Open your terminal in that folder and run:
    ```powershell
    npm install
    ```
    *This downloads all the building blocks (like Chart.js and Supabase).*

## 3. The Environment File (`.env`)
The app needs "Secret Keys" to talk to your database. These are kept in a file named `.env` in the main folder. 
**NEVER share this file publicly!**

It should look like this:
```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_API_KEY=your-google-api-key
VITE_GOOGLE_CLIENT_ID=your-client-id
```

## 4. Folder Structure Explained
*   `/src/components`: The visual pieces of the app (Header, Cards, Table).
*   `/src/lib`: The library connections (Supabase, Google).
*   `/src/hooks`: The "logic" that manages the data.
*   `/src/styles`: The "Makeup" of the app (CSS).

## 5. Deployment Checklist
Before you put this on a website:
1.  Verify the `stories` table is created in Supabase.
2.  Verify the `story-assets` bucket is created in Supabase Storage.
3.  Ensure your `.env` variables are entered into your hosting provider (like Vercel).

## 6. Common Troubleshooting
*   **Icons not showing**: Check `lucide-react` version in `package.json`.
*   **Network Error**: Check if the Supabase URL in `.env` is correct.
*   **Blank page on build**: Make sure the `dist` folder is actually being served correctly.

---

*Need help? Ask your friendly neighborhood AI coder!*
