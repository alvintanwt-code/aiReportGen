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
      <div style={{ marginBottom: '20px' }}>
        {!showNewClientForm && (
          <button
            onClick={() => setShowNewClientForm(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            + New Client
          </button>
        )}
      </div>

      {showNewClientForm && (
        <NewClientForm
          onAddClient={(key, name) => {
            onAddClient(key, name);
            setShowNewClientForm(false);
          }}
          onCancel={() => setShowNewClientForm(false)}
        />
      )}

      {clients.length === 0 ? (
        <p style={{ color: '#666', fontSize: '16px' }}>
          No clients yet. Create one to get started!
        </p>
      ) : (
        <div>
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
