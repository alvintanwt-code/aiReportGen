'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FNAUploadView from '../../components/FNAUploadView';
import ClientList from '../../components/ClientList';

export default function FNAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load clients from localStorage
    const saved = localStorage.getItem('clients');
    if (saved) {
      setClients(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!selectedClientId) {
    return (
      <div style={{ padding: '40px 24px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div style={{ marginBottom: '40px' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e8e8e8',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              marginBottom: '20px'
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#101b3a', margin: 0 }}>
            Financial Needs Analysis
          </h1>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            Select a client to start FNA analysis
          </p>
        </div>

        {clients.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {clients.map(client => (
              <div
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                style={{
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF8F44';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e8e8e8';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#101b3a', margin: '0 0 8px 0' }}>
                  {client.name}
                </p>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                  Click to start FNA analysis →
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '8px' }}>
            <p style={{ color: '#666' }}>No clients found. Create a client first.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <FNAUploadView
      clientId={selectedClientId}
      clientName={selectedClient?.name}
      onUploadComplete={() => {
        // Data is saved and navigation is handled by the component
      }}
    />
  );
}
