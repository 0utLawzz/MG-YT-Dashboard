import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchStories, createStory, updateStory } from '../lib/api';

const STATUSES = ['draft', 'scripted', 'recording', 'editing', 'review', 'approved', 'published'];

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

  // Update story status or data
  const editStory = useCallback(async (id, updates) => {
    try {
      await updateStory(id, updates);
      setStories(prev =>
        prev.map(s => (s.id === id ? { ...s, ...updates } : s))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete story (local only for now)
  const removeStory = useCallback((id) => {
    setStories(prev => prev.filter(s => s.id !== id));
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
    const totalViews = stories.reduce((sum, s) => sum + (s.views || 0), 0);
    const totalLikes = stories.reduce((sum, s) => sum + (s.likes || 0), 0);
    const inPipeline = total - published;
    const avgViews = published > 0 ? Math.round(totalViews / published) : 0;
    return { total, published, totalViews, totalLikes, inPipeline, avgViews };
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
    editStory,
    removeStory,
    refresh: loadStories,
    statuses: STATUSES,
  };
}
