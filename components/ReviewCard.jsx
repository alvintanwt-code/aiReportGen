'use client';

export default function ReviewCard({ review, onDelete, onStartReview }) {
  console.log('[ReviewCard] Rendering review:', review.id);

  const handleDeleteClick = () => {
    if (window.confirm(`Delete review "${review.reviewName}"?`)) {
      console.log('[ReviewCard] Deleting review:', review.id);
      onDelete(review.id);
    }
  };

  const handleStartClick = () => {
    console.log('[ReviewCard] Starting review:', review.id);
    onStartReview(review.id);
  };

  const createdDate = new Date(review.createdAt).toLocaleDateString();

  return (
    <div
      style={{
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginBottom: '10px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0' }}>{review.reviewName}</h4>
        <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
          Created: {createdDate}
        </p>
        <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: '12px' }}>
          Status: {review.status}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleStartClick}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {review.status === 'extracted' ? 'View' : 'Start Review'}
        </button>
        <button
          onClick={handleDeleteClick}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
