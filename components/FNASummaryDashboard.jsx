'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function FNASummaryDashboard({ extractedData, onContinue }) {
  const router = useRouter();

  // Design tokens from project instructions
  const TOKENS = {
    bg: '#f6f8fa',
    surface: '#ffffff',
    surface2: '#f9fafb',
    border: '#e5e7eb',
    borderSoft: '#f0f2f4',
    inkPrimary: '#0f172a',
    inkSecondary: '#475569',
    inkTertiary: '#94a3b8',
    inkMuted: '#cbd5e1',
    brand: '#635bff',
    brandLight: '#ede9fe',
    positive: '#10b981',
    warning: '#f59e0b',
    negative: '#ef4444',
    shadowSm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    shadowMd: '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
  };

  // Domain concepts: wealth trajectory, life phases, net worth, passive income thresholds
  const PHASE_MATRIX = [
    {
      min: 0,
      max: 5000,
      label: 'Accumulation',
      description: 'Building foundation. Focus on savings and growth.'
    },
    {
      min: 5000,
      max: 15000,
      label: 'Transition Ready',
      description: 'Strong foundation. Passive income potential emerging.'
    },
    {
      min: 15000,
      max: Infinity,
      label: 'Work Optional',
      description: 'Wealth position strong. Focus on legacy and preservation.'
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
    const phaseIndex = PHASE_MATRIX.indexOf(phaseData);
    const phaseStart = phaseData.min;
    const phaseEnd = phaseData.max === Infinity ? 30000 : phaseData.max;
    const positionInPhase = Math.min(100, ((scorePerAge - phaseStart) / (phaseEnd - phaseStart)) * 100);
    const overallPosition = phaseIndex * 33.33 + (positionInPhase * 0.3333);

    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const monthlyIncome = extractedData.cashflow?.income || 0;
    const monthlyExpenses = extractedData.cashflow?.netExpenses || 0;
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    return {
      age, liquidAssets, totalAssets, totalLiabilities, netWorth, liquidNetWorth, scorePerAge,
      phase: phaseData.label, phaseDescription: phaseData.description,
      overallPosition, debtRatio, monthlyIncome, monthlyExpenses, monthlySavings, savingsRate
    };
  }, [extractedData]);

  const formatCurrency = (value) => `S$${Math.round(value).toLocaleString('en-SG')}`;

  const assetBreakdown = [
    { name: 'Cash', value: extractedData.assets?.cashSavings || 0 },
    { name: 'CPF', value: (extractedData.assets?.cpfOA || 0) + (extractedData.assets?.cpfSA || 0) + (extractedData.assets?.cpfMA || 0) },
    { name: 'Equities', value: extractedData.assets?.equities || 0 },
    { name: 'Funds', value: extractedData.assets?.mutualFunds || 0 },
    { name: 'Insurance', value: extractedData.assets?.insuranceCashValue || 0 },
    { name: 'Property', value: extractedData.assets?.residentialPropertyValue || 0 }
  ].filter(item => item.value > 0);

  const assetColors = [TOKENS.brand, TOKENS.positive, TOKENS.warning, TOKENS.inkTertiary, TOKENS.inkMuted, TOKENS.borderSoft];

  return (
    <div style={{ backgroundColor: TOKENS.bg, minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style>{`
        @import url('https://rsms.me/inter/inter.css');
        body { background-color: ${TOKENS.bg}; margin: 0; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 32px' }}>
        {/* Navigation context */}
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 16px',
            backgroundColor: TOKENS.surface,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            color: TOKENS.inkSecondary,
            marginBottom: '48px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = TOKENS.surface2;
            e.target.style.borderColor = TOKENS.borderSoft;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = TOKENS.surface;
            e.target.style.borderColor = TOKENS.border;
          }}
        >
          ← Back to Dashboard
        </button>

        {/* Page header with context */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '26px',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            color: TOKENS.inkPrimary,
            marginBottom: '8px'
          }}>
            Financial Health Summary
          </h1>
          <p style={{
            fontSize: '13px',
            fontWeight: '500',
            color: TOKENS.inkSecondary,
            margin: '0'
          }}>
            {extractedData.personalInfo?.name || 'Client'} • Age {metrics.age} • Generated today
          </p>
        </div>

        {/* HERO: Work Optional Index - Precision arc showing wealth trajectory */}
        <div style={{
          backgroundColor: TOKENS.surface,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '32px',
          boxShadow: TOKENS.shadowSm
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '48px' }}>
            {/* Left: Arc visualization */}
            <div style={{ flex: 1, minWidth: '260px' }}>
              <p style={{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                color: TOKENS.inkTertiary,
                letterSpacing: '0.07em',
                marginBottom: '24px',
                margin: '0 0 24px 0'
              }}>
                Work Optional Index
              </p>

              <svg viewBox="0 0 220 140" style={{ width: '100%', height: 'auto' }}>
                {/* Background arc */}
                <path d="M 30 130 A 100 100 0 0 1 190 130" fill="none" stroke={TOKENS.borderSoft} strokeWidth="12" strokeLinecap="round" />

                {/* Filled arc to current position */}
                <path
                  d="M 30 130 A 100 100 0 0 1 190 130"
                  fill="none"
                  stroke={TOKENS.brand}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(metrics.overallPosition / 100) * 502.4} 502.4`}
                />

                {/* Phase labels */}
                <text x="30" y="155" fontSize="11" fontWeight="500" fill={TOKENS.inkTertiary} textAnchor="middle">Accumulation</text>
                <text x="110" y="155" fontSize="11" fontWeight="500" fill={TOKENS.inkTertiary} textAnchor="middle">Transition</text>
                <text x="190" y="155" fontSize="11" fontWeight="500" fill={TOKENS.inkTertiary} textAnchor="middle">Work Optional</text>
              </svg>
            </div>

            {/* Right: Current position and context */}
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '32px' }}>
                <p style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  color: TOKENS.inkTertiary,
                  letterSpacing: '0.07em',
                  marginBottom: '8px',
                  margin: '0 0 8px 0'
                }}>
                  Your Index
                </p>
                <p style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: TOKENS.brand,
                  letterSpacing: '-0.02em',
                  margin: '0',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  ${(metrics.scorePerAge || 0).toLocaleString('en-SG', { maximumFractionDigits: 0 })}
                </p>
                <p style={{
                  fontSize: '11px',
                  color: TOKENS.inkTertiary,
                  margin: '4px 0 0 0'
                }}>
                  per year of age
                </p>
              </div>

              <div style={{ paddingTop: '24px', borderTop: `1px solid ${TOKENS.border}` }}>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: TOKENS.brand,
                  marginBottom: '8px',
                  margin: '0 0 8px 0'
                }}>
                  {metrics.phase}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: TOKENS.inkSecondary,
                  lineHeight: '1.65',
                  margin: '0'
                }}>
                  {metrics.phaseDescription}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key metrics with context */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[
            { label: 'Net Worth', value: formatCurrency(metrics.netWorth), color: TOKENS.brand },
            { label: 'Liquid Assets', value: formatCurrency(metrics.liquidAssets), color: TOKENS.positive },
            { label: 'Monthly Savings', value: formatCurrency(metrics.monthlySavings), color: metrics.monthlySavings > 0 ? TOKENS.positive : TOKENS.negative },
            { label: 'Debt Ratio', value: `${metrics.debtRatio.toFixed(1)}%`, color: metrics.debtRatio < 30 ? TOKENS.positive : metrics.debtRatio < 50 ? TOKENS.warning : TOKENS.negative }
          ].map((stat, idx) => (
            <div key={idx} style={{
              backgroundColor: TOKENS.surface,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: TOKENS.shadowSm
            }}>
              <p style={{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                color: TOKENS.inkTertiary,
                letterSpacing: '0.07em',
                marginBottom: '12px',
                margin: '0 0 12px 0'
              }}>
                {stat.label}
              </p>
              <p style={{
                fontSize: '19px',
                fontWeight: '700',
                color: stat.color,
                letterSpacing: '-0.02em',
                margin: '0',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Cashflow and assets in 2-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          marginBottom: '32px'
        }}>
          {/* Cashflow */}
          <div style={{
            backgroundColor: TOKENS.surface,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: '12px',
            padding: '24px',
            boxShadow: TOKENS.shadowSm
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: TOKENS.inkTertiary,
              letterSpacing: '0.07em',
              marginBottom: '24px',
              margin: '0 0 24px 0'
            }}>
              Monthly Cashflow
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Income', value: formatCurrency(metrics.monthlyIncome), icon: '→' },
                { label: 'Expenses', value: formatCurrency(metrics.monthlyExpenses), icon: '←' },
                { label: 'Savings Rate', value: `${metrics.savingsRate.toFixed(1)}%`, icon: '↑', color: metrics.savingsRate > 20 ? TOKENS.positive : TOKENS.warning }
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingBottom: '12px',
                  borderBottom: idx < 2 ? `1px solid ${TOKENS.borderSoft}` : 'none'
                }}>
                  <p style={{ fontSize: '13px', color: TOKENS.inkSecondary, margin: '0' }}>
                    {item.label}
                  </p>
                  <p style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: item.color || TOKENS.brand,
                    margin: '0',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Asset breakdown */}
          {assetBreakdown.length > 0 && (
            <div style={{
              backgroundColor: TOKENS.surface,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: '12px',
              padding: '24px',
              boxShadow: TOKENS.shadowSm,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <p style={{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                color: TOKENS.inkTertiary,
                letterSpacing: '0.07em',
                marginBottom: '20px',
                margin: '0 0 20px 0'
              }}>
                Asset Allocation
              </p>
              <div style={{ flex: 1, minHeight: '160px', marginBottom: '16px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={assetBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                      {assetBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={assetColors[index % assetColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {assetBreakdown.map((asset, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        backgroundColor: assetColors[idx % assetColors.length]
                      }} />
                      <span style={{ color: TOKENS.inkSecondary }}>{asset.name}</span>
                    </div>
                    <span style={{ color: TOKENS.brand, fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(asset.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={onContinue}
          style={{
            padding: '12px 24px',
            backgroundColor: TOKENS.brand,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#5348dd';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = TOKENS.shadowMd;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = TOKENS.brand;
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          View 4 Factor Planning →
        </button>
      </div>
    </div>
  );
}
