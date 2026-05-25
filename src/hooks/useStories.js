import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchStories, createStory, updateStory, deleteStory } from '../lib/api';

const STATUSES = ['draft', 'complete', 'review', 'approved', 'scheduled', 'published'];

const STATUS_FLOW = {
  draft: 'complete',
  complete: 'review',
  review: 'approved',
  approved: 'published',
};

export function useStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch stories on mount
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

  // Add a new story
  const addStory = useCallback(async (storyData) => {
    try {
      const newStory = await createStory({
        ...storyData,
        status: 'draft',
        views: 0,
        likes: 0,
      });
      setStories(prev => [newStory, ...prev]);
      return newStory;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Bulk add stories (for sheet import)
  const addStoriesBulk = useCallback(async (storiesData) => {
    try {
      const results = [];
      for (const s of storiesData) {
        const newStory = await createStory({
          ...s,
          status: 'draft',
          views: 0,
          likes: 0,
        });
        results.push(newStory);
      }
      setStories(prev => [...results, ...prev]);
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update story status or data
  const editStory = useCallback(async (id, updates) => {
    try {
      const result = await updateStory(id, updates);
      setStories(prev =>
        prev.map(s => (s.id === id ? { ...s, ...updates, ...result } : s))
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Mark story as complete (when both video + thumbnail are uploaded)
  const markComplete = useCallback(async (id) => {
    return editStory(id, { status: 'complete' });
  }, [editStory]);

  // Delete story
  const removeStory = useCallback(async (id) => {
    try {
      await deleteStory(id);
      setStories(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Filtered stories
  const filteredStories = useMemo(() => {
    return stories.filter(s => {
      const matchesSearch = !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [stories, searchQuery, filterStatus]);

  // Pipeline counts
  const pipelineCounts = useMemo(() => {
    const counts = {};
    STATUSES.forEach(s => { counts[s] = 0; });
    stories.forEach(s => {
      if (counts[s.status] !== undefined) counts[s.status]++;
    });
    return counts;
  }, [stories]);

  // KPIs
  const kpis = useMemo(() => {
    const total = stories.length;
    const published = stories.filter(s => s.status === 'published').length;
    const scheduled = stories.filter(s => s.status === 'scheduled').length;
    const totalViews = stories.reduce((sum, s) => sum + (s.views || 0), 0);
    const totalLikes = stories.reduce((sum, s) => sum + (s.likes || 0), 0);
    const inPipeline = total - published - scheduled;
    const avgViews = published > 0 ? Math.round(totalViews / published) : 0;
    return { total, published, scheduled, totalViews, totalLikes, inPipeline, avgViews };
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
    addStory,
    addStoriesBulk,
    editStory,
    markComplete,
    removeStory,
    refresh: loadStories,
    statuses: STATUSES,
    statusFlow: STATUS_FLOW,
  };
}
