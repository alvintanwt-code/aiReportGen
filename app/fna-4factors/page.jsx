'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import FNA4FactorPlanning from '../../components/FNA4FactorPlanning';

function LoadingShell() {
  return (
    <div className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div className="dash-status">
        <div className="dash-spinner" />
        <div className="dash-status-title">Loading…</div>
      </div>
    </div>
  );
}

function MissingDataShell({ onBack }) {
  return (
    <div className="dash-root dash-upload">
      <header className="dash-upload-header">
        <div className="dash-upload-header-left">
          <button className="dash-back" onClick={onBack}>
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
            <span>
              Couldn't find FNA data for this client. Open the FNA summary first, then continue to 4-factor planning from there.
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

function FNA4FactorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [extractedData, setExtractedData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const savedData = sessionStorage.getItem(`fna_${clientId}`);
    const savedMetrics = sessionStorage.getItem(`fna_metrics_${clientId}`);

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setExtractedData(data);

        if (savedMetrics) {
          const metricsData = JSON.parse(savedMetrics);
          const age = metricsData.age || 0;
          const liquidAssets =
            (metricsData.assets?.cashSavings || 0) +
            (metricsData.assets?.cpfOA || 0) +
            (metricsData.assets?.cpfSA || 0) +
            (metricsData.assets?.cpfMA || 0) +
            (metricsData.assets?.equities || 0) +
            (metricsData.assets?.mutualFunds || 0);

          const totalAssets =
            liquidAssets +
            (metricsData.assets?.residentialPropertyValue || 0) +
            (metricsData.assets?.insuranceCashValue || 0);

          const totalLiabilities =
            (metricsData.liabilities?.loans || 0) + (metricsData.liabilities?.mortgage || 0);

          const netWorth = totalAssets - totalLiabilities;
          const scorePerAge = age > 0 ? netWorth / age : 0;

          let phase = 'Accumulation';
          if (scorePerAge > 15000) phase = 'Work Optional Ready';
          else if (scorePerAge > 5000) phase = 'Transition Ready';

          setMetrics({ age, scorePerAge, phase, netWorth });
        }
      } catch (error) {
        console.error('Error parsing saved data:', error);
      }
    }
    setLoading(false);
  }, [searchParams]);

  if (loading) return <LoadingShell />;
  if (!extractedData || !metrics) return <MissingDataShell onBack={() => router.push('/')} />;
  return <FNA4FactorPlanning extractedData={extractedData} metrics={metrics} />;
}

export default function FNA4FactorsPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <FNA4FactorsContent />
    </Suspense>
  );
}
