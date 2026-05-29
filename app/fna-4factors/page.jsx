'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import FNA4FactorPlanning from '../../components/FNA4FactorPlanning';

export default function FNA4FactorsPage() {
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
          const liquidAssets = (metricsData.assets?.cashSavings || 0) +
            (metricsData.assets?.cpfOA || 0) +
            (metricsData.assets?.cpfSA || 0) +
            (metricsData.assets?.cpfMA || 0) +
            (metricsData.assets?.equities || 0) +
            (metricsData.assets?.mutualFunds || 0);

          const totalAssets = liquidAssets +
            (metricsData.assets?.residentialPropertyValue || 0) +
            (metricsData.assets?.insuranceCashValue || 0);

          const totalLiabilities = (metricsData.liabilities?.loans || 0) +
            (metricsData.liabilities?.mortgage || 0);

          const netWorth = totalAssets - totalLiabilities;
          const scorePerAge = age > 0 ? netWorth / age : 0;

          let phase = 'Accumulation';
          if (scorePerAge > 15000) {
            phase = 'Work Optional Ready';
          } else if (scorePerAge > 5000) {
            phase = 'Transition Ready';
          }

          setMetrics({ age, scorePerAge, phase, netWorth });
        }
      } catch (error) {
        console.error('Error parsing saved data:', error);
      }
    }

    setLoading(false);
  }, [searchParams]);

  if (loading || !extractedData || !metrics) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return <FNA4FactorPlanning extractedData={extractedData} metrics={metrics} />;
}
