import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const FLASK_URL = import.meta.env.REACT_APP_FLASK_URL || 'http://localhost:5000';

export function useVideoProcessor() {
  const socketRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ filename: '', step: '', percent: 0 });
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Don't create socket if already exists
    if (socketRef.current?.connected) {
      return;
    }

    const newSocket = io(FLASK_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Connected to video processor');
    });

    newSocket.on('progress', (data) => {
      setProgress(data);
    });

    newSocket.on('complete', (data) => {
      setProcessing(false);
      setResult(data);
    });

    newSocket.on('error', (err) => {
      setProcessing(false);
      setError(err.message || 'Processing error');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from video processor:', reason);
    });

    newSocket.on('reconnect', () => {
      console.log('Reconnected to video processor');
    });

    socketRef.current = newSocket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const processVideo = async (videoLink, settings) => {
    if (!socketRef.current) {
      setError('Not connected to processor');
      return null;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${FLASK_URL}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoLink,
          trimSeconds: settings.trimSeconds || 0,
          logoEnabled: settings.logoEnabled || false,
          logoPosition: settings.logoPosition || 'bottom-right',
          logoSize: settings.logoSize || 80,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      setProcessing(false);
      return data;
    } catch (err) {
      setError(err.message);
      setProcessing(false);
      return null;
    }
  };

  return {
    processing,
    progress,
    error,
    result,
    processVideo,
  };
}
