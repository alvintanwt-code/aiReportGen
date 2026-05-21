'use client';

import { useState } from 'react';
import PortfolioTable from './PortfolioTable';

export default function SourceGroupList({
  holdingsSets,
  onHoldingChange,
  onNameChange,
}) {
  const [expandedSetId, setExpandedSetId] = useState(holdingsSets[0]?.id || null);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
        Verify Holdings
      </h2>

      <div style={{ display: 'grid', gap: '12px' }}>
        {holdingsSets.map((set) => {
          const isExpanded = expandedSetId === set.id;

          return (
            <div key={set.id}>
              {/* Source Group Header */}
              <div
                onClick={() =>
                  setExpandedSetId(isExpanded ? null : set.id)
                }
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e5e5',
                  borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f8f8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
                    {set.name}
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      gap: '24px',
                      fontSize: '13px',
                      color: '#999',
                    }}
                  >
                    <span>💰 {formatCurrency(set.totalPortfolioValueSgd)}</span>
                    <span>📊 {set.holdings.length} holdings</span>
                    <span>✨ 97% confidence</span>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '20px',
                    color: '#999',
                    transition: 'transform 0.2s ease',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  ▼
                </div>
              </div>

              {/* Expanded Holdings Table */}
              {isExpanded && (
                <div
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e5e5',
                    borderRadius: '0 0 12px 12px',
                    borderTop: 'none',
                    padding: '20px',
                  }}
                >
                  <PortfolioTable
                    holdings={set.holdings}
                    setId={set.id}
                    onHoldingChange={onHoldingChange}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
