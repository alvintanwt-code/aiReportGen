'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import FNASummaryDashboard from '../../components/FNASummaryDashboard';

function FNASummaryFallback({ title, body, action }) {
  return (
    <div className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div className="dash-status">
        <div className="dash-status-title">{title}</div>
        {body && <div className="dash-section-sub" style={{ marginBottom: 0 }}>{body}</div>}
        {action}
      </div>
    </div>
  );
}

function FNASummaryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const savedData = sessionStorage.getItem(`fna_${clientId}`);
    if (savedData) {
      try {
        setExtractedData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error parsing saved data:', error);
      }
    }
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <FNASummaryFallback
        title="Loading summary"
        body="Pulling your extracted FNA data."
      />
    );
  }

  if (!extractedData) {
    return (
      <FNASummaryFallback
        title="No data found"
        body="Upload FNA screenshots from the dashboard first."
        action={
          <button className="dash-btn dash-btn-ghost" onClick={() => router.back()} style={{ marginTop: 12 }}>
            <ArrowLeft size={14} strokeWidth={2.2} />
            Go back
          </button>
        }
      />
    );
  }

  return (
    <FNASummaryDashboard
      extractedData={extractedData}
      onContinue={() => {
        const clientId = searchParams.get('clientId');
        sessionStorage.setItem(`fna_metrics_${clientId}`, JSON.stringify({
          age: extractedData.personalInfo?.age,
          assets: extractedData.assets,
          liabilities: extractedData.liabilities,
          cashflow: extractedData.cashflow,
        }));
        router.push(`/fna-4factors?clientId=${clientId}`);
      }}
    />
  );
}

export default function FNASummaryPage() {
  return (
    <Suspense fallback={<FNASummaryFallback title="Loading summary" />}>
      <FNASummaryContent />
    </Suspense>
  );
}
