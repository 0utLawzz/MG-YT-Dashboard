// ============================================
// src/lib/api/client.js
// Central API Client with retry, GAS redirect handling,
// and structured error logging
// ============================================

/**
 * Delay helper for retries
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Error Normalizer
 */
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

/**
 * Structured logger for API debugging
 */
function apiLog(level, message, data) {
  const prefix = `[BLS-API][${new Date().toISOString()}]`;
  if (level === 'error') {
    console.error(prefix, message, data !== undefined ? data : '');
  } else if (level === 'warn') {
    console.warn(prefix, message, data !== undefined ? data : '');
  } else {
    console.log(prefix, message, data !== undefined ? data : '');
  }
}

/**
 * Parse response safely — handles GAS redirects that return HTML
 */
async function safeParseJson(response) {
  const contentType = response.headers.get('content-type') || '';

  // Google Apps Script sometimes returns HTML after redirect
  if (contentType.includes('text/html')) {
    const text = await response.text();
    apiLog('warn', 'Response is HTML, not JSON. GAS redirect likely.', {
      url: response.url,
      status: response.status,
      bodyPreview: text.substring(0, 200),
    });
    throw new ApiError(
      'Server returned HTML instead of JSON. The Google Apps Script may be misconfigured or temporarily unavailable.',
      response.status,
      { html: true }
    );
  }

  // Try to parse JSON
  const text = await response.text();
  if (!text || text.trim() === '') {
    apiLog('warn', 'Empty response body', { url: response.url });
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    apiLog('error', 'JSON parse failed', {
      url: response.url,
      bodyPreview: text.substring(0, 300),
      error: parseError.message,
    });
    throw new ApiError(
      'Invalid JSON response from server',
      response.status,
      { parseError: true, body: text.substring(0, 200) }
    );
  }
}

/**
 * Fetch wrapper with retry, timeout, and GAS-resilient parsing
 */
export async function fetchWithRetry(url, options = {}, retries = 3, backoff = 500) {
  const { timeout = 15000, ...fetchOptions } = options;

  let lastError;

  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      apiLog('info', `Fetch attempt ${i + 1}/${retries}`, { url: url.substring(0, 100) });

      const isGet = (fetchOptions.method || 'GET').toUpperCase() === 'GET';
      const finalHeaders = { ...fetchOptions.headers };

      if (!isGet) {
        finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: finalHeaders,
        redirect: 'follow', // Explicit: follow GAS redirects
      });

      clearTimeout(id);

      // Non-OK response
      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      // Parse with GAS-resilience
      const data = await safeParseJson(response);
      apiLog('info', 'Fetch success', { url: url.substring(0, 100) });
      return data;
    } catch (error) {
      clearTimeout(id);
      lastError = error;

      // Don't retry on 4xx client errors
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        apiLog('error', `Client error (${error.status}), not retrying`, { message: error.message });
        throw error;
      }

      if (error.name === 'AbortError') {
        lastError = new ApiError('Request timed out', 0, { timeout: true });
        apiLog('warn', `Request timed out (attempt ${i + 1})`, { url: url.substring(0, 100) });
      } else {
        apiLog('warn', `Fetch failed (attempt ${i + 1})`, {
          message: error.message,
          url: url.substring(0, 100),
        });
      }

      if (i < retries - 1) {
        const waitMs = backoff * (i + 1);
        apiLog('info', `Retrying in ${waitMs}ms...`);
        await delay(waitMs);
      }
    }
  }

  apiLog('error', 'All retry attempts exhausted', { message: lastError?.message });
  throw lastError;
}

export const apiClient = {
  get: (url, options) => fetchWithRetry(url, { ...options, method: 'GET' }),
  post: (url, data, options) => fetchWithRetry(url, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: (url, data, options) => fetchWithRetry(url, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  delete: (url, options) => fetchWithRetry(url, { ...options, method: 'DELETE' }),
};
