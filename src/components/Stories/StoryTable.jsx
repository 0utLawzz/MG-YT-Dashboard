import { Search, Filter, Copy } from 'lucide-react';
import './StoryTable.css';

const STATUS_LABELS = {
  pending: 'Pending', storyboard: 'Storyboard', uploaded: 'Uploaded',
  review: 'Review', approved: 'Approved', scheduled: 'Scheduled',
  published: 'Published',
};

export default function StoryTable({
  stories, searchQuery, onSearchChange,
  filterStatus, onFilterChange, statuses,
  onOpenStoryboard
}) {
  // Guard: stories might be undefined during loading
  const safeStories = Array.isArray(stories) ? stories : [];

  const handleCopyText = (story) => {
    // Only copy Title, Story, Character raw text.
    const textFormat = 
`--- TITLE ---
${story.title || 'N/A'}

--- STORY ---
${story.story || 'N/A'}

--- CHARACTER ---
${story.character || 'N/A'}`;
    
    navigator.clipboard?.writeText(textFormat);
  };

  return (
    <section className="story-table-section animate-fade-in" id="panel-stories" role="tabpanel" aria-labelledby="tab-stories">
      <h2 className="sr-only">Stories Management</h2>

      {/* Search & Filter Bar */}
      <div className="story-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="input search-input"
            type="text"
            placeholder="Search stories…"
            value={searchQuery || ''}
            onChange={e => onSearchChange?.(e.target.value)}
            id="search-stories"
            aria-label="Search stories"
          />
        </div>

        <div className="filter-group">
          <Filter size={14} />
          <select
            className="input filter-select"
            value={filterStatus || 'all'}
            onChange={e => onFilterChange?.(e.target.value)}
            id="filter-status"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            {(statuses || []).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
            ))}
          </select>
        </div>

        <span className="story-count-label">
          {safeStories.length} {safeStories.length === 1 ? 'story' : 'stories'}
        </span>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="story-table" aria-label="Stories list">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Assets</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {safeStories.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-row">No stories found</td>
              </tr>
            ) : (
              safeStories.map((story, idx) => (
                <tr key={story.id || idx} className="story-row" style={{ animationDelay: `${idx * 0.03}s` }}>
                  <td className="mono row-num">{idx + 1}</td>
                  <td className="row-title">{story.title || '—'}</td>
                  <td className="row-category">{story.category || '—'}</td>
                  <td>
                    <span className={`badge badge-${story.dashStatus || 'draft'}`}>
                      {STATUS_LABELS[story.dashStatus] || story.dashStatus || 'Unknown'}
                    </span>
                  </td>
                  <td className="row-assets">
                    <span title={story.videoUrl || story.videoLink ? 'Video attached' : 'No video'}>{story.videoUrl || story.videoLink ? '🎬' : '⬜'}</span>
                    <span title={story.thumbnail || story.thumbLink ? 'Thumbnail attached' : 'No thumbnail'}>{story.thumbnail || story.thumbLink ? '🖼️' : '⬜'}</span>
                  </td>
                  <td className="mono">{(story.views || 0).toLocaleString()}</td>
                  <td className="mono">{(story.likes || 0).toLocaleString()}</td>
                  <td className="row-actions" style={{ minWidth: "140px" }}>
                    <button
                      className="btn btn-sm btn-icon"
                      title="Copy Story Text"
                      aria-label={`Copy text for ${story.title}`}
                      onClick={() => handleCopyText(story)}
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      title="Push to Storyboard"
                      aria-label={`Push to storyboard for ${story.title}`}
                      onClick={() => onOpenStoryboard?.(story)}
                      style={{ padding: "0.2rem 0.5rem" }}
                    >
                      Push to Storyboard
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
