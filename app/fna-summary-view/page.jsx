'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { loadFNASummary } from '@/lib/firebaseUtils';
import FNASummaryDashboard from '@/components/FNASummaryDashboard';

export default function FNASummaryViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [savedSummary, setSavedSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSummary = async () => {
      if (!auth.currentUser || !clientId) {
        setError('Missing user or client ID');
        setIsLoading(false);
        return;
      }

      try {
        const summary = await loadFNASummary(auth.currentUser.uid, clientId);
        if (summary) {
          setSavedSummary(summary);
        } else {
          setError('No saved FNA summary found for this client');
        }
      } catch (err) {
        console.error('Error loading summary:', err);
        setError('Failed to load summary: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSummary();
  }, [clientId]);

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading saved summary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 16px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          ← Back to Dashboard
        </button>
        <div style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          border: '1px solid #f5c6cb',
        }}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!savedSummary) {
    return (
      <div style={{ padding: '40px' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 16px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          ← Back to Dashboard
        </button>
        <p>No summary data found</p>
      </div>
    );
  }

  return (
    <div>
      <FNASummaryDashboard
        extractedData={savedSummary.extractedData}
        onContinue={() => router.push(`/fna-4factors?clientId=${clientId}`)}
        isViewingArchive={true}
      />
    </div>
  );
}
