'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function FNASummaryDashboard({ extractedData, onContinue }) {
  const router = useRouter();

  // BRUTALIST COLOR PALETTE
  const COLORS = {
    grey: '#e8e8e8',        // Background
    white: '#ffffff',       // Cards
    black: '#000000',       // Text
    darkGrey: '#333333',    // Dark text
    navy: '#1e3a5f',        // SINGLE accent
    border: '#cccccc',      // Hard borders
  };

  // Dynamic Phase Scoring Matrix - BRUTALIST
  const PHASE_MATRIX = [
    {
      min: 0,
      max: 5000,
      phase: 'Accumulation',
      label: 'ACCUMULATION',
      description: 'Building foundation. Focus on consistent savings and growth.'
    },
    {
      min: 5000,
      max: 15000,
      phase: 'Transition Ready',
      label: 'TRANSITION READY',
      description: 'Good foundation established. Build passive income streams.'
    },
    {
      min: 15000,
      max: Infinity,
      phase: 'Work Optional Ready',
      label: 'WORK OPTIONAL READY',
      description: 'Strong wealth position. Focus on legacy and security.'
    }
  ];

  // Calculate metrics
  const metrics = useMemo(() => {
    const age = extractedData.personalInfo?.age || 0;

    const liquidAssets = (extractedData.assets?.cashSavings || 0) +
      (extractedData.assets?.cpfOA || 0) +
      (extractedData.assets?.cpfSA || 0) +
      (extractedData.assets?.cpfMA || 0) +
      (extractedData.assets?.equities || 0) +
      (extractedData.assets?.mutualFunds || 0) +
      (extractedData.assets?.insuranceCashValue || 0);

    const totalAssets = liquidAssets + (extractedData.assets?.residentialPropertyValue || 0);
    const totalLiabilities = (extractedData.liabilities?.loans || 0) + (extractedData.liabilities?.mortgage || 0);
    const netWorth = totalAssets - totalLiabilities;
    const liquidNetWorth = liquidAssets - totalLiabilities;
    const scorePerAge = age > 0 ? liquidNetWorth / age : 0;

    const phaseData = PHASE_MATRIX.find(p => scorePerAge >= p.min && scorePerAge < p.max) || PHASE_MATRIX[0];
    const phaseStart = phaseData.min;
    const phaseEnd = phaseData.max === Infinity ? 30000 : phaseData.max;
    const positionInPhase = ((scorePerAge - phaseStart) / (phaseEnd - phaseStart)) * 100;
    const overallPosition = PHASE_MATRIX.indexOf(phaseData) * 33.33 + (positionInPhase * 0.3333);

    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const monthlyIncome = extractedData.cashflow?.income || 0;
    const monthlyExpenses = extractedData.cashflow?.netExpenses || 0;
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    return {
      age, liquidAssets, totalAssets, totalLiabilities, netWorth, liquidNetWorth, scorePerAge,
      phase: phaseData.phase, phaseLabel: phaseData.label, phaseDescription: phaseData.description,
      overallPosition, debtRatio, monthlyIncome, monthlyExpenses, monthlySavings, savingsRate
    };
  }, [extractedData]);

  const formatCurrency = (value) => `S$${Math.round(value).toLocaleString('en-SG')}`;

  const assetBreakdown = [
    { name: 'Cash', value: extractedData.assets?.cashSavings || 0 },
    { name: 'CPF', value: (extractedData.assets?.cpfOA || 0) + (extractedData.assets?.cpfSA || 0) + (extractedData.assets?.cpfMA || 0) },
    { name: 'Equities', value: extractedData.assets?.equities || 0 },
    { name: 'Mutual Funds', value: extractedData.assets?.mutualFunds || 0 },
    { name: 'Insurance', value: extractedData.assets?.insuranceCashValue || 0 },
    { name: 'Property', value: extractedData.assets?.residentialPropertyValue || 0 }
  ].filter(item => item.value > 0);

  const assetColors = ['#000000', '#1e3a5f', '#333333', '#666666', '#999999', '#cccccc'];

  return (
    <div style={{ backgroundColor: COLORS.grey, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        body { background-color: ${COLORS.grey}; margin: 0; }
        * { box-sizing: border-box; }
        h1, h2, h3 { margin: 0; font-weight: 900; letter-spacing: -0.02em; }
        p { margin: 0; }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 40px' }}>
        {/* Back Button - BRUTALIST */}
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '12px 24px',
            backgroundColor: COLORS.white,
            border: `2px solid ${COLORS.black}`,
            borderRadius: '0px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            color: COLORS.black,
            marginBottom: '60px',
            transition: 'all 0.1s',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = COLORS.black;
            e.target.style.color = COLORS.white;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = COLORS.white;
            e.target.style.color = COLORS.black;
          }}
        >
          ← Back
        </button>

        {/* Header - BRUTALIST */}
        <div style={{ marginBottom: '80px', borderBottom: `3px solid ${COLORS.black}`, paddingBottom: '40px' }}>
          <h1 style={{ fontSize: '56px', color: COLORS.black, marginBottom: '8px' }}>
            FINANCIAL HEALTH SUMMARY
          </h1>
          <p style={{ fontSize: '16px', color: COLORS.darkGrey, fontFamily: 'monospace' }}>
            {extractedData.personalInfo?.name || 'CLIENT'} • AGE {metrics.age}
          </p>
        </div>

        {/* HERO: Work Optional Index Ring - BRUTALIST */}
        <div style={{
          backgroundColor: COLORS.white,
          border: `3px solid ${COLORS.black}`,
          borderRadius: '0px',
          padding: '60px 40px',
          marginBottom: '60px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '18px', color: COLORS.black, marginBottom: '50px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Work Optional Index
          </h2>

          {/* Ring - STRIPPED BRUTALIST */}
          <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto 50px' }}>
            <svg viewBox="0 0 280 280" style={{ width: '100%', height: '100%' }}>
              {/* Hard geometric ring segments */}
              {PHASE_MATRIX.map((phase, idx) => {
                const startAngle = idx * 120;
                const endAngle = (idx + 1) * 120;
                const startRad = (startAngle - 90) * (Math.PI / 180);
                const endRad = (endAngle - 90) * (Math.PI / 180);
                const innerR = 85;
                const outerR = 120;

                const x1Inner = 140 + innerR * Math.cos(startRad);
                const y1Inner = 140 + innerR * Math.sin(startRad);
                const x2Inner = 140 + innerR * Math.cos(endRad);
                const y2Inner = 140 + innerR * Math.sin(endRad);

                const x1Outer = 140 + outerR * Math.cos(startRad);
                const y1Outer = 140 + outerR * Math.sin(startRad);
                const x2Outer = 140 + outerR * Math.cos(endRad);
                const y2Outer = 140 + outerR * Math.sin(endRad);

                const fillColor = idx === 1 ? COLORS.navy : COLORS.black;

                return (
                  <path
                    key={`segment-${idx}`}
                    d={`M ${x1Inner} ${y1Inner} A ${innerR} ${innerR} 0 0 1 ${x2Inner} ${y2Inner} L ${x2Outer} ${y2Outer} A ${outerR} ${outerR} 0 0 0 ${x1Outer} ${y1Outer} Z`}
                    fill={idx === 1 ? COLORS.navy : 'none'}
                    stroke={COLORS.black}
                    strokeWidth="2"
                    opacity={idx === 1 ? 1 : 0.3}
                  />
                );
              })}

              {/* Position indicator - HARD and BOLD */}
              {(() => {
                const angle = (metrics.overallPosition / 100) * 360 - 90;
                const rad = angle * (Math.PI / 180);
                const r = 102;
                const x = 140 + r * Math.cos(rad);
                const y = 140 + r * Math.sin(rad);
                return (
                  <>
                    <circle cx={x} cy={y} r="12" fill={COLORS.navy} />
                    <circle cx={x} cy={y} r="12" fill="none" stroke={COLORS.black} strokeWidth="2" />
                  </>
                );
              })()}

              {/* Center circle */}
              <circle cx="140" cy="140" r="60" fill={COLORS.white} stroke={COLORS.black} strokeWidth="2" />

              {/* Phase labels */}
              {PHASE_MATRIX.map((phase, idx) => {
                const angle = (idx * 120 + 60) * (Math.PI / 180) - Math.PI / 2;
                const r = 158;
                const x = 140 + r * Math.cos(angle);
                const y = 140 + r * Math.sin(angle);
                return (
                  <text
                    key={`label-${idx}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="9"
                    fontWeight="900"
                    fill={COLORS.black}
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                  >
                    {phase.label.split(' ')[0]}
                  </text>
                );
              })}
            </svg>

            {/* Center display */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '11px', color: COLORS.darkGrey, margin: '0 0 4px 0', fontFamily: 'monospace', textTransform: 'uppercase' }}>Index</p>
              <p style={{ fontSize: '32px', fontWeight: '900', color: COLORS.navy, margin: '0', fontFamily: 'monospace' }}>
                ${(metrics.scorePerAge || 0).toLocaleString('en-SG', { maximumFractionDigits: 0 })}
              </p>
              <p style={{ fontSize: '9px', color: COLORS.darkGrey, margin: '4px 0 0 0', fontFamily: 'monospace' }}>per year</p>
            </div>
          </div>

          {/* Phase Info */}
          <div>
            <h3 style={{ fontSize: '24px', color: COLORS.navy, marginBottom: '16px', letterSpacing: '-0.02em' }}>
              {metrics.phaseLabel}
            </h3>
            <p style={{ fontSize: '13px', color: COLORS.darkGrey, lineHeight: '1.8', maxWidth: '600px', margin: '0 auto' }}>
              {metrics.phaseDescription}
            </p>
          </div>
        </div>

        {/* Key Metrics - BRUTALIST GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '60px'
        }}>
          {[
            { label: 'Net Worth', value: formatCurrency(metrics.netWorth) },
            { label: 'Liquid Assets', value: formatCurrency(metrics.liquidAssets) },
            { label: 'Total Assets', value: formatCurrency(metrics.totalAssets) },
            { label: 'Liabilities', value: formatCurrency(metrics.totalLiabilities) }
          ].map((metric, idx) => (
            <div key={idx} style={{
              backgroundColor: COLORS.white,
              border: `2px solid ${COLORS.black}`,
              borderRadius: '0px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '11px', color: COLORS.darkGrey, marginBottom: '12px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                {metric.label}
              </p>
              <p style={{ fontSize: '18px', fontWeight: '900', color: COLORS.navy, margin: '0', fontFamily: 'monospace' }}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        {/* Debt Ratio */}
        <div style={{
          backgroundColor: COLORS.white,
          border: `2px solid ${COLORS.black}`,
          borderRadius: '0px',
          padding: '40px',
          marginBottom: '60px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Debt Ratio
            </h3>
            <p style={{ fontSize: '14px', color: COLORS.darkGrey, marginBottom: '12px' }}>Total Liabilities vs Assets</p>
            <p style={{ fontSize: '48px', fontWeight: '900', color: COLORS.navy, margin: '0', fontFamily: 'monospace' }}>
              {metrics.debtRatio.toFixed(0)}%
            </p>
            <p style={{ fontSize: '12px', color: COLORS.darkGrey, marginTop: '12px' }}>
              {metrics.debtRatio < 20 ? 'HEALTHY' : metrics.debtRatio < 40 ? 'MODERATE' : 'HIGH'}
            </p>
          </div>
          <div style={{
            width: '100%',
            height: '200px',
            backgroundColor: COLORS.grey,
            border: `2px solid ${COLORS.border}`,
            borderRadius: '0px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="none" stroke={COLORS.border} strokeWidth="2" />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={COLORS.navy}
                strokeWidth="3"
                strokeDasharray={`${(metrics.debtRatio / 100) * 502.4} 502.4`}
                strokeLinecap="butt"
                transform="rotate(-90 100 100)"
              />
              <text x="100" y="105" textAnchor="middle" fontSize="24" fontWeight="900" fill={COLORS.navy} fontFamily="monospace">
                {metrics.debtRatio.toFixed(0)}%
              </text>
            </svg>
          </div>
        </div>

        {/* Monthly Cashflow */}
        <div style={{
          backgroundColor: COLORS.white,
          border: `2px solid ${COLORS.black}`,
          borderRadius: '0px',
          padding: '40px',
          marginBottom: '60px'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Monthly Cashflow
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px'
          }}>
            {[
              { label: 'Income', value: formatCurrency(metrics.monthlyIncome) },
              { label: 'Expenses', value: formatCurrency(metrics.monthlyExpenses) },
              { label: 'Savings', value: formatCurrency(metrics.monthlySavings) },
              { label: 'Rate', value: `${metrics.savingsRate.toFixed(1)}%` }
            ].map((item, idx) => (
              <div key={idx} style={{
                borderBottom: `2px solid ${COLORS.border}`,
                paddingBottom: '16px'
              }}>
                <p style={{ fontSize: '11px', color: COLORS.darkGrey, marginBottom: '8px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  {item.label}
                </p>
                <p style={{ fontSize: '18px', fontWeight: '900', color: COLORS.navy, fontFamily: 'monospace' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Breakdown */}
        {assetBreakdown.length > 0 && (
          <div style={{
            backgroundColor: COLORS.white,
            border: `2px solid ${COLORS.black}`,
            borderRadius: '0px',
            padding: '40px',
            marginBottom: '60px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            alignItems: 'start'
          }}>
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Asset Breakdown
              </h3>
              {assetBreakdown.map((asset, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{asset.name}</span>
                  <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: '700', color: COLORS.navy }}>{formatCurrency(asset.value)}</span>
                </div>
              ))}
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={assetBreakdown} cx="50%" cy="50%" outerRadius={90} fill={COLORS.navy} dataKey="value">
                    {assetBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={assetColors[index % assetColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: COLORS.white, border: `2px solid ${COLORS.black}` }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CTA Button - BRUTALIST */}
        <button
          onClick={onContinue}
          style={{
            padding: '16px 40px',
            backgroundColor: COLORS.navy,
            color: COLORS.white,
            border: `3px solid ${COLORS.navy}`,
            borderRadius: '0px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '900',
            transition: 'all 0.1s',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '60px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = COLORS.white;
            e.target.style.color = COLORS.navy;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = COLORS.navy;
            e.target.style.color = COLORS.white;
          }}
        >
          → 4 Factor Planning
        </button>
      </div>
    </div>
  );
}
