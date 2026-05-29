'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

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
            alignItems: 'flex-start',
            marginBottom: '10px',
            gap: '10px',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '240px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {isExpanded ? '▼ Collapse' : '▶ Expand'}
              </button>
              <button
                onClick={handleDeleteClient}
                style={{
                  flex: 1,
                  padding: '10px 20px',
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
            <button
              onClick={() => router.push(`/fna?clientId=${client.id}`)}
              style={{
                width: '100%',
                padding: '10px 20px',
                backgroundColor: '#FF8F44',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Financial Needs Analysis
            </button>
          </div>
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
