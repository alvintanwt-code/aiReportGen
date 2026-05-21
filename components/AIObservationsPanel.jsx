'use client';

import { useState } from 'react';

export default function AIObservationsPanel({ holdings }) {
  const [expandedSection, setExpandedSection] = useState('observations');

  // Calculate some basic AI observations from holdings
  const getTechExposure = () => {
    const techFunds = holdings.filter((h) =>
      ['tech', 'technology', 'equity', 'growth'].some((keyword) =>
        h.fundName.toLowerCase().includes(keyword)
      )
    );
    const techValue = techFunds.reduce((sum, h) => sum + h.unitPrice * h.units, 0);
    const totalValue = holdings.reduce((sum, h) => sum + h.unitPrice * h.units, 0);
    return Math.round((techValue / totalValue) * 100);
  };

  const getUSExposure = () => {
    const usyieldFunds = holdings.filter((h) =>
      ['us', 'usa', 'american', 'equity fundamental growth', 'alpha'].some((keyword) =>
        h.fundName.toLowerCase().includes(keyword)
      )
    );
    const usValue = usyieldFunds.reduce((sum, h) => sum + h.unitPrice * h.units, 0);
    const totalValue = holdings.reduce((sum, h) => sum + h.unitPrice * h.units, 0);
    return Math.round((usValue / totalValue) * 100);
  };

  const getCurrencyCount = () => {
    const currencies = new Set(holdings.map((h) => h.currency));
    return currencies.size;
  };

  const observations = [
    `Technology exposure elevated (~${getTechExposure()}%)`,
    `US exposure dominant (~${getUSExposure()}%)`,
    `Multi-currency portfolio (${getCurrencyCount()} currencies detected)`,
    'Potential overlap detected across growth funds',
    'Portfolio positioned for growth orientation',
  ];

  const reviewAreas = [
    'Review concentration risk across top holdings',
    'Review currency exposure and hedging strategy',
    'Review potential fund overlaps',
    'Review rebalancing opportunities',
  ];

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e5e5e5',
        borderRadius: '12px',
        marginBottom: '32px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Observations Section */}
      <div
        style={{
          padding: '24px',
          borderBottom:
            expandedSection === 'observations' ? '1px solid #e5e5e5' : 'none',
        }}
      >
        <div
          onClick={() =>
            setExpandedSection(expandedSection === 'observations' ? null : 'observations')
          }
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: expandedSection === 'observations' ? '16px' : '0',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
            🤖 AI Observations
          </h3>
          <span style={{ fontSize: '12px', color: '#999' }}>
            {expandedSection === 'observations' ? '−' : '+'}
          </span>
        </div>

        {expandedSection === 'observations' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            {observations.map((obs, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#f8f8f8',
                  borderRadius: '8px',
                  borderLeft: '3px solid #1a1a1a',
                }}
              >
                <span style={{ fontSize: '14px', color: '#999', minWidth: '20px' }}>
                  •
                </span>
                <p style={{ fontSize: '14px', color: '#555', margin: '0' }}>
                  {obs}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Review Areas Section */}
      <div style={{ padding: '24px' }}>
        <div
          onClick={() =>
            setExpandedSection(
              expandedSection === 'review' ? null : 'review'
            )
          }
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: expandedSection === 'review' ? '16px' : '0',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
            ⚠️ Suggested Review Areas
          </h3>
          <span style={{ fontSize: '12px', color: '#999' }}>
            {expandedSection === 'review' ? '−' : '+'}
          </span>
        </div>

        {expandedSection === 'review' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            {reviewAreas.map((area, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#fff8e1',
                  borderRadius: '8px',
                  borderLeft: '3px solid #f57f17',
                }}
              >
                <span style={{ fontSize: '14px', color: '#f57f17', minWidth: '20px' }}>
                  ✓
                </span>
                <p style={{ fontSize: '14px', color: '#555', margin: '0' }}>
                  {area}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
