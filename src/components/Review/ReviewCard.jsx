import { CheckCircle, Send, Eye, RotateCcw } from 'lucide-react';
import './ReviewCard.css';

const STATUS_LABELS = {
  draft: 'Draft', complete: 'Complete', review: 'Review',
  approved: 'Approved', scheduled: 'Scheduled', published: 'Published',
};

export default function ReviewPanel({ stories, onApprove, onReject, onPublish }) {
  // Stories that need review or are approved
  const reviewable = stories.filter(s => ['complete', 'review', 'approved'].includes(s.status));

  return (
    <section className="review-section animate-fade-in" id="panel-review" role="tabpanel" aria-labelledby="tab-review">
      <h2 className="section-title">Review Queue</h2>
      <p className="section-desc">
        {reviewable.length} {reviewable.length === 1 ? 'story' : 'stories'} in the pipeline.
        Stories marked <strong>Complete</strong> appear here for review.
      </p>

      {reviewable.length === 0 ? (
        <div className="review-empty panel">
          <CheckCircle size={48} style={{ color: 'var(--accent4)' }} />
          <p>All caught up! No stories to review right now.</p>
          <p className="review-hint">Upload video + thumbnail for a story to see it here.</p>
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

              {/* Asset indicators */}
              <div className="review-assets">
                <span className={`review-asset ${story.videoUrl ? 'has' : 'missing'}`}>
                  🎬 {story.videoUrl ? 'Video ✓' : 'No Video'}
                </span>
                <span className={`review-asset ${story.thumbnail ? 'has' : 'missing'}`}>
                  🖼️ {story.thumbnail ? 'Thumbnail ✓' : 'No Thumbnail'}
                </span>
              </div>

              <div className="review-card-actions">
                {/* Complete → Review (Submit for review) */}
                {story.status === 'complete' && (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => onApprove?.(story)}
                    aria-label={`Submit ${story.title} for review`}
                  >
                    <Eye size={13} /> Submit for Review
                  </button>
                )}

                {/* Review → Approved */}
                {story.status === 'review' && (
                  <>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => onApprove?.(story)}
                      aria-label={`Approve ${story.title}`}
                    >
                      <CheckCircle size={13} /> Pass Review
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => onReject?.(story)}
                      aria-label={`Send ${story.title} back to draft`}
                    >
                      <RotateCcw size={13} /> Send Back
                    </button>
                  </>
                )}

                {/* Approved → Publish */}
                {story.status === 'approved' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onPublish?.(story)}
                    aria-label={`Publish ${story.title}`}
                  >
                    <Send size={13} /> Go to Publish
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
