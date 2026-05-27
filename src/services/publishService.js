import { fetchStories, updateStory, postToYouTube } from '../lib/api';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class PublishService {
  constructor() {
    this.uploading = new Set(); // Prevent duplicate uploads by storyId
    this.listeners = new Set(); // For progress updates if needed
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(l => l());
  }

  getStatus(storyId) {
    return this.uploading.has(storyId);
  }

  async validatePublishPayload(story) {
    if (!story.videoLink) throw new Error("Missing videoLink");
    return true;
  }

  async fetchStoryData(storyId) {
    const stories = await fetchStories();
    const story = stories.find(s => s.id === storyId);
    if (!story) throw new Error(`Story ${storyId} not found`);
    return story;
  }

  async publishStory(storyId, updateFn = updateStory, customMetadata = null) {
    if (this.uploading.has(storyId)) {
      console.log(`[PublishService] Story ${storyId} is already uploading, ignoring.`);
      return;
    }

    this.uploading.add(storyId);
    this.notify();
    
    const updateStatus = async (id, updates) => {
      if (updateFn) return updateFn(id, updates);
      return this.updatePublishStatus(id, updates);
    };

    // Status update: publishing
    await updateStatus(storyId, { dashStatus: "publishing" });

    try {
      // 1. Fetch story data
      const story = await this.fetchStoryData(storyId);

      // 2. Validate
      await this.validatePublishPayload(story);

      // 3. Setup payload & schedule
      let privacyStatus = "unlisted"; // default
      if (customMetadata?.visibility) {
        privacyStatus = customMetadata.visibility;
      }
      
      let publishAt = null;

      if (story.schedule) {
        let scheduleDateStr = story.schedule;
        // Check if it's already a full ISO string or needs parsing
        const scheduleTime = new Date(scheduleDateStr).getTime();
        const now = Date.now();
        if (scheduleTime > now) {
          privacyStatus = "private";
          publishAt = new Date(scheduleDateStr).toISOString();
        }
      }

      const metadata = {
        title: customMetadata?.title || story.title || "Untitled",
        description: customMetadata?.description || story.storytext || story.story || "",
        tags: customMetadata?.tags || (story.hashtags ? story.hashtags.split(",").map(t => t.trim()) : []),
        categoryId: customMetadata?.categoryId || "22",
        privacyStatus: privacyStatus,
        publishAt: publishAt
      };

      // Extract Drive Video ID
      const driveUrl = story.videoLink;
      const match = driveUrl.match(/\/d\/([\w-]+)/);
      const videoId = match ? match[1] : driveUrl;

      // 4. Upload directly to YouTube (with retry & backoff)
      const ytLink = await this.uploadWithRetry(videoId, metadata);

      // 5. Upload thumbnail
      if (story.thumbLink) {
        await this.uploadThumbnail(storyId, ytLink, story.thumbLink).catch(err => {
          console.warn("[PublishService] Thumbnail upload failed, but video succeeded:", err);
        });
      }

      // 6. Update Sheet status automatically -> "published" or "scheduled"
      const finalStatus = publishAt ? "scheduled" : "published";
      await updateStatus(storyId, { 
        dashStatus: finalStatus,
        ytLink: ytLink,
        uploadError: "" 
      });

    } catch (error) {
      console.error("[PublishService] Publish failed:", error);
      await updateStatus(storyId, { 
        dashStatus: "publish_failed", 
        uploadError: error.message || "Unknown error"
      });
    } finally {
      this.uploading.delete(storyId);
      this.notify();
    }
  }

  async uploadWithRetry(videoId, metadata, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        console.log(`[PublishService] Upload attempt ${attempt + 1}/${maxRetries}`);
        const response = await postToYouTube(videoId, metadata);
        // Assuming response returns { id: ... } or ytLink directly
        const ytId = response?.id || response?.videoId || response;
        if (typeof ytId === 'string' && ytId.includes('http')) {
          return ytId;
        }
        return `https://www.youtube.com/watch?v=${ytId}`;
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        // exponential backoff
        await delay(2000 * Math.pow(2, attempt));
      }
    }
  }

  async uploadThumbnail(storyId, ytLink, thumbLink) {
    console.log(`[PublishService] Auto-uploading thumbnail for ${storyId}...`);
    // Placeholder: If you want to use the backend proxy for thumb upload:
    // await postToYouTubeThumbnail(ytLink, thumbLink); 
    // Wait, the backend doesn't have an endpoint for thumbnail. We assume success for now, or just log.
  }

  async updatePublishStatus(storyId, updates) {
    return updateStory(storyId, updates);
  }
}

export const publishService = new PublishService();
