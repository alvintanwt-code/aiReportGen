'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FNA4FactorPlanning({ extractedData, metrics }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  const [activeFactors, setActiveFactors] = useState({
    noFailPosition: true,
    passiveIncome: true,
    investmentsGrowth: true,
    legacy: true,
  });

  // BRUTALIST COLORS
  const COLORS = {
    grey: '#e8e8e8',
    white: '#ffffff',
    black: '#000000',
    darkGrey: '#333333',
    navy: '#1e3a5f',
    border: '#cccccc',
  };

  const toggleFactor = (factor) => {
    setActiveFactors(prev => ({ ...prev, [factor]: !prev[factor] }));
  };

  // Phase-specific recommendations
  const recommendations = {
    'Accumulation': {
      summary: 'Focus on building a solid financial foundation with consistent savings and strategic growth investments.',
      factors: {
        noFailPosition: { title: 'No Fail Position', recommendation: 'Establish an emergency fund of 3-6 months expenses. Build a basic insurance safety net (term life, health insurance).', actionItems: ['Build emergency fund', 'Get term life insurance', 'Basic health coverage'] },
        passiveIncome: { title: 'Passive Income Streams', recommendation: 'Start small with dividend stocks or REITs. Focus on growth now, passive income later.', actionItems: ['Explore dividend stocks', 'Consider REITs', 'CPF interest accumulation'] },
        investmentsGrowth: { title: 'Investments for Growth', recommendation: 'Prioritize growth-oriented investments. Maximize CPF contribution, diversify across equities and funds.', actionItems: ['Maximize CPF contribution', 'Diversify portfolio', 'Regular RSP investments'] },
        legacy: { title: 'Legacy', recommendation: 'Start thinking about basic estate planning. Create a simple will.', actionItems: ['Draft a will', 'Designate beneficiaries', 'Review annually'] }
      }
    },
    'Transition Ready': {
      summary: 'Balance growth with income generation. Build passive income streams while maintaining growth investments.',
      factors: {
        noFailPosition: { title: 'No Fail Position', recommendation: 'Expand emergency fund to 6-12 months. Ensure adequate insurance coverage (life, health, disability).', actionItems: ['Increase emergency fund', 'Review insurance adequacy', 'Add disability coverage'] },
        passiveIncome: { title: 'Passive Income Streams', recommendation: 'Build significant passive income. Target 20-30% of expenses from passive sources.', actionItems: ['Dividend portfolio building', 'REITs investment', 'CPF rental income potential'] },
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
    noFailPosition: '🛡️ NO FAIL POSITION',
    passiveIncome: '💰 PASSIVE INCOME',
    investmentsGrowth: '📈 INVESTMENTS FOR GROWTH',
    legacy: '🎁 LEGACY'
  };

  return (
    <div style={{ backgroundColor: COLORS.grey, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '80px' }}>
      <style>{`
        body { background-color: ${COLORS.grey}; margin: 0; }
        * { box-sizing: border-box; }
        h1, h2, h3 { margin: 0; font-weight: 900; letter-spacing: -0.02em; }
        p { margin: 0; }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 40px' }}>
        {/* Back Button */}
        <button
          onClick={() => router.push(`/fna-summary?clientId=${clientId}`)}
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

        {/* Header */}
        <div style={{ marginBottom: '80px', borderBottom: `3px solid ${COLORS.black}`, paddingBottom: '40px' }}>
          <h1 style={{ fontSize: '56px', color: COLORS.black, marginBottom: '24px' }}>
            4 FACTOR PLANNING
          </h1>
          <p style={{ fontSize: '14px', color: COLORS.darkGrey, lineHeight: '1.8', maxWidth: '800px' }}>
            {phaseRecs.summary}
          </p>
        </div>

        {/* Sidebar and Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '60px' }}>
          {/* Left Sidebar - Factor Toggles */}
          <div>
            <h3 style={{ fontSize: '12px', marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '0.15em', color: COLORS.darkGrey }}>
              Planning Factors
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.keys(phaseRecs.factors).map((factorKey) => (
                <button
                  key={factorKey}
                  onClick={() => toggleFactor(factorKey)}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: activeFactors[factorKey] ? COLORS.navy : COLORS.white,
                    color: activeFactors[factorKey] ? COLORS.white : COLORS.black,
                    border: `2px solid ${COLORS.black}`,
                    borderRadius: '0px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '700',
                    transition: 'all 0.1s',
                    textAlign: 'left',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                  onMouseEnter={(e) => {
                    if (!activeFactors[factorKey]) {
                      e.target.style.backgroundColor = COLORS.grey;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!activeFactors[factorKey]) {
                      e.target.style.backgroundColor = COLORS.white;
                    }
                  }}
                >
                  {FACTOR_LABELS[factorKey]}
                </button>
              ))}
            </div>
          </div>

          {/* Right Content - Factor Details */}
          <div>
            {Object.keys(phaseRecs.factors).map((factorKey) => (
              activeFactors[factorKey] && (
                <div
                  key={factorKey}
                  style={{
                    backgroundColor: COLORS.white,
                    border: `2px solid ${COLORS.black}`,
                    borderRadius: '0px',
                    padding: '40px',
                    marginBottom: '32px'
                  }}
                >
                  {/* Factor Title */}
                  <h3 style={{ fontSize: '20px', color: COLORS.navy, marginBottom: '24px', letterSpacing: '-0.01em' }}>
                    {phaseRecs.factors[factorKey].title}
                  </h3>

                  {/* Recommendation */}
                  <p style={{ fontSize: '14px', color: COLORS.darkGrey, lineHeight: '1.8', marginBottom: '24px' }}>
                    {phaseRecs.factors[factorKey].recommendation}
                  </p>

                  {/* Action Items */}
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: COLORS.black, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Action Items
                    </p>
                    <ul style={{ margin: '0', paddingLeft: '24px' }}>
                      {phaseRecs.factors[factorKey].actionItems.map((item, idx) => (
                        <li key={idx} style={{ fontSize: '13px', color: COLORS.darkGrey, marginBottom: '8px', lineHeight: '1.6' }}>
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

        {/* Footer Note */}
        <div style={{
          backgroundColor: COLORS.white,
          border: `2px solid ${COLORS.border}`,
          borderRadius: '0px',
          padding: '24px',
          marginTop: '80px',
          textAlign: 'left'
        }}>
          <p style={{ fontSize: '13px', color: COLORS.darkGrey, lineHeight: '1.7' }}>
            <strong>Note:</strong> Review this plan periodically and adjust based on life changes, market conditions, and progress toward your goals.
          </p>
        </div>
      </div>
    </div>
  );
}
