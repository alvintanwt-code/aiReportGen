'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FNA4FactorPlanning({ extractedData, metrics }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  const [activeFactors, setActiveFactors] = useState({
    noFailPosition: true,
    passiveIncome: false,
    investmentsGrowth: false,
    legacy: false,
  });

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
    brand: '#635bff',
    brandLight: '#ede9fe',
    positive: '#10b981',
    warning: '#f59e0b',
    negative: '#ef4444',
    shadowSm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    shadowMd: '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
  };

  const toggleFactor = (factor) => {
    setActiveFactors(prev => ({ ...prev, [factor]: !prev[factor] }));
  };

  // Phase-specific recommendations
  const recommendations = {
    'Accumulation': {
      summary: 'Focus on building a solid financial foundation with consistent savings and strategic growth investments.',
      factors: {
        noFailPosition: { title: 'No Fail Position', recommendation: 'Establish an emergency fund of 3–6 months expenses. Build a basic insurance safety net (term life, health insurance).', actionItems: ['Build emergency fund', 'Get term life insurance', 'Basic health coverage'] },
        passiveIncome: { title: 'Passive Income Streams', recommendation: 'Start small with dividend stocks or REITs. Focus on growth now, passive income later.', actionItems: ['Explore dividend stocks', 'Consider REITs', 'CPF interest accumulation'] },
        investmentsGrowth: { title: 'Investments for Growth', recommendation: 'Prioritize growth-oriented investments. Maximize CPF contribution, diversify across equities and funds.', actionItems: ['Maximize CPF contribution', 'Diversify portfolio', 'Regular investment contributions'] },
        legacy: { title: 'Legacy', recommendation: 'Start thinking about basic estate planning. Create a simple will and designate beneficiaries.', actionItems: ['Draft a will', 'Designate beneficiaries', 'Review annually'] }
      }
    },
    'Transition Ready': {
      summary: 'Balance growth with income generation. Build passive income streams while maintaining growth investments.',
      factors: {
        noFailPosition: { title: 'No Fail Position', recommendation: 'Expand emergency fund to 6–12 months. Ensure adequate insurance coverage (life, health, disability).', actionItems: ['Increase emergency fund', 'Review insurance adequacy', 'Add disability coverage'] },
        passiveIncome: { title: 'Passive Income Streams', recommendation: 'Build significant passive income. Target 20–30% of expenses from passive sources.', actionItems: ['Dividend portfolio building', 'REITs investment', 'CPF rental income potential'] },
        investmentsGrowth: { title: 'Investments for Growth', recommendation: 'Balanced approach: 60% growth, 40% income-generating. Consider rebalancing strategy.', actionItems: ['Rebalance portfolio', 'Add income-generating assets', 'Optimize asset allocation'] },
        legacy: { title: 'Legacy', recommendation: 'Formalize estate planning. Consider trusts if applicable. Update beneficiaries.', actionItems: ['Formalize estate plan', 'Review insurance trusts', 'Plan wealth transfer'] }
      }
    },
    'Work Optional Ready': {
      summary: 'Protect wealth and legacy. Transition focus from growth to security and wealth transfer.',
      factors: {
        noFailPosition: { title: 'No Fail Position', recommendation: 'Ensure full security coverage. Optimize healthcare and long-term care planning.', actionItems: ['Verify all coverages', 'Plan for healthcare costs', 'Long-term care insurance'] },
        passiveIncome: { title: 'Passive Income Streams', recommendation: 'Generate 100%+ of living expenses from passive sources. Optimize tax efficiency.', actionItems: ['Maximize passive income', 'Tax optimization strategy', 'Income stability check'] },
        investmentsGrowth: { title: 'Investments for Growth', recommendation: 'Conservative growth focus. Shift to capital preservation and income. 30% growth, 70% preservation.', actionItems: ['Reduce volatility', 'Capital preservation focus', 'Bond/dividend allocation'] },
        legacy: { title: 'Legacy', recommendation: 'Finalize wealth transfer plan. Consider charitable giving. Optimize for next generation.', actionItems: ['Finalize legacy plan', 'Tax-efficient transfer', 'Charitable planning'] }
      }
    }
  };

  const phaseRecs = recommendations[metrics.phase] || recommendations['Accumulation'];

  const FACTOR_LABELS = {
    noFailPosition: 'No Fail Position',
    passiveIncome: 'Passive Income',
    investmentsGrowth: 'Growth Investing',
    legacy: 'Legacy & Wealth Transfer'
  };

  const FACTOR_COLORS = {
    noFailPosition: TOKENS.brand,
    passiveIncome: TOKENS.positive,
    investmentsGrowth: TOKENS.warning,
    legacy: '#8b5cf6'
  };

  return (
    <div style={{ backgroundColor: TOKENS.bg, minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style>{`
        @import url('https://rsms.me/inter/inter.css');
        body { background-color: ${TOKENS.bg}; margin: 0; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 32px' }}>
        {/* Back Button */}
        <button
          onClick={() => router.push(`/fna-summary?clientId=${clientId}`)}
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
          ← Back to Summary
        </button>

        {/* Page Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '26px',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            color: TOKENS.inkPrimary,
            marginBottom: '12px'
          }}>
            4 Factor Planning
          </h1>
          <p style={{
            fontSize: '13px',
            fontWeight: '500',
            color: TOKENS.inkSecondary,
            margin: '0',
            lineHeight: '1.65'
          }}>
            {phaseRecs.summary}
          </p>
        </div>

        {/* Two-column layout: Sidebar + Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px' }}>
          {/* LEFT: Factor Navigation */}
          <div>
            <p style={{
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: TOKENS.inkTertiary,
              letterSpacing: '0.07em',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              Planning Factors
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.keys(phaseRecs.factors).map((factorKey) => (
                <button
                  key={factorKey}
                  onClick={() => toggleFactor(factorKey)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: activeFactors[factorKey] ? FACTOR_COLORS[factorKey] : TOKENS.surface,
                    color: activeFactors[factorKey] ? '#ffffff' : TOKENS.inkSecondary,
                    border: `1px solid ${activeFactors[factorKey] ? FACTOR_COLORS[factorKey] : TOKENS.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!activeFactors[factorKey]) {
                      e.target.style.backgroundColor = TOKENS.surface2;
                      e.target.style.borderColor = TOKENS.borderSoft;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!activeFactors[factorKey]) {
                      e.target.style.backgroundColor = TOKENS.surface;
                      e.target.style.borderColor = TOKENS.border;
                    }
                  }}
                >
                  {FACTOR_LABELS[factorKey]}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Factor Details */}
          <div>
            {Object.keys(phaseRecs.factors).map((factorKey) => (
              activeFactors[factorKey] && (
                <div
                  key={factorKey}
                  style={{
                    backgroundColor: TOKENS.surface,
                    border: `1px solid ${TOKENS.border}`,
                    borderRadius: '12px',
                    padding: '32px',
                    marginBottom: '24px',
                    boxShadow: TOKENS.shadowSm,
                    animation: 'fadeIn 0.2s ease-out'
                  }}
                >
                  <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>

                  {/* Factor title with color accent */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{
                      width: '4px',
                      height: '24px',
                      backgroundColor: FACTOR_COLORS[factorKey],
                      borderRadius: '2px'
                    }} />
                    <h3 style={{
                      fontSize: '19px',
                      fontWeight: '700',
                      color: TOKENS.inkPrimary,
                      letterSpacing: '-0.02em',
                      margin: '0'
                    }}>
                      {phaseRecs.factors[factorKey].title}
                    </h3>
                  </div>

                  {/* Recommendation */}
                  <p style={{
                    fontSize: '13px',
                    color: TOKENS.inkSecondary,
                    lineHeight: '1.65',
                    marginBottom: '24px',
                    margin: '0 0 24px 0'
                  }}>
                    {phaseRecs.factors[factorKey].recommendation}
                  </p>

                  {/* Action Items */}
                  <div style={{ paddingTop: '20px', borderTop: `1px solid ${TOKENS.border}` }}>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      color: TOKENS.inkTertiary,
                      letterSpacing: '0.07em',
                      marginBottom: '12px',
                      margin: '0 0 12px 0'
                    }}>
                      Action Items
                    </p>
                    <ul style={{
                      margin: '0',
                      padding: '0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {phaseRecs.factors[factorKey].actionItems.map((item, idx) => (
                        <li key={idx} style={{
                          fontSize: '13px',
                          color: TOKENS.inkSecondary,
                          lineHeight: '1.5',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px'
                        }}>
                          <span style={{
                            color: FACTOR_COLORS[factorKey],
                            fontWeight: '600',
                            marginTop: '2px',
                            minWidth: '4px'
                          }}>
                            •
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Footer guidance */}
        <div style={{
          backgroundColor: TOKENS.surface,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: '12px',
          padding: '24px',
          marginTop: '48px',
          boxShadow: TOKENS.shadowSm
        }}>
          <p style={{
            fontSize: '13px',
            color: TOKENS.inkSecondary,
            lineHeight: '1.65',
            margin: '0'
          }}>
            <strong style={{ color: TOKENS.inkPrimary }}>Review periodically:</strong> Revisit this plan as your financial situation changes, markets move, or life milestones occur. Adjust recommendations based on your progress and changing priorities.
          </p>
        </div>
      </div>
    </div>
  );
}
