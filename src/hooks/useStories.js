// ============================================
// src/hooks/useStories.js
// Sheet-based state management
// Supabase completely removed
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchStories, updateStory } from "../lib/api";

// Dashboard workflow statuses (Col I)
export const DASH_STATUSES = [
  "pending",    // Naya story, kuch nahi hua
  "storyboard", // Story dekhi gayi, storyboard mein
  "uploaded",   // Video + Thumbnail upload ho gaya
  "review",     // Human review ke liye
  "approved",   // Approved, publish ready
  "scheduled",  // YouTube pe schedule ho gaya
  "published",  // Live ho gaya
];

export function useStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // ---- Fetch from Sheet ----
  const loadStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStories();
      setStories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // ---- Update story in Sheet + local state ----
  const editStory = useCallback(async (rowId, updates) => {
    try {
      // Pehle local state update karo (optimistic)
      setStories((prev) =>
        prev.map((s) => (s.id === rowId ? { ...s, ...updates } : s))
      );
      // Phir Sheet mein write karo
      await updateStory(rowId, updates);
    } catch (err) {
      setError(err.message);
      // Fail hone par reload karo
      await loadStories();
      throw err;
    }
  }, [loadStories]);

  // ---- Status change shortcuts ----
  const moveToStoryboard = useCallback((rowId) =>
    editStory(rowId, { dashStatus: "storyboard" }), [editStory]);

  const moveToUploaded = useCallback((rowId) =>
    editStory(rowId, { dashStatus: "uploaded" }), [editStory]);

  const moveToReview = useCallback((rowId) =>
    editStory(rowId, { dashStatus: "review" }), [editStory]);

  const approveStory = useCallback((rowId, approvedBy = "Admin") =>
    editStory(rowId, { dashStatus: "approved", approvedBy }), [editStory]);

  const scheduleStory = useCallback((rowId, scheduleDateTime) =>
    editStory(rowId, { dashStatus: "scheduled", schedule: scheduleDateTime }), [editStory]);

  const publishStory = useCallback((rowId, ytLink = "") =>
    editStory(rowId, { dashStatus: "published", ytLink }), [editStory]);

  // ---- Filtered stories ----
  const filteredStories = useMemo(() => {
    return stories.filter((s) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        s.title?.toLowerCase().includes(query) ||
        s.category?.toLowerCase().includes(query) ||
        s.id?.toLowerCase().includes(query);

      const matchStatus =
        filterStatus === "all" || s.dashStatus === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [stories, searchQuery, filterStatus]);

  // ---- Pipeline counts (Col I values) ----
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
    const total = stories.length;
    const published = stories.filter((s) => s.dashStatus === "published").length;
    const scheduled = stories.filter((s) => s.dashStatus === "scheduled").length;
    const approved = stories.filter((s) => s.dashStatus === "approved").length;
    const inReview = stories.filter((s) => s.dashStatus === "review").length;
    const uploaded = stories.filter((s) => s.dashStatus === "uploaded").length;
    const pending = stories.filter((s) => s.dashStatus === "pending").length;
    return { total, published, scheduled, approved, inReview, uploaded, pending };
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
