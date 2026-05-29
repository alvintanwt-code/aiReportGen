'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

  const toggleFactor = (factor) => {
    setActiveFactors(prev => ({
      ...prev,
      [factor]: !prev[factor]
    }));
  };

  // Phase-specific recommendations
  const recommendations = {
    'Accumulation': {
      summary: 'Focus on building a solid financial foundation with consistent savings and strategic growth investments.',
      factors: {
        noFailPosition: {
          title: 'No Fail Position',
          recommendation: 'Establish an emergency fund of 3-6 months expenses. Build a basic insurance safety net (term life, health insurance).',
          actionItems: ['Build emergency fund', 'Get term life insurance', 'Basic health coverage']
        },
        passiveIncome: {
          title: 'Passive Income Streams',
          recommendation: 'Start small with dividend stocks or REITs. Focus on growth now, passive income later.',
          actionItems: ['Explore dividend stocks', 'Consider REITs', 'CPF interest accumulation']
        },
        investmentsGrowth: {
          title: 'Investments for Growth',
          recommendation: 'Prioritize growth-oriented investments. Maximize CPF contribution, diversify across equities and funds.',
          actionItems: ['Maximize CPF contribution', 'Diversify portfolio', 'Regular RSP investments']
        },
        legacy: {
          title: 'Legacy',
          recommendation: 'Start thinking about basic estate planning. Create a simple will.',
          actionItems: ['Draft a will', 'Designate beneficiaries', 'Review annually']
        }
      }
    },
    'Transition Ready': {
      summary: 'Balance growth with income generation. Build passive income streams while maintaining growth investments.',
      factors: {
        noFailPosition: {
          title: 'No Fail Position',
          recommendation: 'Expand emergency fund to 6-12 months. Ensure adequate insurance coverage (life, health, disability).',
          actionItems: ['Increase emergency fund', 'Review insurance adequacy', 'Add disability coverage']
        },
        passiveIncome: {
          title: 'Passive Income Streams',
          recommendation: 'Build significant passive income. Target 20-30% of expenses from passive sources.',
          actionItems: ['Dividend portfolio building', 'REITs investment', 'CPF rental income potential']
        },
        investmentsGrowth: {
          title: 'Investments for Growth',
          recommendation: 'Balanced approach: 60% growth, 40% income-generating. Consider rebalancing strategy.',
          actionItems: ['Rebalance portfolio', 'Add income-generating assets', 'Optimize asset allocation']
        },
        legacy: {
          title: 'Legacy',
          recommendation: 'Formalize estate planning. Consider trusts if applicable. Update beneficiaries.',
          actionItems: ['Formalize estate plan', 'Review insurance trusts', 'Plan wealth transfer']
        }
      }
    },
    'Work Optional Ready': {
      summary: 'Protect wealth and legacy. Transition focus from growth to security and wealth transfer.',
      factors: {
        noFailPosition: {
          title: 'No Fail Position',
          recommendation: 'Ensure full security coverage. Optimize healthcare and long-term care planning.',
          actionItems: ['Verify all coverages', 'Plan for healthcare costs', 'Long-term care insurance']
        },
        passiveIncome: {
          title: 'Passive Income Streams',
          recommendation: 'Generate 100%+ of living expenses from passive sources. Optimize tax efficiency.',
          actionItems: ['Maximize passive income', 'Tax optimization strategy', 'Income stability check']
        },
        investmentsGrowth: {
          title: 'Investments for Growth',
          recommendation: 'Conservative growth focus. Shift to capital preservation and income. 30% growth, 70% preservation.',
          actionItems: ['Reduce volatility', 'Capital preservation focus', 'Bond/dividend allocation']
        },
        legacy: {
          title: 'Legacy',
          recommendation: 'Finalize wealth transfer plan. Consider charitable giving. Optimize for next generation.',
          actionItems: ['Finalize legacy plan', 'Tax-efficient transfer', 'Charitable planning']
        }
      }
    }
  };

  const phaseRecs = recommendations[metrics.phase] || recommendations['Accumulation'];
  const FACTOR_COLORS = {
    noFailPosition: '#dc3545',
    passiveIncome: '#ffc107',
    investmentsGrowth: '#28a745',
    legacy: '#4a86e8'
  };

  const FACTOR_LABELS = {
    noFailPosition: '🛡️ No Fail Position',
    passiveIncome: '💰 Passive Income',
    investmentsGrowth: '📈 Investments for Growth',
    legacy: '🎁 Legacy'
  };

  return (
    <div className="gradient-northern-lights" style={{ padding: '40px 24px', minHeight: '100vh' }}>
      {/* Back Button */}
      <button
        onClick={() => router.push(`/fna-summary?clientId=${clientId}`)}
        style={{
          padding: '10px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: '22px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#1a1a1a',
          marginBottom: '40px',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 1)';
          e.target.style.transform = 'translateX(-4px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          e.target.style.transform = 'translateX(0)';
        }}
      >
        ← Back to Summary
      </button>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '40px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>
          4 Factor Planning Framework
        </h1>
        <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.6', maxWidth: '800px' }}>
          {phaseRecs.summary}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
        {/* Left Sidebar - Factor Toggles */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          borderRadius: '16px',
          padding: '24px',
          height: 'fit-content',
          position: 'sticky',
          top: '24px'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', marginBottom: '16px' }}>
            Planning Factors
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.keys(phaseRecs.factors).map((factorKey) => (
              <button
                key={factorKey}
                onClick={() => toggleFactor(factorKey)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: activeFactors[factorKey] ? FACTOR_COLORS[factorKey] : '#f0f0f0',
                  color: activeFactors[factorKey] ? 'white' : '#666',
                  border: `2px solid ${FACTOR_COLORS[factorKey]}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                {FACTOR_LABELS[factorKey]}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: '#999', marginTop: '16px', fontStyle: 'italic' }}>
            Click to toggle factor details
          </p>
        </div>

        {/* Right Content - Factor Details */}
        <div>
          {Object.keys(phaseRecs.factors).map((factorKey) => (
            activeFactors[factorKey] && (
              <div
                key={factorKey}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.75)',
                  backdropFilter: 'blur(20px)',
                  border: `2px solid ${FACTOR_COLORS[factorKey]}`,
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '20px',
                  animation: 'slideIn 0.3s ease'
                }}
              >
                {/* Factor Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: FACTOR_COLORS[factorKey],
                    borderRadius: '50%'
                  }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: FACTOR_COLORS[factorKey], margin: 0 }}>
                    {phaseRecs.factors[factorKey].title}
                  </h3>
                </div>

                {/* Recommendation */}
                <p style={{ fontSize: '13px', color: '#333', lineHeight: '1.6', marginBottom: '16px' }}>
                  {phaseRecs.factors[factorKey].recommendation}
                </p>

                {/* Action Items */}
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                    Action Items:
                  </p>
                  <ul style={{ margin: '0', paddingLeft: '20px' }}>
                    {phaseRecs.factors[factorKey].actionItems.map((item, idx) => (
                      <li key={idx} style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
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

      {/* Footer */}
      <div style={{ marginTop: '40px', padding: '24px', backgroundColor: 'rgba(227, 242, 253, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(21, 101, 192, 0.3)', borderRadius: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#1565c0', lineHeight: '1.6' }}>
          💡 <strong>Tip:</strong> Review this plan periodically and adjust based on life changes, market conditions, and progress toward your goals.
        </p>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
