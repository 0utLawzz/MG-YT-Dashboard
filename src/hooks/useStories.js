// ============================================
// src/hooks/useStories.js
// Sheet-based state management with structured logging
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { fetchStories, updateStory } from "../lib/api";
import { publishService } from "../services/publishService";

function storyLog(level, message, data) {
  const prefix = `[BLS-STORIES][${new Date().toISOString()}]`;
  if (level === 'error') console.error(prefix, message, data ?? '');
  else if (level === 'warn') console.warn(prefix, message, data ?? '');
  else console.log(prefix, message, data ?? '');
}

export const DASH_STATUSES = [
  "pending",
  "storyboard",
  "uploaded",
  "review",
  "approved",
  "publishing",
  "publish_failed",
  "scheduled",
  "published",
];

export function useStories() {
  const [stories, setStories]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // ---- Fetch all stories from Sheet ----
  const loadStories = useCallback(async () => {
    storyLog('info', 'Loading stories...');
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStories();

      // Final safety: ensure array
      const safeData = Array.isArray(data) ? data : [];
      storyLog('info', `Loaded ${safeData.length} stories`);

      setStories(safeData);
    } catch (err) {
      storyLog('error', 'Failed to load stories', err.message);
      setError(err.message);
      toast.error(`Failed to load stories: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // ---- Update story: Sheet first, then local state ----
  const editStory = useCallback(async (rowId, updates) => {
    try {
      storyLog('info', 'Updating story', { rowId, updates });
      const result = await updateStory(rowId, updates);

      // Local state update on success
      setStories((prev) =>
        prev.map((s) => (s.id === rowId ? { ...s, ...updates } : s))
      );
      toast.success('Story updated successfully');
      return result;
    } catch (err) {
      storyLog('error', 'editStory failed', err.message);
      setError(err.message);
      toast.error(`Update failed: ${err.message}`);
      throw err;
    }
  }, []);

  // ---- Status shortcuts ----
  const moveToStoryboard = useCallback(
    (rowId) => editStory(rowId, { dashStatus: "storyboard" }),
    [editStory]
  );

  const moveToUploaded = useCallback(
    (rowId) => editStory(rowId, { dashStatus: "uploaded" }),
    [editStory]
  );

  const moveToReview = useCallback(
    (rowId) => editStory(rowId, { dashStatus: "review" }),
    [editStory]
  );

  const approveStory = useCallback(
    async (rowId, approvedBy = "Admin") => {
      const res = await editStory(rowId, { dashStatus: "approved", approvedBy });
      return res;
    },
    [editStory]
  );

  const scheduleStory = useCallback(
    (rowId, dateTime) =>
      editStory(rowId, { dashStatus: "scheduled", schedule: dateTime }),
    [editStory]
  );

  const publishStory = useCallback(
    (rowId, ytLink = "") =>
      editStory(rowId, { dashStatus: "published", ytLink }),
    [editStory]
  );

  // ---- Filtered stories ----
  const filteredStories = useMemo(() => {
    return stories.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        s.title?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.id?.toLowerCase?.().includes(q);
      const matchStatus =
        filterStatus === "all" || s.dashStatus === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [stories, searchQuery, filterStatus]);

  // ---- Pipeline counts ----
  const pipelineCounts = useMemo(() => {
    const counts = {};
    DASH_STATUSES.forEach((s) => (counts[s] = 0));
    stories.forEach((s) => {
      const ds = s.dashStatus || "pending";
      if (counts[ds] !== undefined) counts[ds]++;
      else counts[ds] = 1;
    });
    return counts;
  }, [stories]);

  // ---- KPIs ----
  const kpis = useMemo(() => {
    const total     = stories.length;
    const published = stories.filter((s) => s.dashStatus === "published").length;
    const scheduled = stories.filter((s) => s.dashStatus === "scheduled").length;
    const approved  = stories.filter((s) => s.dashStatus === "approved").length;
    const inReview  = stories.filter((s) => s.dashStatus === "review").length;
    const uploaded  = stories.filter((s) => s.dashStatus === "uploaded").length;
    const pending   = stories.filter((s) => s.dashStatus === "pending").length;
    const publishing= stories.filter((s) => s.dashStatus === "publishing").length;
    const failed    = stories.filter((s) => s.dashStatus === "publish_failed").length;
    return { total, published, scheduled, approved, inReview, uploaded, pending, publishing, failed };
  }, [stories]);

  return {
    stories,
    filteredStories,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    pipelineCounts,
    kpis,
    editStory,
    moveToStoryboard,
    moveToUploaded,
    moveToReview,
    approveStory,
    scheduleStory,
    publishStory,
    refresh: loadStories,
    statuses: DASH_STATUSES,
  };
}