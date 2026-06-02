'use client';

import { useState } from 'react';
import { Pencil, MoreHorizontal, Trash2 } from 'lucide-react';
import PortfolioTable from './PortfolioTable';

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return !isNaN(num) && isFinite(num) ? num.toFixed(2) : '0.00';
};

export default function PortfolioHoldingsSet({
  holdingsSet,
  onNameChange,
  onHoldingChange,
  onDelete,
  onHoldingDelete,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(holdingsSet.name);
  const [confirming, setConfirming] = useState(false);

  const handleNameSave = () => {
    if (tempName.trim()) {
      onNameChange(holdingsSet.id, tempName);
    } else {
      setTempName(holdingsSet.name);
    }
    setIsEditingName(false);
  };

  return (
    <section className="dash-portfolio" aria-label={`Portfolio ${holdingsSet.name}`}>
      <header className="dash-portfolio-head">
        {isEditingName ? (
          <div className="dash-portfolio-name" style={{ background: 'var(--slate-100)', borderColor: 'var(--accent-500)', boxShadow: 'var(--ring)' }}>
            <input
              className="dash-portfolio-name-input"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave();
                if (e.key === 'Escape') {
                  setTempName(holdingsSet.name);
                  setIsEditingName(false);
                }
              }}
              placeholder="Portfolio name (e.g., HSBC)"
              autoFocus
            />
          </div>
        ) : (
          <div
            className="dash-portfolio-name"
            onClick={() => {
              setTempName(holdingsSet.name);
              setIsEditingName(true);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setTempName(holdingsSet.name);
                setIsEditingName(true);
              }
            }}
          >
            <span>{holdingsSet.name || 'Untitled portfolio'}</span>
            <Pencil size={13} strokeWidth={2} style={{ color: 'var(--subtle)' }} />
          </div>
        )}

        {confirming ? (
          <div className="dash-row-confirm">
            <span style={{ flex: 1, whiteSpace: 'nowrap' }}>Delete this portfolio?</span>
            <button
              type="button"
              className="dash-row-confirm-btn is-ghost"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dash-row-confirm-btn is-danger"
              onClick={() => onDelete(holdingsSet.id)}
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="dash-btn dash-btn-ghost"
            onClick={() => setConfirming(true)}
            style={{ height: 32, padding: '0 10px', fontSize: 13 }}
            title="Delete portfolio"
          >
            <Trash2 size={13} strokeWidth={2} />
            Delete
          </button>
        )}
      </header>

      <div className="dash-portfolio-totals">
        <div className="dash-portfolio-total">
          <div className="dash-portfolio-total-label">Portfolio value (SGD)</div>
          <div className="dash-portfolio-total-value">SGD {formatCurrency(holdingsSet.totalPortfolioValueSgd)}</div>
        </div>
        <div className="dash-portfolio-total">
          <div className="dash-portfolio-total-label">Holdings</div>
          <div className="dash-portfolio-total-value">{holdingsSet.holdings?.length || 0}</div>
        </div>
      </div>

      <PortfolioTable
        holdings={holdingsSet.holdings}
        totalPortfolioValueSgd={holdingsSet.totalPortfolioValueSgd}
        onHoldingChange={(holdingId, field, value) => {
          onHoldingChange(holdingsSet.id, holdingId, field, value);
        }}
        onHoldingDelete={(holdingId) => {
          onHoldingDelete(holdingsSet.id, holdingId);
        }}
      />
    </section>
  );
}
