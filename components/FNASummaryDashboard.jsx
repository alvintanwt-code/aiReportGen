'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, ScatterChart, Scatter, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function FNASummaryDashboard({ extractedData, onContinue }) {
  const [expandedSection, setExpandedSection] = useState(null);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const age = extractedData.personalInfo?.age || 0;
    const liquidAssets = (extractedData.assets?.cashSavings || 0) +
      (extractedData.assets?.cpfOA || 0) +
      (extractedData.assets?.cpfSA || 0) +
      (extractedData.assets?.cpfMA || 0) +
      (extractedData.assets?.equities || 0) +
      (extractedData.assets?.mutualFunds || 0);

    const totalAssets = liquidAssets +
      (extractedData.assets?.residentialPropertyValue || 0) +
      (extractedData.assets?.insuranceCashValue || 0);

    const totalLiabilities = (extractedData.liabilities?.loans || 0) +
      (extractedData.liabilities?.mortgage || 0);

    const netWorth = totalAssets - totalLiabilities;
    const scorePerAge = age > 0 ? netWorth / age : 0;

    // Determine phase
    let phase = 'Accumulation';
    let phaseColor = '#dc3545';
    let phaseDescription = 'Building foundation, needs growth';

    if (scorePerAge > 15000) {
      phase = 'Work Optional Ready';
      phaseColor = '#28a745';
      phaseDescription = 'Strong wealth, focus on legacy & security';
    } else if (scorePerAge > 5000) {
      phase = 'Transition Ready';
      phaseColor = '#ffc107';
      phaseDescription = 'Good foundation, can start passive income';
    }

    // Calculate debt ratio
    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

    // Calculate savings rate
    const monthlyIncome = extractedData.cashflow?.income || 0;
    const monthlyExpenses = extractedData.cashflow?.netExpenses || 0;
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    return {
      age,
      liquidAssets,
      totalAssets,
      totalLiabilities,
      netWorth,
      scorePerAge,
      phase,
      phaseColor,
      phaseDescription,
      debtRatio,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      savingsRate
    };
  }, [extractedData]);

  // Phase chart data
  const phaseChartData = [
    { phase: 'Accumulation', min: 0, max: 5000, fill: '#dc3545' },
    { phase: 'Transition', min: 5000, max: 15000, fill: '#ffc107' },
    { phase: 'Work Optional', min: 15000, max: 50000, fill: '#28a745' }
  ];

  // Asset breakdown
  const assetBreakdown = [
    { name: 'Cash', value: extractedData.assets?.cashSavings || 0 },
    { name: 'CPF', value: (extractedData.assets?.cpfOA || 0) + (extractedData.assets?.cpfSA || 0) + (extractedData.assets?.cpfMA || 0) },
    { name: 'Equities', value: extractedData.assets?.equities || 0 },
    { name: 'Mutual Funds', value: extractedData.assets?.mutualFunds || 0 },
    { name: 'Insurance', value: extractedData.assets?.insuranceCashValue || 0 },
    { name: 'Property', value: extractedData.assets?.residentialPropertyValue || 0 }
  ].filter(item => item.value > 0);

  const COLORS = ['#FF8F44', '#4a86e8', '#43d692', '#16a766', '#f691b3', '#ffc107'];

  // Insurance coverage data
  const lifeInsurance = extractedData.policies?.filter(p => p.type === 'life') || [];
  const totalSumAssured = lifeInsurance.reduce((sum, p) => sum + (p.sumAssuredDeath || 0), 0);
  const estimatedNeed = metrics.netWorth * 0.5; // Rough estimate
  const coverageRatio = estimatedNeed > 0 ? (totalSumAssured / estimatedNeed) * 100 : 0;

  const SectionCard = ({ title, children, expanded = false }) => (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e8e8e8',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '20px',
      transition: 'all 0.3s ease'
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#101b3a', marginBottom: '16px' }}>
        {title}
      </h3>
      {children}
    </div>
  );

  const MetricBox = ({ label, value, subtext, color = '#FF8F44' }) => (
    <div style={{
      flex: 1,
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '6px',
      textAlign: 'center',
      borderLeft: `4px solid ${color}`
    }}>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: '700', color: color, marginBottom: '4px' }}>{value}</p>
      {subtext && <p style={{ fontSize: '11px', color: '#999' }}>{subtext}</p>}
    </div>
  );

  return (
    <div style={{ padding: '40px 24px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#101b3a', marginBottom: '8px' }}>
          Financial Health Summary
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>
          {extractedData.personalInfo?.name || 'Client'} • Age {metrics.age}
        </p>
      </div>

      {/* Phase Classification */}
      <SectionCard title="📊 Financial Life Phase">
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            padding: '20px',
            backgroundColor: metrics.phaseColor,
            color: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Current Phase</p>
            <p style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>{metrics.phase}</p>
            <p style={{ fontSize: '13px', opacity: 0.95 }}>{metrics.phaseDescription}</p>
          </div>

          <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
            <strong>Score:</strong> ${(metrics.scorePerAge || 0).toLocaleString('en-SG', { maximumFractionDigits: 0 })} per year of age
          </p>

          {/* Phase Chart */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={phaseChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
              <XAxis dataKey="phase" fontSize={12} />
              <YAxis fontSize={12} label={{ value: 'S$ per year of age', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `S$${value.toLocaleString()}`} />
              <Bar dataKey="max" fill="#e8e8e8" />
              <Bar dataKey="min" fill="#FF8F44" />
            </BarChart>
          </ResponsiveContainer>

          {metrics.scorePerAge > 10000 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#d4edda', borderRadius: '6px', color: '#155724', fontSize: '13px' }}>
              ✅ <strong>Ahead of curve:</strong> Your networth is strong for your age. Consider building passive income streams and legacy planning.
            </div>
          )}
          {metrics.scorePerAge < 5000 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '6px', color: '#721c24', fontSize: '13px' }}>
              ⚠️ <strong>Building phase:</strong> Focus on growing your wealth through consistent savings and strategic investments.
            </div>
          )}
        </div>
      </SectionCard>

      {/* Key Metrics */}
      <SectionCard title="💰 Key Financial Metrics">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <MetricBox label="Net Worth" value={`S$${(metrics.netWorth / 1000000).toFixed(1)}M`} color="#4a86e8" />
          <MetricBox label="Liquid Assets" value={`S$${(metrics.liquidAssets / 1000000).toFixed(1)}M`} color="#43d692" />
          <MetricBox label="Total Assets" value={`S$${(metrics.totalAssets / 1000000).toFixed(1)}M`} color="#FF8F44" />
          <MetricBox label="Total Liabilities" value={`S$${(metrics.totalLiabilities / 1000).toFixed(0)}K`} color="#dc3545" />
        </div>
      </SectionCard>

      {/* Debt Ratio */}
      <SectionCard title="⚠️ Debt Ratio Analysis">
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>Total Liabilities vs Total Assets</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: metrics.debtRatio > 30 ? '#dc3545' : '#28a745', marginBottom: '8px' }}>
              {metrics.debtRatio.toFixed(1)}%
            </p>
            <p style={{ fontSize: '13px', color: '#666' }}>
              {metrics.debtRatio < 20 ? '✅ Healthy debt level' : metrics.debtRatio < 40 ? '🟡 Moderate debt level' : '⚠️ High debt level'}
            </p>
          </div>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `conic-gradient(${metrics.debtRatio > 30 ? '#dc3545' : metrics.debtRatio > 20 ? '#ffc107' : '#28a745'} ${metrics.debtRatio}%, #e8e8e8 ${metrics.debtRatio}%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: '700' }}>{metrics.debtRatio.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Savings Rate */}
      <SectionCard title="💸 Monthly Cashflow">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <MetricBox label="Monthly Income" value={`S$${(metrics.monthlyIncome).toLocaleString()}`} color="#43d692" />
          <MetricBox label="Monthly Expenses" value={`S$${(metrics.monthlyExpenses).toLocaleString()}`} color="#dc3545" />
          <MetricBox label="Monthly Savings" value={`S$${(metrics.monthlySavings).toLocaleString()}`} color={metrics.monthlySavings > 0 ? '#28a745' : '#dc3545'} />
          <MetricBox label="Savings Rate" value={`${metrics.savingsRate.toFixed(1)}%`} color="#4a86e8" />
        </div>
        {metrics.monthlySavings > 0 && (
          <div style={{ padding: '12px', backgroundColor: '#d4edda', borderRadius: '6px', color: '#155724', fontSize: '13px' }}>
            ✅ <strong>Good discipline:</strong> You're saving S${metrics.monthlySavings.toLocaleString()} monthly. Keep it up!
          </div>
        )}
        {metrics.monthlySavings <= 0 && (
          <div style={{ padding: '12px', backgroundColor: '#f8d7da', borderRadius: '6px', color: '#721c24', fontSize: '13px' }}>
            ⚠️ <strong>Opportunity:</strong> Expenses meet or exceed income. Consider optimizing budget or increasing income.
          </div>
        )}
      </SectionCard>

      {/* Asset Breakdown */}
      {assetBreakdown.length > 0 && (
        <SectionCard title="🏆 Asset Breakdown">
          <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={assetBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: S$${(value / 1000000).toFixed(1)}M`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `S$${(value / 1000000).toFixed(1)}M`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              {assetBreakdown.map((asset, index) => (
                <div key={index} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: COLORS[index % COLORS.length], borderRadius: '2px' }} />
                  <span style={{ fontSize: '13px', flex: 1 }}>{asset.name}</span>
                  <strong style={{ fontSize: '13px' }}>S${(asset.value / 1000000).toFixed(1)}M</strong>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Insurance Coverage */}
      {lifeInsurance.length > 0 && (
        <SectionCard title="🛡️ Insurance Coverage Check">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <MetricBox label="Total Life Insurance" value={`S$${(totalSumAssured / 1000000).toFixed(1)}M`} color="#4a86e8" />
            <MetricBox label="Estimated Need" value={`S$${(estimatedNeed / 1000000).toFixed(1)}M`} color="#ffc107" />
            <MetricBox label="Coverage Ratio" value={`${coverageRatio.toFixed(0)}%`} color={coverageRatio > 100 ? '#28a745' : '#dc3545'} />
          </div>
          {coverageRatio < 100 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '6px', color: '#721c24', fontSize: '13px' }}>
              ⚠️ <strong>Gap identified:</strong> Life insurance may not fully cover estimated needs. Consider reviewing coverage.
            </div>
          )}
        </SectionCard>
      )}

      {/* CTA */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
        <button
          onClick={onContinue}
          style={{
            padding: '14px 32px',
            backgroundColor: '#FF8F44',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#FF7A1F'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#FF8F44'}
        >
          View 4 Factor Planning Recommendations →
        </button>
      </div>
    </div>
  );
}
