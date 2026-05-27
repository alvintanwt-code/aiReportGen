'use client';

import PortfolioHoldingsSet from './PortfolioHoldingsSet';

export default function MultipleHoldingsSets({
  holdingsSets,
  onNameChange,
  onHoldingChange,
  onDeleteSet,
  onHoldingDelete,
}) {
  console.log('[MultipleHoldingsSets] Rendered with', holdingsSets.length, 'sets');

  if (!holdingsSets || holdingsSets.length === 0) {
    return (
      <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
        No portfolios uploaded yet
      </p>
    );
  }

  // Calculate combined total
  const combinedTotal = holdingsSets.reduce((sum, set) => sum + (set.totalPortfolioValueSgd || 0), 0);

  return (
    <div>
      {holdingsSets.map((set) => (
        <PortfolioHoldingsSet
          key={set.id}
          holdingsSet={set}
          onNameChange={onNameChange}
          onHoldingChange={onHoldingChange}
          onDelete={onDeleteSet}
          onHoldingDelete={onHoldingDelete}
        />
      ))}

      {holdingsSets.length > 0 && (
        <div
          style={{
            padding: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            marginTop: '20px',
            border: '1px solid #FF8F44',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', color: '#FF8F44' }}>
            Combined Portfolio Summary
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
            }}
          >
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>
                Total Portfolio Value (SGD)
              </p>
              <p
                style={{
                  margin: '0',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#FF8F44',
                }}
              >
                SGD {(() => { const num = Number(combinedTotal || 0); return !isNaN(num) && isFinite(num) ? num.toFixed(2) : '0.00'; })()}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>
                Number of Portfolios
              </p>
              <p
                style={{
                  margin: '0',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#FF8F44',
                }}
              >
                {holdingsSets.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
