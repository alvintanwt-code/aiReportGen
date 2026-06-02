'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import FNAUploadView from '../../components/FNAUploadView';

function FNAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('clients');
    if (saved) {
      try {
        setClients(JSON.parse(saved));
      } catch (err) {
        console.error('[fna] Failed to parse clients:', err);
      }
    }
    const clientIdFromParams = searchParams.get('clientId');
    if (clientIdFromParams) setSelectedClientId(clientIdFromParams);
    setLoading(false);
  }, [searchParams]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  if (loading) {
    return (
      <div className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="dash-status">
          <div className="dash-spinner" />
          <div className="dash-status-title">Loading…</div>
        </div>
      </div>
    );
  }

  if (!selectedClientId) {
    return (
      <div className="dash-root dash-upload">
        <header className="dash-upload-header">
          <div className="dash-upload-header-left">
            <button className="dash-back" onClick={() => router.back()}>
              <ArrowLeft size={14} strokeWidth={2.2} />
              Back
            </button>
            <div className="dash-crumbs">
              <span className="dash-crumb dash-crumb-current">Financial needs analysis</span>
            </div>
          </div>
        </header>

        <div className="dash-upload-body no-rail">
          <main>
            <h1 className="dash-h1" style={{ marginBottom: 6 }}>Financial needs analysis</h1>
            <p className="dash-section-sub">Select a client to start an FNA analysis.</p>

            {clients.length > 0 ? (
              <section className="dash-grid">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className="dash-card"
                    style={{
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      color: 'inherit',
                      background: 'var(--surface)',
                    }}
                  >
                    <div className="dash-card-head">
                      <div className="dash-card-name-row">
                        <div className="dash-avatar" aria-hidden="true">
                          {client.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p className="dash-card-name">{client.name}</p>
                          <p className="dash-card-sub">Start FNA analysis</p>
                        </div>
                      </div>
                      <ArrowRight size={16} strokeWidth={2} style={{ color: 'var(--subtle)' }} />
                    </div>
                  </button>
                ))}
              </section>
            ) : (
              <div className="dash-empty">
                <div className="dash-empty-icon">
                  <Users size={20} strokeWidth={2} />
                </div>
                <div className="dash-empty-title">No clients yet</div>
                <div className="dash-empty-body">
                  Create a client from the dashboard before running an FNA.
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <FNAUploadView
      clientId={selectedClientId}
      clientName={selectedClient?.name}
      onUploadComplete={() => {}}
    />
  );
}

export default function FNAPage() {
  return (
    <Suspense
      fallback={
        <div className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
          <div className="dash-status">
            <div className="dash-spinner" />
            <div className="dash-status-title">Loading…</div>
          </div>
        </div>
      }
    >
      <FNAContent />
    </Suspense>
  );
}
