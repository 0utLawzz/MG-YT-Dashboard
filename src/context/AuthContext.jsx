// ============================================
// src/context/AuthContext.jsx
// FIXED v3.0 — Permanent Auth Solution
//
// Changes:
// 1. localStorage persistence (survives tab/browser close)
// 2. Silent token refresh with prompt:'none' option
// 3. Graceful token expiry handling (no forced popups)
// 4. Token validation before API calls
// 5. Auto-refresh 5 min before expiry
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ENV } from '../lib/config/env';

// ─── Client ID ────────────────────────────────────────────────────────────────
const CLIENT_ID = ENV.GOOGLE_CLIENT_ID;

// ─── OAuth Scopes ─────────────────────────────────────────────────────────────
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// ─── Context ──────────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Load persisted token from localStorage (survives page reload + browser close)
  const [accessToken, setAccessToken]   = useState(() => {
    try {
      const stored = localStorage.getItem('bls_access_token');
      const expiry  = localStorage.getItem('bls_token_expiry');

      // Token valid hai aur expire nahi hua → use karo
      if (stored && expiry && Date.now() < Number(expiry)) {
        console.log('[AuthContext] ✅ Restored token from localStorage');
        return stored;
      } else if (stored) {
        // Token expired → clear it
        localStorage.removeItem('bls_access_token');
        localStorage.removeItem('bls_token_expiry');
      }
    } catch (_) {}
    return null;
  });

  const [expiryTime, setExpiryTime]     = useState(() => {
    try {
      const expiry = localStorage.getItem('bls_token_expiry');
      return expiry ? Number(expiry) : null;
    } catch (_) { return null; }
  });

  const [isLoading, setIsLoading]       = useState(false);
  const [authError, setAuthError]       = useState(null);
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  // Token client reference
  const tokenClientRef = useRef(null);
  const refreshTimerRef = useRef(null);

  // ─── Initialize Google Token Client ────────────────────────────────────────
  useEffect(() => {
    if (!window.google || !CLIENT_ID) {
      if (!CLIENT_ID) {
        console.error('[AuthContext] CLIENT_ID missing! Check .env → VITE_GOOGLE_CLIENT_ID');
      }
      return;
    }

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        setIsLoading(false);
        setRefreshAttempts(0);

        if (response?.error) {
          console.warn('[AuthContext] Token error:', response.error);
          setAuthError('Sign-in failed: ' + response.error);
          return;
        }

        if (response?.access_token) {
          // Token milya! Save it permanently
          const expiresIn = (response.expires_in || 3600) * 1000;
          const expiry    = Date.now() + expiresIn;

          try {
            localStorage.setItem('bls_access_token', response.access_token);
            localStorage.setItem('bls_token_expiry', String(expiry));
          } catch (_) { /* Storage error, continue anyway */ }

          setAccessToken(response.access_token);
          setExpiryTime(expiry);
          setAuthError(null);
          console.log('[AuthContext] ✅ Token received, expires in', Math.round(expiresIn / 60000), 'min');
        }
      },

      error_callback: (err) => {
        setIsLoading(false);
        console.warn('[AuthContext] Auth error:', err);
        // Don't show error for silent refresh failures
        if (err?.type !== 'popup_closed') {
          setAuthError(err?.message || 'Authentication failed');
        }
      },
    });

    console.log('[AuthContext] Token client initialized');
  }, []);

  // ─── Sign In (with user interaction) ───────────────────────────────────────
  const signIn = useCallback(() => {
    if (!tokenClientRef.current) {
      setAuthError('Google client not ready. Please reload the page.');
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    // prompt: 'consent' → always show consent screen (user must click)
    tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
  }, []);

  // ─── Silent Token Refresh ──────────────────────────────────────────────────
  // Tries to refresh token WITHOUT showing popup (works if user already consented)
  const silentRefresh = useCallback(() => {
    if (!tokenClientRef.current) return;

    console.log('[AuthContext] Attempting silent token refresh...');
    setRefreshAttempts(prev => prev + 1);

    // prompt: 'none' → refresh silently, fail silently if can't
    tokenClientRef.current.requestAccessToken({ prompt: 'none' });
  }, []);

  // ─── Auto Token Refresh ────────────────────────────────────────────────────
  // Refresh 5 min BEFORE expiry (instead of 2 min)
  useEffect(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    if (!expiryTime || !tokenClientRef.current) return;

    const now       = Date.now();
    const timeUntilExpiry = expiryTime - now;
    const refreshIn = Math.max(0, timeUntilExpiry - 5 * 60 * 1000); // 5 min before

    if (timeUntilExpiry < 0) {
      // Token already expired
      console.log('[AuthContext] ⚠️  Token expired, will refresh on next API call');
      setAccessToken(null);
      return;
    }

    console.log('[AuthContext] ⏰ Auto-refresh scheduled in', Math.round(refreshIn / 60000), 'min');

    refreshTimerRef.current = setTimeout(() => {
      silentRefresh();
    }, refreshIn);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [expiryTime, silentRefresh]);

  // ─── Sign Out ──────────────────────────────────────────────────────────────
  const signOut = useCallback(() => {
    if (accessToken && window.google) {
      try {
        window.google.accounts.oauth2.revoke(accessToken);
      } catch (err) {
        console.warn('[AuthContext] Revoke failed:', err);
      }
    }

    // Clear all storage
    try {
      localStorage.removeItem('bls_access_token');
      localStorage.removeItem('bls_token_expiry');
      sessionStorage.removeItem('gapi_access_token');
      sessionStorage.removeItem('gapi_token_expiry');
    } catch (_) {}

    setAccessToken(null);
    setExpiryTime(null);
    setRefreshAttempts(0);
    console.log('[AuthContext] ✅ Signed out');
  }, [accessToken]);

  // ─── Validate Token (check if expired) ─────────────────────────────────────
  const isTokenValid = useCallback(() => {
    if (!accessToken || !expiryTime) return false;
    // Consider token valid if expiry is more than 1 min away
    return Date.now() < expiryTime - 60 * 1000;
  }, [accessToken, expiryTime]);

  // ─── Context Value ────────────────────────────────────────────────────────
  const value = {
    accessToken,
    signIn,
    signOut,
    isAuthenticated: isTokenValid(),
    isLoading,
    authError,
    tokenExpiresAt: expiryTime,
    isTokenValid,
    // For debugging
    refreshAttempts,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};