'use client';

import ReviewCard from './ReviewCard';
import NewReviewForm from './NewReviewForm';
import { useState } from 'react';

export default function ReviewList({
  clientId,
  reviews,
  onAddReview,
  onDeleteReview,
  onStartReview,
}) {
  const [showForm, setShowForm] = useState(false);

  console.log('[ReviewList] Rendering', reviews.length, 'reviews');

  if (!reviews || reviews.length === 0) {
    return (
      <div>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          No reviews yet. Create one to get started.
        </p>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + New Review
        </button>
        {showForm && (
          <NewReviewForm
            clientId={clientId}
            onAddReview={onAddReview}
            onStartReview={onStartReview}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {showForm && (
        <NewReviewForm
          clientId={clientId}
          onAddReview={onAddReview}
          onStartReview={onStartReview}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div style={{ marginBottom: '20px' }}>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '15px',
            }}
          >
            + New Review
          </button>
        )}
      </div>

      <div>
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onDelete={onDeleteReview}
            onStartReview={onStartReview}
          />
        ))}
      </div>
    </div>
  );
}
