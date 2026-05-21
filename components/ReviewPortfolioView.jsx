'use client';

import { useState } from 'react';
import PortfolioIntelligenceDashboard from './PortfolioIntelligenceDashboard';
import AIObservationsPanel from './AIObservationsPanel';
import PortfolioOverviewCards from './PortfolioOverviewCards';
import SourceGroupList from './SourceGroupList';
import { recalculatePortfolio } from '../lib/portfolioCalculations';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function ReviewPortfolioView({
  clientName,
  holdingsSets,
  onSaveHoldings,
  onBack,
}) {
  const [editingHoldingsSets, setEditingHoldingsSets] = useState(holdingsSets);
  const [error, setError] = useState('');

  // Calculate aggregates
  const allHoldings = editingHoldingsSets.flatMap((set) => set.holdings);
  const totalValue = editingHoldingsSets.reduce(
    (sum, set) => sum + set.totalPortfolioValueSgd,
    0
  );
  const currencyCount = new Set(allHoldings.map((h) => h.currency)).size;

  const handleHoldingChange = (setId, holdingId, field, newValue) => {
    const updatedSets = editingHoldingsSets.map((set) => {
      if (set.id !== setId) return set;

      const updatedHoldings = set.holdings.map((h) =>
        h.id === holdingId ? { ...h, [field]: newValue } : h
      );

      const { holdings: recalculatedHoldings, totalPortfolioValueSgd: total } =
        recalculatePortfolio(updatedHoldings);

      return {
        ...set,
        holdings: recalculatedHoldings,
        totalPortfolioValueSgd: total,
      };
    });

    setEditingHoldingsSets(updatedSets);
  };

  const handleSave = () => {
    if (editingHoldingsSets.length === 0 || allHoldings.length === 0) {
      setError('Please ensure you have holdings to save');
      return;
    }
    onSaveHoldings(editingHoldingsSets);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header with back button */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '16px',
            }}
          >
            ← Back
          </button>
          <h1 style={{ marginBottom: '8px' }}>Review Portfolio</h1>
          <p style={{ color: '#999', fontSize: '14px' }}>
            {clientName} • Verify and edit extracted holdings
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Portfolio Intelligence Dashboard */}
      <PortfolioIntelligenceDashboard
        clientName={clientName}
        totalValue={totalValue}
        holdingsCount={allHoldings.length}
        currencyCount={currencyCount}
        sourceCount={editingHoldingsSets.length}
        aiConfidence={96}
        status="Extraction complete"
      />

      {/* AI Observations Panel */}
      {allHoldings.length > 0 && (
        <AIObservationsPanel holdings={allHoldings} />
      )}

      {/* Portfolio Overview Cards */}
      <PortfolioOverviewCards holdingsSets={editingHoldingsSets} />

      {/* Expandable Source Groups with Holdings */}
      <SourceGroupList
        holdingsSets={editingHoldingsSets}
        onHoldingChange={handleHoldingChange}
        onNameChange={() => {}}
      />

      {/* Action Buttons */}
      <div style={{ marginTop: '48px', marginBottom: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            backgroundColor: '#f0f0f0',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '12px 24px',
            backgroundColor: '#1a1a1a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Continue to Report
        </button>
      </div>
    </div>
  );
}
