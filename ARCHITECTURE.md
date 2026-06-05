# Architecture Documentation

## Core Architecture

This project is a React Single Page Application (SPA) with a serverless architecture.

```mermaid
graph TD
    Browser[React SPA] -->|OAuth2| Google[Google Identity]
    Browser -->|REST| GAS[Google Apps Script]
    GAS -->|CRUD| Sheet[(Google Sheets)]
    Browser -->|Upload| Drive[Google Drive API]
    Browser -->|Publish| YouTube[YouTube API]
```

## Technologies

- **Frontend:** React 19, Vite 8, Chart.js.
- **Backend:** Google Apps Script (`Code.gs`) acting as a REST API.
- **Database:** Google Sheets.
- **Auth:** Browser-side Google Identity Services.
- **Deployment:** Vercel.

---

## 👨‍💻 Credits

**By OutLawZ™** | https://www.brandex.pk | net2tara@gmail.com
