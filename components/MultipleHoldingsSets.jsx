'use client';

import PortfolioHoldingsSet from './PortfolioHoldingsSet';

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return !isNaN(num) && isFinite(num) ? num.toFixed(2) : '0.00';
};

export default function MultipleHoldingsSets({
  holdingsSets,
  onNameChange,
  onHoldingChange,
  onDeleteSet,
  onHoldingDelete,
}) {
  if (!holdingsSets || holdingsSets.length === 0) {
    return (
      <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24, fontSize: 13 }}>
        No portfolios uploaded yet.
      </p>
    );
  }

  const combinedTotal = holdingsSets.reduce(
    (sum, set) => sum + (set.totalPortfolioValueSgd || 0),
    0
  );

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

      {holdingsSets.length > 1 && (
        <div className="dash-combined" aria-label="Combined totals">
          <div className="dash-stat">
            <span className="dash-stat-label">Combined value (SGD)</span>
            <span className="dash-stat-value">SGD {formatCurrency(combinedTotal)}</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-label">Portfolios</span>
            <span className="dash-stat-value">{holdingsSets.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
