'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { auth } from '../lib/firebase';
import { saveFNASummary } from '../lib/firebaseUtils';

export default function FNASummaryDashboard({ extractedData, onContinue }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [isSaving, setIsSaving] = useState(false);

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

  // 3 main phases with 0-100 scoring
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
    const personalLoans = extractedData.liabilities?.loans || 0;
    const propertyMortgage = extractedData.liabilities?.mortgage || 0;
    const totalLiabilities = personalLoans + propertyMortgage;
    const netWorth = totalAssets - totalLiabilities;
    // For Work Optional Index: exclude property mortgage (debt tied to excluded asset)
    const liquidNetWorth = liquidAssets - personalLoans;
    const scorePerAge = age > 0 ? liquidNetWorth / age : 0;

    const phaseData = PHASE_MATRIX.find(p => scorePerAge >= p.min && scorePerAge < p.max) || PHASE_MATRIX[0];
    const phaseIndex = PHASE_MATRIX.indexOf(phaseData);
    const phaseStart = phaseData.min;
    const phaseEnd = phaseData.max === Infinity ? 30000 : phaseData.max;
    const positionInPhase = Math.min(100, ((scorePerAge - phaseStart) / (phaseEnd - phaseStart)) * 100);
    // Score out of 100: Phase-based with position within phase
    // Accumulation (0-5k): 0-33, Transition (5k-15k): 34-66, Work Optional (15k+): 67-100
    const scoreOut100 = Math.min(100, phaseIndex * 33.33 + (positionInPhase * 0.3333));

    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const monthlyIncome = extractedData.cashflow?.income || 0;
    const monthlyExpenses = extractedData.cashflow?.netExpenses || 0;
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    return {
      age, liquidAssets, totalAssets, totalLiabilities, netWorth, liquidNetWorth, scorePerAge,
      phase: phaseData.label, phaseDescription: phaseData.description,
      scoreOut100, positionInPhase, debtRatio, monthlyIncome, monthlyExpenses, monthlySavings, savingsRate
    };
  }, [extractedData]);

  // Auto-save FNA summary to Firebase
  useEffect(() => {
    const autoSave = async () => {
      if (!auth.currentUser || !clientId || !extractedData) return;

      setIsSaving(true);
      try {
        await saveFNASummary(
          auth.currentUser.uid,
          clientId,
          extractedData.personalInfo?.name || 'Client',
          extractedData,
          metrics
        );
        console.log('✓ FNA Summary auto-saved');
      } catch (error) {
        console.error('Failed to auto-save FNA summary:', error);
      } finally {
        setIsSaving(false);
      }
    };

    autoSave();
  }, [clientId, extractedData, metrics]);

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

        {/* HERO: Work Optional Index - Wealth Trajectory with Momentum */}
        <div style={{
          backgroundColor: TOKENS.surface,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: '12px',
          padding: '48px',
          marginBottom: '48px',
          boxShadow: TOKENS.shadowSm
        }}>
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(-10px); }
              to { opacity: 1; transform: translateX(0); }
            }
            .hero-arc { animation: slideIn 0.6s ease-out 0.1s both; }
          `}</style>

          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <p style={{
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: TOKENS.inkTertiary,
              letterSpacing: '0.07em',
              marginBottom: '12px',
              margin: '0 0 12px 0'
            }}>
              Wealth Trajectory
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
              <h2 style={{
                fontSize: '26px',
                fontWeight: '700',
                letterSpacing: '-0.02em',
                color: TOKENS.inkPrimary,
                margin: '0'
              }}>
                Work Optional Index
              </h2>
              <p style={{
                fontSize: '13px',
                color: TOKENS.inkSecondary,
                margin: '0'
              }}>
                Shows your position on the wealth journey
              </p>
            </div>
          </div>

          {/* Two-column layout: Arc + Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>
            {/* LEFT: Arc with Phase Visualization */}
            <div className="hero-arc">
              <svg viewBox="0 0 280 160" style={{ width: '100%', height: 'auto' }}>
                {/* Background arc - full track */}
                <path
                  d="M 40 140 A 120 120 0 0 1 240 140"
                  fill="none"
                  stroke={TOKENS.borderSoft}
                  strokeWidth="14"
                  strokeLinecap="round"
                />

                {/* Progress arc - filled to current position */}
                <path
                  d="M 40 140 A 120 120 0 0 1 240 140"
                  fill="none"
                  stroke={TOKENS.brand}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${(metrics.scoreOut100 / 100) * 628} 628`}
                  style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                />

                {/* Phase markers (10 checkpoints at 10% intervals) */}
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((pos, idx) => {
                  const angle = (pos / 100) * Math.PI;
                  const x = 140 + Math.cos(Math.PI - angle) * 120;
                  const y = 140 + Math.sin(Math.PI - angle) * 120;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={metrics.scoreOut100 >= pos ? TOKENS.brand : TOKENS.borderSoft}
                    />
                  );
                })}

                {/* Current position indicator (circle) */}
                {(() => {
                  const progress = metrics.scoreOut100 / 100;
                  const angle = progress * Math.PI;
                  const x = 140 + Math.cos(Math.PI - angle) * 120;
                  const y = 140 + Math.sin(Math.PI - angle) * 120;
                  return (
                    <g>
                      {/* Glow */}
                      <circle cx={x} cy={y} r="12" fill={TOKENS.brand} opacity="0.15" />
                      {/* Marker */}
                      <circle cx={x} cy={y} r="8" fill={TOKENS.brand} stroke={TOKENS.surface} strokeWidth="2" />
                    </g>
                  );
                })()}

                {/* Phase labels with better positioning */}
                <text x="40" y="165" fontSize="11" fontWeight="500" fill={TOKENS.inkSecondary} textAnchor="middle">Accumulation</text>
                <text x="140" y="25" fontSize="11" fontWeight="500" fill={TOKENS.inkSecondary} textAnchor="middle">Transition Ready</text>
                <text x="240" y="165" fontSize="11" fontWeight="500" fill={TOKENS.inkSecondary} textAnchor="middle">Work Optional</text>
              </svg>

              {/* Band Progress Indicator */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: TOKENS.inkTertiary,
                    margin: '0'
                  }}>
                    Progress within band
                  </p>
                  <p style={{
                    fontSize: '19px',
                    fontWeight: '700',
                    color: TOKENS.brand,
                    margin: '4px 0 0 0',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {Math.round(metrics.positionInPhase)}%
                  </p>
                </div>
                <div style={{
                  flex: 1,
                  height: '4px',
                  backgroundColor: TOKENS.borderSoft,
                  borderRadius: '2px',
                  marginLeft: '16px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round(metrics.positionInPhase)}%`,
                    backgroundColor: TOKENS.brand,
                    transition: 'width 0.8s ease-out'
                  }} />
                </div>
              </div>
            </div>

            {/* RIGHT: Key Metrics + Phase Context */}
            <div>
              {/* Work Optional Index Score */}
              <div style={{
                backgroundColor: TOKENS.brandLight,
                border: `1px solid rgba(99, 91, 255, 0.2)`,
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <p style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  color: TOKENS.brand,
                  letterSpacing: '0.07em',
                  marginBottom: '8px',
                  margin: '0 0 8px 0'
                }}>
                  Work Optional Index
                </p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: TOKENS.brand,
                  letterSpacing: '-0.02em',
                  margin: '0',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {Math.round(metrics.scoreOut100)}/100
                </p>
                <p style={{
                  fontSize: '12px',
                  color: TOKENS.brand,
                  opacity: 0.8,
                  margin: '4px 0 0 0'
                }}>
                  S${(metrics.scorePerAge || 0).toLocaleString('en-SG', { maximumFractionDigits: 0 })} per year of age
                </p>
              </div>

              {/* Phase Context Card */}
              <div style={{
                paddingLeft: '16px',
                borderLeft: `4px solid ${TOKENS.brand}`,
              }}>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: TOKENS.inkPrimary,
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

                {/* Momentum indicator */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: `1px solid ${TOKENS.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: TOKENS.inkTertiary,
                    letterSpacing: '0.07em'
                  }}>
                    Trajectory
                  </span>
                  <span style={{
                    fontSize: '16px',
                    color: metrics.monthlySavings > 0 ? TOKENS.positive : TOKENS.negative
                  }}>
                    {metrics.monthlySavings > 0 ? '↗' : '↘'}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: metrics.monthlySavings > 0 ? TOKENS.positive : TOKENS.negative,
                    fontWeight: '600'
                  }}>
                    {metrics.monthlySavings > 0 ? 'Moving forward' : 'Needs attention'}
                  </span>
                </div>
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
