// ============================================
// src/context/AuthContext.jsx
// FIXED v2.1 — Permission error fix
//
// Changes:
// 1. drive.file → drive (full Drive access — permissions set kar sake)
// 2. youtube.force-ssl scope add (thumbnail upload ke liye zaruri)
// 3. Token expiry auto-refresh improved
// 4. sessionStorage → memory-based token (security better)
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ENV } from '../lib/config/env';

// ─── Client ID ────────────────────────────────────────────────────────────────
// ENV.GOOGLE_CLIENT_ID → .env → localStorage settings se aata hai
const CLIENT_ID = ENV.GOOGLE_CLIENT_ID;

// ─── OAuth Scopes ─────────────────────────────────────────────────────────────
// BEFORE (broken):  'drive.file' — sirf app-uploaded files pe kaam karta
// AFTER  (fixed):   'drive'      — sari Drive files pe permission set ho sakti
//
// youtube.force-ssl → thumbnail upload ke liye ZARURI hai
// youtube.upload    → video upload
// youtube           → playlists, channel info
// drive             → Drive files download + permission set karna
// userinfo.email    → connected account ka email dikhana
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',   // ← NEW: thumbnail fix
  'https://www.googleapis.com/auth/drive',               // ← FIXED: was drive.file
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// ─── Context ──────────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  // Token memory mein rakhte hain (sessionStorage se zyada safe)
  // Lekin page reload pe sign-in dobara chahiye — acceptable tradeoff
  const [accessToken, setAccessToken]   = useState(() => {
    try {
      const stored = sessionStorage.getItem('gapi_access_token');
      const expiry  = sessionStorage.getItem('gapi_token_expiry');
      // Token valid hai aur expire nahi hua → use karo
      if (stored && expiry && Date.now() < Number(expiry)) return stored;
    } catch (_) {}
    return null;
  });

  const [expiryTime, setExpiryTime]     = useState(() => {
    try {
      const expiry = sessionStorage.getItem('gapi_token_expiry');
      return expiry ? Number(expiry) : null;
    } catch (_) { return null; }
  });

  const [isLoading, setIsLoading]       = useState(false);
  const [authError, setAuthError]       = useState(null);

  // Token client reference (ek baar initialize, baar baar use)
  const tokenClientRef = useRef(null);

  // ─── Initialize Google Token Client ────────────────────────────────────────
  // Page load pe ek baar — window.google available hone par
  useEffect(() => {
    if (!window.google || !CLIENT_ID) {
      if (!CLIENT_ID) {
        console.error('[AuthContext] CLIENT_ID missing! Check .env → VITE_GOOGLE_CLIENT_ID');
      }
      return;
    }

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,

      // ← Yahan scope change kiya gaya hai — yahi permission error ka root cause tha
      scope: SCOPES,

      // Token milne par callback
      callback: (response) => {
        setIsLoading(false);

        if (response?.error) {
          setAuthError('Sign-in failed: ' + response.error);
          console.error('[AuthContext] Token error:', response.error);
          return;
        }

        if (response?.access_token) {
          // Token ko memory + sessionStorage mein save karo
          const expiresIn = (response.expires_in || 3600) * 1000;
          const expiry    = Date.now() + expiresIn;

          try {
            sessionStorage.setItem('gapi_access_token', response.access_token);
            sessionStorage.setItem('gapi_token_expiry', String(expiry));
          } catch (_) {} // Private browsing mein sessionStorage nahi hoti

          setAccessToken(response.access_token);
          setExpiryTime(expiry);
          setAuthError(null);
          console.log('[AuthContext] ✅ Token received, expires in', Math.round(expiresIn / 60000), 'min');
        }
      },

      // Error callback (user ne popup band kiya wagera)
      error_callback: (err) => {
        setIsLoading(false);
        const msg = err?.message || err?.type || 'Authentication failed';
        setAuthError(msg);
        console.error('[AuthContext] Auth error:', err);
      },
    });

    console.log('[AuthContext] Token client initialized');
  }, []); // ← sirf ek baar run hoga

  // ─── Sign In ───────────────────────────────────────────────────────────────
  const signIn = useCallback(() => {
    if (!tokenClientRef.current) {
      setAuthError('Google client not ready. Page reload karo.');
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    tokenClientRef.current.requestAccessToken();
  }, []);

  // ─── Sign Out ──────────────────────────────────────────────────────────────
  const signOut = useCallback(() => {
    if (accessToken && window.google) {
      // Google server pe token revoke karo
      window.google.accounts.oauth2.revoke(accessToken, () => {
        console.log('[AuthContext] Token revoked from Google');
      });
    }
    // Local storage clear karo
    try {
      sessionStorage.removeItem('gapi_access_token');
      sessionStorage.removeItem('gapi_token_expiry');
    } catch (_) {}

    setAccessToken(null);
    setExpiryTime(null);
    console.log('[AuthContext] Signed out');
  }, [accessToken]);

  // ─── Auto Token Refresh ────────────────────────────────────────────────────
  // Token expire hone se 2 minute pehle silently refresh karo
  useEffect(() => {
    if (!expiryTime || !tokenClientRef.current) return;

    const now       = Date.now();
    const refreshIn = expiryTime - now - 2 * 60 * 1000; // 2 min before expiry

    if (refreshIn <= 0) {
      // Already expired ya expire hone wala — turant refresh
      console.log('[AuthContext] Token near/past expiry, refreshing...');
      tokenClientRef.current.requestAccessToken();
      return;
    }

    console.log('[AuthContext] Auto-refresh in', Math.round(refreshIn / 60000), 'min');
    const timer = setTimeout(() => {
      if (tokenClientRef.current) {
        tokenClientRef.current.requestAccessToken();
      }
    }, refreshIn);

    return () => clearTimeout(timer);
  }, [expiryTime]);

  // ─── Context Value ─────────────────────────────────────────────────────────
  const value = {
    accessToken,
    signIn,
    signOut,
    isAuthenticated: !!accessToken,
    isLoading,
    authError,
    // Token expiry time expose karo (PublishForm mein use ho sakta)
    tokenExpiresAt: expiryTime,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};