import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [react(), viteCompression()],

  // ============================================
  // DEV SERVER PROXY
  // Ye sirf localhost development mein kaam karta hai
  // Browser ko lagta hai ke request same origin pe ja rahi hai
  // CORS errors bilkul khatam ho jati hain
  // Production (Vercel) mein ye nahi hoga —
  // wahan deployed URL pe CORS already allow hoti hai
  // ============================================
  server: {
    proxy: {
      // Google Drive API calls proxy karo
      // Browser: /drive-proxy/... → googleapis.com/drive/...
      '/drive-proxy': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,         // Host header change karo
        rewrite: (path) =>
          path.replace(/^\/drive-proxy/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // Forward Location header for resumable uploads
            const location = proxyRes.headers['location'];
            if (location) {
              // Convert direct Google API URL back to proxy URL
              const proxyLocation = location.replace('https://www.googleapis.com', '/drive-proxy');
              proxyRes.headers['location'] = proxyLocation;
            }
          });
        },
      },

      // YouTube upload API calls proxy karo
      // Browser: /yt-proxy/... → googleapis.com/upload/youtube/...
      '/yt-upload-proxy': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/yt-upload-proxy/, ''),
        secure: true,
      },

      // YouTube data API (playlists, thumbnails)
      // Browser: /yt-api-proxy/... → googleapis.com/youtube/...
      '/yt-api-proxy': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/yt-api-proxy/, ''),
        secure: true,
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
  },
})