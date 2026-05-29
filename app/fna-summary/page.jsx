'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import FNASummaryDashboard from '../../components/FNASummaryDashboard';

export default function FNASummaryPage() {
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!extractedData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>No data found. Please upload FNA screenshots first.</p>
        <button onClick={() => router.back()} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
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
          cashflow: extractedData.cashflow
        }));
        router.push(`/fna-4factors?clientId=${clientId}`);
      }}
    />
  );
}
