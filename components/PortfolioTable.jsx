'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const columns = [
  { key: 'fundName', label: 'Fund name', width: '220px' },
  { key: 'originalAllocationPercent', label: 'Original alloc %', width: '130px', type: 'number' },
  { key: 'units', label: 'Units', width: '90px', type: 'number' },
  { key: 'unitPrice', label: 'Unit price', width: '100px', type: 'number' },
  { key: 'currency', label: 'Ccy', width: '70px' },
  { key: 'fxRateToSgd', label: 'FX → SGD', width: '100px', type: 'number' },
  { key: 'marketValueOriginal', label: 'Market value', width: '140px', readOnly: true, type: 'number' },
  { key: 'marketValueSgd', label: 'Value (SGD)', width: '140px', readOnly: true, type: 'number' },
  { key: 'weightagePercent', label: 'Weight %', width: '100px', readOnly: true, type: 'number' },
  { key: 'action', label: '', width: '56px', isAction: true },
];

const formatNumber = (value) => {
  const num = Number(value || 0);
  return !isNaN(num) && isFinite(num) ? num.toFixed(2) : '0.00';
};

export default function PortfolioTable({
  holdings,
  totalPortfolioValueSgd,
  onHoldingChange,
  onHoldingDelete,
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleCellChange = (holdingId, field, newValue) => {
    let parsedValue;
    if (field === 'originalAllocationPercent') {
      parsedValue = parseFloat(newValue) || 0;
      if (parsedValue < 0) parsedValue = 0;
      if (parsedValue > 100) parsedValue = 100;
    } else {
      parsedValue =
        field === 'fundName' || field === 'currency'
          ? newValue
          : parseFloat(newValue) || 0;
    }
    onHoldingChange(holdingId, field, parsedValue);
  };

  const allocationTotal = holdings.reduce(
    (sum, h) => sum + (parseFloat(h.originalAllocationPercent) || 0),
    0
  );
  const allFilled = holdings.every(
    (h) => h.originalAllocationPercent !== null && h.originalAllocationPercent !== undefined && h.originalAllocationPercent !== ''
  );
  const allocationStr = isFinite(allocationTotal) ? allocationTotal.toFixed(2) : '0.00';

  const renderCellContent = (holding, column) => {
    if (column.isAction) {
      if (confirmDeleteId === holding.id) {
        return (
          <div className="dash-row-confirm">
            <span style={{ flex: 1, whiteSpace: 'nowrap' }}>Delete?</span>
            <button
              className="dash-row-confirm-btn is-ghost"
              onClick={() => setConfirmDeleteId(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="dash-row-confirm-btn is-danger"
              onClick={() => {
                onHoldingDelete(holding.id);
                setConfirmDeleteId(null);
              }}
              type="button"
            >
              Delete
            </button>
          </div>
        );
      }
      return (
        <button
          className="dash-row-delete"
          title={`Delete ${holding.fundName}`}
          aria-label={`Delete ${holding.fundName}`}
          onClick={() => setConfirmDeleteId(holding.id)}
          type="button"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      );
    }

    const value = holding[column.key];
    const isNumeric = column.type === 'number';
    const isEditing =
      editingCell?.holdingId === holding.id && editingCell?.field === column.key;

    let displayValue = value;
    if (column.key === 'weightagePercent') {
      displayValue = `${formatNumber(value)}%`;
    } else if (column.readOnly && isNumeric) {
      displayValue = formatNumber(value);
    } else if (isNumeric) {
      displayValue = formatNumber(value);
    }

    if (column.readOnly) {
      return (
        <div className={`dash-cell is-readonly ${isNumeric ? 'is-numeric' : ''}`}>
          {displayValue}
        </div>
      );
    }

    if (isEditing) {
      return (
        <input
          className={`dash-cell-input ${isNumeric ? 'is-numeric' : ''}`}
          type={isNumeric ? 'number' : 'text'}
          value={value ?? ''}
          step={isNumeric ? 'any' : undefined}
          onChange={(e) => handleCellChange(holding.id, column.key, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null);
          }}
          autoFocus
        />
      );
    }

    return (
      <div
        className={`dash-cell ${isNumeric ? 'is-numeric' : ''}`}
        onClick={() => setEditingCell({ holdingId: holding.id, field: column.key })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setEditingCell({ holdingId: holding.id, field: column.key });
          }
        }}
      >
        {displayValue}
      </div>
    );
  };

  return (
    <div className="dash-portfolio-body">
      {holdings.length === 0 ? (
        <div style={{ padding: '32px 18px', color: 'var(--muted)', textAlign: 'center', fontSize: 13 }}>
          No holdings to display.
        </div>
      ) : (
        <div className="dash-table-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={[
                      col.type === 'number' ? 'is-numeric' : '',
                      col.isAction ? 'is-action' : '',
                    ].filter(Boolean).join(' ')}
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <tr key={holding.id}>
                  {columns.map((col) => (
                    <td
                      key={`${holding.id}-${col.key}`}
                      style={col.isAction ? { textAlign: 'center', padding: '6px 8px' } : { padding: '4px 6px' }}
                    >
                      {renderCellContent(holding, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="dash-portfolio-foot">
        {holdings.length > 0 && allFilled && Math.abs(allocationTotal - 100) > 0.01 && (
          <div className="dash-banner dash-banner-warn" role="alert">
            <span className="dash-banner-icon">
              <AlertTriangle size={15} strokeWidth={2.2} />
            </span>
            <span>
              Original allocation totals <strong>{allocationStr}%</strong>. It should sum to 100%.
            </span>
          </div>
        )}
        {holdings.length > 0 && allFilled && Math.abs(allocationTotal - 100) <= 0.01 && (
          <div className="dash-banner dash-banner-success" role="status">
            <span className="dash-banner-icon">
              <CheckCircle2 size={15} strokeWidth={2.2} />
            </span>
            <span>
              Original allocation sums to <strong>{allocationStr}%</strong>.
            </span>
          </div>
        )}
        <div className="dash-hint">
          <span className="dash-hint-icon">
            <Info size={13} strokeWidth={2} />
          </span>
          <span>
            Click any cell to edit. Fill in <em>Original allocation %</em> to track drift since rebalancing. Calculations update automatically.
          </span>
        </div>
      </div>
    </div>
  );
}
