'use client';

import { useState } from 'react';
import ReviewList from './ReviewList';

export default function ClientCard({
  client,
  reviews,
  onAddReview,
  onDeleteReview,
  onDeleteClient,
  onStartReview,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  console.log('[ClientCard] Rendering client:', client.id);

  const clientReviews = reviews.filter((r) => r.clientId === client.id);
  const createdDate = new Date(client.createdAt).toLocaleDateString();

  console.log('[ClientCard] Debug:', {
    clientId: client.id,
    totalReviews: reviews.length,
    reviewClientIds: reviews.map(r => ({ id: r.id, clientId: r.clientId })),
    matchingReviews: clientReviews.length
  });

  const handleDeleteClient = () => {
    if (
      window.confirm(
        `Delete client "${client.name}" and all their reviews?`
      )
    ) {
      console.log('[ClientCard] Deleting client:', client.id);
      onDeleteClient(client.id);
    }
  };

  return (
    <div
      style={{
        border: '2px solid #007bff',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '15px',
        backgroundColor: '#f0f8ff',
      }}
    >
      <div style={{ marginBottom: '15px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <div>
            <h3 style={{ margin: '0', color: '#007bff' }}>{client.name}</h3>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
              📧 {client.email}
            </p>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
              📱 {client.mobileNumber}
            </p>
            <p style={{ margin: '5px 0', color: '#999', fontSize: '12px' }}>
              Created: {createdDate} • {clientReviews.length} review(s)
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            {isExpanded ? '▼ Collapse' : '▶ Expand'}
          </button>
          <button
            onClick={handleDeleteClient}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {isExpanded && (
        <div
          style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '4px',
            borderTop: '2px solid #007bff',
            marginTop: '15px',
          }}
        >
          <ReviewList
            clientId={client.id}
            reviews={clientReviews}
            onAddReview={onAddReview}
            onDeleteReview={onDeleteReview}
            onStartReview={onStartReview}
          />
        </div>
      )}
    </div>
  );
}
