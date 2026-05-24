import { CheckCircle, Send, Eye, Edit3 } from 'lucide-react';
import './ReviewCard.css';

const STATUS_LABELS = {
  draft: 'Draft', scripted: 'Scripted', recording: 'Recording',
  editing: 'Editing', review: 'Review', approved: 'Approved', published: 'Published',
};

export default function ReviewPanel({ stories, onApprove, onPublish }) {
  const reviewable = stories.filter(s => ['review', 'approved', 'editing'].includes(s.status));

  return (
    <section className="review-section animate-fade-in" id="panel-review" role="tabpanel" aria-labelledby="tab-review">
      <h2 className="section-title">Review Queue</h2>
      <p className="section-desc">
        {reviewable.length} {reviewable.length === 1 ? 'story' : 'stories'} awaiting review or ready for publishing.
      </p>

      {reviewable.length === 0 ? (
        <div className="review-empty panel">
          <CheckCircle size={48} style={{ color: 'var(--accent4)' }} />
          <p>All caught up! No stories to review right now.</p>
        </div>
      ) : (
        <div className="review-grid">
          {reviewable.map((story, idx) => (
            <div key={story.id} className="review-card panel" style={{ animationDelay: `${idx * 0.08}s` }}>
              <div className="review-card-header">
                <span className={`badge badge-${story.status}`}>
                  {STATUS_LABELS[story.status]}
                </span>
                <span className="review-id mono">#{story.id}</span>
              </div>

              <h3 className="review-title">{story.title}</h3>

              <div className="review-meta">
                <span className="review-meta-item">📁 {story.category || 'N/A'}</span>
                <span className="review-meta-item">👶 {story.ageGroup || 'N/A'}</span>
                <span className="review-meta-item">⏱️ {story.duration || 'TBD'}</span>
              </div>

              <div className="review-card-actions">
                <button
                  className="btn btn-sm"
                  onClick={() => onApprove?.(story)}
                  aria-label={`Preview ${story.title}`}
                >
                  <Eye size={13} /> Preview
                </button>
                {story.status === 'review' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => onApprove?.(story)}
                    aria-label={`Approve ${story.title}`}
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                )}
                {story.status === 'approved' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onPublish?.(story)}
                    aria-label={`Publish ${story.title}`}
                  >
                    <Send size={13} /> Publish
                  </button>
                )}
                {story.status === 'editing' && (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => onApprove?.(story)}
                    aria-label={`Edit ${story.title}`}
                  >
                    <Edit3 size={13} /> Submit for Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
