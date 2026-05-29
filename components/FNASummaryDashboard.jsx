'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FNASummaryDashboard({ extractedData, onContinue }) {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState(null);

  // Design tokens from system.md
  const COLORS = {
    navy: '#1e3a5f',
    offWhite: '#f9f7f5',
    taupe: '#8b8680',
    forestGreen: '#2d5016',
    gold: '#d4af37',
    softRed: '#c85c5c',
    warmGray: '#9a9a8f',
    mutedGray: '#b5b5aa',
    border: 'rgba(30, 58, 95, 0.08)',
    borderStrong: 'rgba(30, 58, 95, 0.12)',
  };

  // Dynamic Phase Scoring Matrix
  const PHASE_MATRIX = [
    {
      min: 0,
      max: 5000,
      phase: 'Accumulation',
      label: 'Building Foundation',
      color: COLORS.taupe,
      description: 'Focus on consistent savings and strategic growth investments'
    },
    {
      min: 5000,
      max: 15000,
      phase: 'Transition Ready',
      label: 'Growing Wealth',
      color: COLORS.gold,
      description: 'Good foundation established, can start building passive income'
    },
    {
      min: 15000,
      max: Infinity,
      phase: 'Work Optional Ready',
      label: 'Strong Position',
      color: COLORS.forestGreen,
      description: 'Strong wealth position, focus on legacy and security'
    }
  ];

  // Calculate key metrics
  const metrics = useMemo(() => {
    const age = extractedData.personalInfo?.age || 0;

    // Liquid assets (excludes property)
    const liquidAssets = (extractedData.assets?.cashSavings || 0) +
      (extractedData.assets?.cpfOA || 0) +
      (extractedData.assets?.cpfSA || 0) +
      (extractedData.assets?.cpfMA || 0) +
      (extractedData.assets?.equities || 0) +
      (extractedData.assets?.mutualFunds || 0) +
      (extractedData.assets?.insuranceCashValue || 0);

    // Total assets (includes property)
    const totalAssets = liquidAssets +
      (extractedData.assets?.residentialPropertyValue || 0);

    const totalLiabilities = (extractedData.liabilities?.loans || 0) +
      (extractedData.liabilities?.mortgage || 0);

    // Net worth (total)
    const netWorth = totalAssets - totalLiabilities;

    // Liquid net worth (for phase calculation - excludes property)
    const liquidNetWorth = liquidAssets - totalLiabilities;

    // Use liquid net worth for phase scoring
    const scorePerAge = age > 0 ? liquidNetWorth / age : 0;

    // Find phase using matrix (will be available in metrics)
    let phaseData = PHASE_MATRIX.find(p => scorePerAge >= p.min && scorePerAge < p.max) || PHASE_MATRIX[0];

    // Extract phase info (will calculate position in ring)
    const phaseIndex = PHASE_MATRIX.indexOf(phaseData);
    const phaseStart = phaseData.min;
    const phaseEnd = phaseData.max === Infinity ? 30000 : phaseData.max;
    const positionInPhase = ((scorePerAge - phaseStart) / (phaseEnd - phaseStart)) * 100;
    const overallPosition = phaseIndex * 33.33 + (positionInPhase * 0.3333);

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
      liquidNetWorth,
      scorePerAge,
      phase: phaseData.phase,
      phaseColor: phaseData.color,
      phaseDescription: phaseData.description,
      phaseLabel: phaseData.label,
      overallPosition,
      debtRatio,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      savingsRate
    };
  }, [extractedData]);

  // Format currency
  const formatCurrency = (value) => {
    return `S$${Math.round(value).toLocaleString('en-SG')}`;
  };

  // Asset breakdown
  const assetBreakdown = [
    { name: 'Cash', value: extractedData.assets?.cashSavings || 0 },
    { name: 'CPF', value: (extractedData.assets?.cpfOA || 0) + (extractedData.assets?.cpfSA || 0) + (extractedData.assets?.cpfMA || 0) },
    { name: 'Equities', value: extractedData.assets?.equities || 0 },
    { name: 'Mutual Funds', value: extractedData.assets?.mutualFunds || 0 },
    { name: 'Insurance', value: extractedData.assets?.insuranceCashValue || 0 },
    { name: 'Property', value: extractedData.assets?.residentialPropertyValue || 0 }
  ].filter(item => item.value > 0);

  const assetColors = ['#d4af37', '#1e3a5f', '#2d5016', '#8b8680', '#9a9a8f', '#b5b5aa'];

  // Insurance coverage data
  const lifeInsurance = extractedData.policies?.filter(p => p.type === 'life') || [];
  const totalSumAssured = lifeInsurance.reduce((sum, p) => sum + (p.sumAssuredDeath || 0), 0);
  const estimatedNeed = metrics.liquidNetWorth * 0.5;
  const coverageRatio = estimatedNeed > 0 ? (totalSumAssured / estimatedNeed) * 100 : 0;

  // SectionCard component
  const SectionCard = ({ title, children }) => (
    <div style={{
      backgroundColor: COLORS.offWhite,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '700',
        fontFamily: 'Georgia, serif',
        color: COLORS.navy,
        marginBottom: '16px',
        margin: '0 0 16px 0'
      }}>
        {title}
      </h3>
      {children}
    </div>
  );

  // MetricBox component
  const MetricBox = ({ label, value, subtext, color = COLORS.navy }) => (
    <div style={{
      flex: 1,
      padding: '16px',
      backgroundColor: 'rgba(249, 247, 245, 0.6)',
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      textAlign: 'center',
      minWidth: '140px'
    }}>
      <p style={{
        fontSize: '13px',
        color: COLORS.mutedGray,
        marginBottom: '8px',
        margin: '0 0 8px 0'
      }}>
        {label}
      </p>
      <p style={{
        fontSize: '24px',
        fontWeight: '700',
        color: color,
        marginBottom: '4px',
        margin: '0 0 4px 0'
      }}>
        {value}
      </p>
      {subtext && <p style={{ fontSize: '11px', color: COLORS.mutedGray, margin: '0' }}>{subtext}</p>}
    </div>
  );

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        body { background-color: ${COLORS.offWhite}; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Main Container with max-width */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 16px',
            backgroundColor: 'white',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '22px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: COLORS.navy,
            marginBottom: '40px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = COLORS.offWhite;
            e.target.style.borderColor = COLORS.borderStrong;
            e.target.style.transform = 'translateX(-4px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white';
            e.target.style.borderColor = COLORS.border;
            e.target.style.transform = 'translateX(0)';
          }}
        >
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div style={{ marginBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
        <h1 style={{
          fontSize: '40px',
          fontWeight: '700',
          fontFamily: 'Georgia, serif',
          color: COLORS.navy,
          marginBottom: '8px',
          margin: '0 0 8px 0'
        }}>
          Financial Health Summary
        </h1>
        <p style={{
          fontSize: '16px',
          color: COLORS.warmGray,
          margin: '0'
        }}>
          <strong style={{ color: COLORS.navy }}>{extractedData.personalInfo?.name || 'Client'}</strong> • Age {metrics.age}
        </p>
      </div>

      {/* HERO: Work Optional Index Ring */}
      <div style={{
        backgroundColor: 'white',
        border: `1px solid ${COLORS.border}`,
        borderRadius: '16px',
        padding: '40px',
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: COLORS.warmGray,
          marginBottom: '32px',
          margin: '0 0 32px 0'
        }}>
          Work Optional Index
        </h2>

        {/* Ring Visualization */}
        <div style={{ position: 'relative', width: '280px', height: '280px', margin: '0 auto 32px' }}>
          <svg viewBox="0 0 280 280" style={{ width: '100%', height: '100%' }}>
            {/* Background ring segments */}
            {PHASE_MATRIX.map((phase, idx) => {
              const startAngle = idx * 120;
              const endAngle = (idx + 1) * 120;
              const startRad = (startAngle - 90) * (Math.PI / 180);
              const endRad = (endAngle - 90) * (Math.PI / 180);
              const r = 120;
              const x1 = 140 + r * Math.cos(startRad);
              const y1 = 140 + r * Math.sin(startRad);
              const x2 = 140 + r * Math.cos(endRad);
              const y2 = 140 + r * Math.sin(endRad);

              return (
                <path
                  key={`segment-${idx}`}
                  d={`M 140 140 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                  fill={phase.color}
                  opacity="0.2"
                  stroke={phase.color}
                  strokeWidth="2"
                />
              );
            })}

            {/* Client position indicator */}
            <circle cx="140" cy="140" r="110" fill="none" stroke={COLORS.border} strokeWidth="1" opacity="0.3" />
            {(() => {
              const angle = (metrics.overallPosition / 100) * 360 - 90;
              const rad = angle * (Math.PI / 180);
              const r = 110;
              const x = 140 + r * Math.cos(rad);
              const y = 140 + r * Math.sin(rad);
              return (
                <>
                  <circle cx={x} cy={y} r="8" fill={metrics.phaseColor} />
                  <circle cx={x} cy={y} r="12" fill="none" stroke={metrics.phaseColor} strokeWidth="2" opacity="0.5" />
                </>
              );
            })()}

            {/* Center circle */}
            <circle cx="140" cy="140" r="60" fill={COLORS.offWhite} stroke={COLORS.border} strokeWidth="1" />

            {/* Phase labels on ring */}
            {PHASE_MATRIX.map((phase, idx) => {
              const angle = (idx * 120 + 60) * (Math.PI / 180) - Math.PI / 2;
              const r = 155;
              const x = 140 + r * Math.cos(angle);
              const y = 140 + r * Math.sin(angle);
              return (
                <text
                  key={`label-${idx}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={phase.color}
                >
                  {phase.label}
                </text>
              );
            })}
          </svg>

          {/* Center content */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '12px', color: COLORS.warmGray, margin: '0 0 4px 0' }}>Your Index</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: metrics.phaseColor, margin: '0' }}>
              ${(metrics.scorePerAge || 0).toLocaleString('en-SG', { maximumFractionDigits: 0 })}
            </p>
            <p style={{ fontSize: '10px', color: COLORS.mutedGray, margin: '4px 0 0 0' }}>per year of age</p>
          </div>
        </div>

        {/* Phase Info */}
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            fontFamily: 'Georgia, serif',
            color: metrics.phaseColor,
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            {metrics.phaseLabel}
          </h3>
          <p style={{
            fontSize: '14px',
            color: COLORS.navy,
            lineHeight: '1.6',
            margin: '0'
          }}>
            {metrics.phaseDescription}
          </p>
        </div>
      </div>


      {/* Key Metrics */}
      <SectionCard title="💰 Key Financial Metrics">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <MetricBox label="Net Worth" value={formatCurrency(metrics.netWorth)} color={COLORS.navy} />
          <MetricBox label="Liquid Assets" value={formatCurrency(metrics.liquidAssets)} color={COLORS.forestGreen} />
          <MetricBox label="Total Assets" value={formatCurrency(metrics.totalAssets)} color={COLORS.gold} />
          <MetricBox label="Total Liabilities" value={formatCurrency(metrics.totalLiabilities)} color={COLORS.softRed} />
        </div>
      </SectionCard>

      {/* Debt Ratio */}
      <SectionCard title="⚠️ Debt Ratio Analysis">
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', color: COLORS.warmGray, marginBottom: '12px', margin: '0 0 12px 0' }}>Total Liabilities vs Total Assets</p>
            <p style={{
              fontSize: '28px',
              fontWeight: '700',
              color: metrics.debtRatio > 30 ? COLORS.softRed : COLORS.forestGreen,
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              {metrics.debtRatio.toFixed(1)}%
            </p>
            <p style={{ fontSize: '13px', color: COLORS.warmGray, margin: '0' }}>
              {metrics.debtRatio < 20 ? '✅ Healthy debt level' : metrics.debtRatio < 40 ? '🟡 Moderate debt level' : '⚠️ High debt level'}
            </p>
          </div>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `conic-gradient(${metrics.debtRatio > 30 ? COLORS.softRed : metrics.debtRatio > 20 ? COLORS.gold : COLORS.forestGreen} ${metrics.debtRatio}%, ${COLORS.taupe} ${metrics.debtRatio}%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `3px solid ${COLORS.border}`
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: '700', color: COLORS.navy, margin: '0' }}>{metrics.debtRatio.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Savings Rate */}
      <SectionCard title="💸 Monthly Cashflow">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <MetricBox label="Monthly Income" value={formatCurrency(metrics.monthlyIncome)} color={COLORS.forestGreen} />
          <MetricBox label="Monthly Expenses" value={formatCurrency(metrics.monthlyExpenses)} color={COLORS.softRed} />
          <MetricBox label="Monthly Savings" value={formatCurrency(metrics.monthlySavings)} color={metrics.monthlySavings > 0 ? COLORS.forestGreen : COLORS.softRed} />
          <MetricBox label="Savings Rate" value={`${metrics.savingsRate.toFixed(1)}%`} color={COLORS.navy} />
        </div>
        {metrics.monthlySavings > 0 && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(45, 80, 22, 0.08)', border: `1px solid ${COLORS.forestGreen}`, borderRadius: '8px', color: COLORS.forestGreen, fontSize: '13px' }}>
            ✅ <strong>Good discipline:</strong> You're saving {formatCurrency(metrics.monthlySavings)} monthly. Keep it up!
          </div>
        )}
        {metrics.monthlySavings <= 0 && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(200, 92, 92, 0.08)', border: `1px solid ${COLORS.softRed}`, borderRadius: '8px', color: COLORS.softRed, fontSize: '13px' }}>
            ⚠️ <strong>Opportunity:</strong> Expenses meet or exceed income. Consider optimizing budget or increasing income.
          </div>
        )}
      </SectionCard>

      {/* Asset Breakdown */}
      {assetBreakdown.length > 0 && (
        <SectionCard title="🏆 Asset Breakdown">
          <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={assetBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill={COLORS.navy}
                    dataKey="value"
                  >
                    {assetBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={assetColors[index % assetColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              {assetBreakdown.map((asset, index) => (
                <div key={index} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: assetColors[index % assetColors.length], borderRadius: '2px' }} />
                  <span style={{ fontSize: '13px', flex: 1, color: COLORS.navy }}>{asset.name}</span>
                  <strong style={{ fontSize: '13px', color: COLORS.navy }}>{formatCurrency(asset.value)}</strong>
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
            <MetricBox label="Total Life Insurance" value={formatCurrency(totalSumAssured)} color={COLORS.navy} />
            <MetricBox label="Estimated Need" value={formatCurrency(estimatedNeed)} color={COLORS.gold} />
            <MetricBox label="Coverage Ratio" value={`${coverageRatio.toFixed(0)}%`} color={coverageRatio > 100 ? COLORS.forestGreen : COLORS.softRed} />
          </div>
          {coverageRatio < 100 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(200, 92, 92, 0.08)', border: `1px solid ${COLORS.softRed}`, borderRadius: '8px', color: COLORS.softRed, fontSize: '13px' }}>
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
              backgroundColor: COLORS.navy,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#162d47';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = COLORS.navy;
              e.target.style.transform = 'translateY(0)';
            }}
          >
            View 4 Factor Planning Recommendations →
          </button>
        </div>
      </div>
    </div>
  );
}
