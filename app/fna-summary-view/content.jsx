'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { loadFNASummary } from '../../lib/firebaseUtils';
import FNASummaryDashboard from '../../components/FNASummaryDashboard';

export default function FNASummaryViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [savedSummary, setSavedSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSummary = async () => {
      if (!auth.currentUser || !clientId) {
        setError('Missing user or client ID.');
        setIsLoading(false);
        return;
      }
      try {
        const summary = await loadFNASummary(auth.currentUser.uid, clientId);
        if (summary) setSavedSummary(summary);
        else setError('No saved FNA summary was found for this client.');
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
      <div className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="dash-status">
          <div className="dash-spinner" />
          <div className="dash-status-title">Loading saved summary…</div>
        </div>
      </div>
    );
  }

  if (error || !savedSummary) {
    return (
      <div className="dash-root dash-upload">
        <header className="dash-upload-header">
          <div className="dash-upload-header-left">
            <button className="dash-back" onClick={() => router.push('/')}>
              <ArrowLeft size={14} strokeWidth={2.2} />
              Dashboard
            </button>
          </div>
        </header>
        <div className="dash-upload-body no-rail">
          <main>
            <div className="dash-banner dash-banner-danger" role="alert" style={{ marginTop: 24 }}>
              <span className="dash-banner-icon">
                <AlertCircle size={15} strokeWidth={2.2} />
              </span>
              <span>{error || 'No summary data found.'}</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const handleContinue = () => {
    const data = savedSummary.extractedData;
    sessionStorage.setItem(`fna_${clientId}`, JSON.stringify(data));
    sessionStorage.setItem(
      `fna_metrics_${clientId}`,
      JSON.stringify({
        age: data.personalInfo?.age,
        assets: data.assets,
        liabilities: data.liabilities,
        cashflow: data.cashflow,
      })
    );
    router.push(`/fna-4factors?clientId=${clientId}`);
  };

  return (
    <FNASummaryDashboard
      extractedData={savedSummary.extractedData}
      onContinue={handleContinue}
      isViewingArchive={true}
    />
  );
}
