import { Search, Filter, Copy, FileText, Trash2 } from 'lucide-react';
import './StoryTable.css';

const STATUS_LABELS = {
  draft: 'Draft', scripted: 'Scripted', recording: 'Recording',
  editing: 'Editing', review: 'Review', approved: 'Approved', published: 'Published',
};

export default function StoryTable({
  stories, searchQuery, onSearchChange,
  filterStatus, onFilterChange, statuses,
  onEdit, onRemove
}) {
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
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            id="search-stories"
            aria-label="Search stories"
          />
        </div>

        <div className="filter-group">
          <Filter size={14} />
          <select
            className="input filter-select"
            value={filterStatus}
            onChange={e => onFilterChange(e.target.value)}
            id="filter-status"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <span className="story-count-label">
          {stories.length} {stories.length === 1 ? 'story' : 'stories'}
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
              <th>Age</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stories.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-row">No stories found</td>
              </tr>
            ) : (
              stories.map((story, idx) => (
                <tr key={story.id} className="story-row" style={{ animationDelay: `${idx * 0.03}s` }}>
                  <td className="mono row-num">{idx + 1}</td>
                  <td className="row-title">{story.title}</td>
                  <td className="row-category">{story.category || '—'}</td>
                  <td className="row-age">{story.ageGroup || '—'}</td>
                  <td>
                    <span className={`badge badge-${story.status}`}>
                      {STATUS_LABELS[story.status]}
                    </span>
                  </td>
                  <td className="mono">{story.duration || '—'}</td>
                  <td className="mono">{(story.views || 0).toLocaleString()}</td>
                  <td className="mono">{(story.likes || 0).toLocaleString()}</td>
                  <td className="row-actions">
                    <button
                      className="btn btn-sm btn-icon"
                      title="Copy story data"
                      aria-label={`Copy ${story.title}`}
                      onClick={() => navigator.clipboard?.writeText(JSON.stringify(story, null, 2))}
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      className="btn btn-sm btn-icon"
                      title="Storyboard"
                      aria-label={`Storyboard for ${story.title}`}
                      onClick={() => onEdit?.(story)}
                    >
                      <FileText size={13} />
                    </button>
                    <button
                      className="btn btn-sm btn-icon"
                      title="Remove"
                      aria-label={`Remove ${story.title}`}
                      onClick={() => onRemove?.(story.id)}
                      style={{ color: 'var(--accent)' }}
                    >
                      <Trash2 size={13} />
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
