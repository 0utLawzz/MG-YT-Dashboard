// ============================================
// src/services/upload/resumableUpload.js
// Resumable Chunked Video Upload for YouTube API v3
// ============================================

export class ResumableUpload {
  constructor(options) {
    this.accessToken = options.accessToken;
    this.file = options.file;
    this.metadata = options.metadata;
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
    
    this.uploadUrl = '';
    this.chunkSize = 256 * 1024; // 256KB minimum chunk size for YouTube
    this.offset = 0;
    this.isPaused = false;
    this.abortController = null;
  }

  // 1. Initialize session
  async initiate() {
    try {
      const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': this.file.size,
          'X-Upload-Content-Type': this.file.type,
        },
        body: JSON.stringify({
          snippet: this.metadata.snippet,
          status: this.metadata.status,
        }),
      });

      if (!initRes.ok) throw new Error('Failed to initiate upload');
      this.uploadUrl = initRes.headers.get('Location');
      if (!this.uploadUrl) throw new Error('No Location header found');
    } catch (err) {
      this.onError(err);
      throw err;
    }
  }

  // 2. Start or Resume upload
  async start() {
    if (!this.uploadUrl) await this.initiate();
    this.isPaused = false;
    this.uploadNextChunk();
  }

  // 3. Pause upload
  pause() {
    this.isPaused = true;
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  // 4. Upload chunk loop
  async uploadNextChunk() {
    if (this.isPaused) return;

    this.abortController = new AbortController();
    const end = Math.min(this.offset + this.chunkSize, this.file.size);
    const chunk = this.file.slice(this.offset, end);

    try {
      const headers = {
        'Content-Range': `bytes ${this.offset}-${end - 1}/${this.file.size}`,
      };

      const res = await fetch(this.uploadUrl, {
        method: 'PUT',
        headers,
        body: chunk,
        signal: this.abortController.signal,
      });

      // 308 Resume Incomplete means chunk uploaded successfully
      if (res.status === 308) {
        const range = res.headers.get('Range');
        if (range) {
          this.offset = parseInt(range.split('-')[1], 10) + 1;
        } else {
          this.offset = end;
        }
        
        const pct = Math.round((this.offset / this.file.size) * 100);
        this.onProgress(pct);

        // Next chunk
        this.uploadNextChunk();
      } else if (res.ok) {
        // 200 or 201 Created
        const data = await res.json();
        this.onComplete(`https://www.youtube.com/watch?v=${data.id}`);
      } else {
        throw new Error(`Upload failed with status ${res.status}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // Upload paused explicitly by the user
      } else {
        this.onError(error);
      }
    }
  }

  // 5. Recovery check
  async checkStatus() {
    if (!this.uploadUrl) return;
    try {
      const res = await fetch(this.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes */${this.file.size}`
        }
      });

      if (res.status === 308) {
        const range = res.headers.get('Range');
        if (range) {
          this.offset = parseInt(range.split('-')[1], 10) + 1;
        } else {
          this.offset = 0;
        }
        this.start();
      }
    } catch (err) {
      this.onError(err);
    }
  }
}
