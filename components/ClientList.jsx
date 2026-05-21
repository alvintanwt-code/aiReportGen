'use client';

import ClientCard from './ClientCard';
import NewClientForm from './NewClientForm';
import { useState } from 'react';

export default function ClientList({
  clients,
  reviews,
  onAddClient,
  onAddReview,
  onDeleteClient,
  onDeleteReview,
  onStartReview,
}) {
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  console.log('[ClientList] Rendering', clients.length, 'clients');

  return (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: '8px' }}>Your Clients</h2>
          <p style={{ fontSize: '14px', color: '#999' }}>Manage and create client profiles</p>
        </div>
        {!showNewClientForm && (
          <button
            onClick={() => setShowNewClientForm(true)}
            style={{
              padding: '11px 20px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#333'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#1a1a1a'}
          >
            + New Client
          </button>
        )}
      </div>

      {showNewClientForm && (
        <div style={{ marginBottom: '32px' }}>
          <NewClientForm
            onAddClient={(key, name) => {
              onAddClient(key, name);
              setShowNewClientForm(false);
            }}
            onCancel={() => setShowNewClientForm(false)}
          />
        </div>
      )}

      {clients.length === 0 ? (
        <div
          style={{
            padding: '48px 32px',
            backgroundColor: '#f8f8f8',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #e5e5e5',
          }}
        >
          <p style={{ fontSize: '16px', color: '#999' }}>
            No clients yet. Create one to get started!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              reviews={reviews}
              onAddReview={onAddReview}
              onDeleteReview={onDeleteReview}
              onDeleteClient={onDeleteClient}
              onStartReview={onStartReview}
            />
          ))}
        </div>
      )}
    </div>
  );
}
