import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ENV } from '../lib/config/env';

const CLIENT_ID = ENV.GOOGLE_CLIENT_ID;

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() => {
    try {
      const stored = sessionStorage.getItem('gapi_access_token');
      const expiry = sessionStorage.getItem('gapi_token_expiry');
      if (stored && expiry && Date.now() < Number(expiry)) {
        return stored;
      }
    } catch (_) {}
    return null;
  });
  
  const [expiryTime, setExpiryTime] = useState(() => {
    try {
      const expiry = sessionStorage.getItem('gapi_token_expiry');
      return expiry ? Number(expiry) : null;
    } catch (_) { return null; }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const tokenClientRef = React.useRef(null);

  useEffect(() => {
    if (!window.google || !CLIENT_ID) return;
    
    // Initialize token client once
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/drive',
      callback: (response) => {
        setIsLoading(false);
        if (response && response.access_token) {
          const expiresIn = response.expires_in * 1000;
          const expiry = Date.now() + expiresIn;
          sessionStorage.setItem('gapi_access_token', response.access_token);
          sessionStorage.setItem('gapi_token_expiry', expiry.toString());
          setAccessToken(response.access_token);
          setExpiryTime(expiry);
          setAuthError(null);
        }
      },
      error_callback: (err) => {
        setIsLoading(false);
        setAuthError(err?.message || 'Authentication failed');
        console.error('Google Auth Error:', err);
      }
    });
  }, []);

  const signIn = useCallback(() => {
    if (tokenClientRef.current) {
      setIsLoading(true);
      setAuthError(null);
      tokenClientRef.current.requestAccessToken();
    } else {
      setAuthError('Google token client not initialized');
    }
  }, []);

  const signOut = useCallback(() => {
    // Revoke token if it exists
    if (accessToken && window.google) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        console.log('Token revoked');
      });
    }
    sessionStorage.removeItem('gapi_access_token');
    sessionStorage.removeItem('gapi_token_expiry');
    setAccessToken(null);
    setExpiryTime(null);
  }, [accessToken]);

  // Auto refresh token a minute before expiry
  useEffect(() => {
    if (!expiryTime) return;
    const now = Date.now();
    const refreshIn = expiryTime - now - 60_000; // 1 minute before

    if (refreshIn <= 0) {
      tokenClientRef.current?.requestAccessToken();
      return;
    }
    
    const timer = setTimeout(() => {
      tokenClientRef.current?.requestAccessToken();
    }, refreshIn);
    
    return () => clearTimeout(timer);
  }, [expiryTime]);

  const value = {
    accessToken,
    signIn,
    signOut,
    isAuthenticated: !!accessToken,
    isLoading,
    authError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
