'use client';

import { useState } from 'react';

// UUID generator (same as in app/page.jsx)
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function NewReviewForm({ clientId, onAddReview, onStartReview, onCancel }) {
  const [reviewName, setReviewName] = useState('');
  const [error, setError] = useState('');

  console.log('[NewReviewForm] Rendered for clientId:', clientId);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[NewReviewForm] Submit clicked, reviewName:', reviewName);

    if (!reviewName.trim()) {
      setError('Please enter a review name');
      return;
    }

    // Generate ID for the review
    const reviewId = generateId();
    console.log('[NewReviewForm] Created review with ID:', reviewId);

    // Create the review
    onAddReview(clientId, reviewName, reviewId);

    // Navigate to upload page for this review
    onStartReview(reviewId);

    setReviewName('');
    setError('');
  };

  return (
    <div
      style={{
        padding: '15px',
        backgroundColor: '#e8f4f8',
        borderRadius: '4px',
        marginBottom: '15px',
      }}
    >
      <h4 style={{ margin: '0 0 10px 0' }}>Create New Review</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Review name (e.g., Q2 2026 Review)"
            value={reviewName}
            onChange={(e) => setReviewName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {error && (
          <p style={{ color: '#dc3545', fontSize: '12px', margin: '5px 0' }}>
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
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
            Create Review
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
