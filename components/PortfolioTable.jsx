'use client';

import { useState } from 'react';

export default function PortfolioTable({
  holdings,
  totalPortfolioValueSgd,
  onHoldingChange,
  onHoldingDelete,
}) {
  const [editingCell, setEditingCell] = useState(null); // { holdingId, field }

  console.log('[PortfolioTable] Rendered with', holdings.length, 'holdings');

  const columns = [
    { key: 'fundName', label: 'Fund Name', width: '200px' },
    { key: 'originalAllocationPercent', label: 'Original Allocation %', width: '130px', type: 'number' },
    { key: 'units', label: 'Units', width: '80px', type: 'number' },
    { key: 'unitPrice', label: 'Unit Price', width: '100px', type: 'number' },
    { key: 'currency', label: 'Currency', width: '80px' },
    { key: 'fxRateToSgd', label: 'FX Rate to SGD', width: '100px', type: 'number' },
    { key: 'marketValueOriginal', label: 'Market Value (Original)', width: '140px', readOnly: true },
    { key: 'marketValueSgd', label: 'Portfolio Value (SGD)', width: '140px', readOnly: true },
    { key: 'weightagePercent', label: 'Weightage %', width: '100px', readOnly: true },
    { key: 'action', label: 'Action', width: '60px', isAction: true },
  ];

  const handleCellChange = (holdingId, field, newValue) => {
    console.log('[PortfolioTable] Cell changed:', { holdingId, field, newValue });

    let parsedValue;

    // Handle originalAllocationPercent - must be 0-100
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

    // Validate allocation sum if original allocation field was changed
    if (field === 'originalAllocationPercent') {
      validateAllocationSum();
    }
  };

  const validateAllocationSum = () => {
    // Check if all holdings have original allocation filled
    const allFilled = holdings.every(h => h.originalAllocationPercent !== null && h.originalAllocationPercent !== undefined && h.originalAllocationPercent !== '');

    if (allFilled) {
      const total = holdings.reduce((sum, h) => sum + (parseFloat(h.originalAllocationPercent) || 0), 0);

      if (total !== 100) {
        const totalStr = !isNaN(total) && isFinite(total) ? total.toFixed(2) : '0.00';
        const message = `⚠️ Original Allocation total is ${totalStr}%. It should be 100%.`;
        console.warn('[PortfolioTable]', message);
        // Return the total so parent can display warning
        return { isValid: false, total, message };
      }
      return { isValid: true, total };
    }
    return { isValid: null, message: 'Fill in all Original Allocation values' };
  };

  const handleDeleteHolding = (holding) => {
    // Smart prompt: if units are 0, offer special message
    const units = parseFloat(holding.units) || 0;

    if (units === 0) {
      if (window.confirm(`"${holding.fundName}" has 0 Units.\n\nProceed to remove this fund?`)) {
        onHoldingDelete(holding.id);
      }
    } else {
      if (window.confirm(`Remove "${holding.fundName}"?`)) {
        onHoldingDelete(holding.id);
      }
    }
  };

  const formatCurrency = (value) => {
    const num = Number(value || 0);
    return !isNaN(num) && isFinite(num) ? num.toFixed(2) : '0.00';
  };

  const formatPercentage = (value) => {
    const num = Number(value || 0);
    return !isNaN(num) && isFinite(num) ? num.toFixed(2) : '0.00';
  };

  const renderCell = (holding, column) => {
    // Handle action column (delete button)
    if (column.isAction) {
      return (
        <button
          onClick={() => handleDeleteHolding(holding)}
          title="Delete this fund"
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'background-color 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#c82333')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc3545')}
        >
          Delete
        </button>
      );
    }

    const isEditing =
      editingCell?.holdingId === holding.id &&
      editingCell?.field === column.key;
    const value = holding[column.key];

    if (editingCell) {
      console.log('[PortfolioTable] editingCell state:', editingCell, 'holding.id:', holding.id, 'column.key:', column.key, 'isEditing:', isEditing);
    }

    // Format display value
    let displayValue = value;
    if (column.type === 'number' && !column.readOnly) {
      const num = Number(value || 0);
      displayValue = !isNaN(num) && isFinite(num) ? num.toFixed(2) : '0.00';
    } else if (column.key === 'marketValueOriginal' || column.key === 'marketValueSgd') {
      displayValue = formatCurrency(value);
    } else if (column.key === 'weightagePercent') {
      displayValue = formatPercentage(value) + '%';
    }

    if (column.readOnly) {
      return (
        <div
          style={{
            padding: '8px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            textAlign: column.type === 'number' ? 'right' : 'left',
          }}
        >
          {displayValue}
        </div>
      );
    }

    if (isEditing) {
      return (
        <input
          type={column.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => handleCellChange(holding.id, column.key, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setEditingCell(null);
            } else if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          autoFocus
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #007bff',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
      );
    }

    return (
      <div
        onClick={() => setEditingCell({ holdingId: holding.id, field: column.key })}
        style={{
          padding: '8px',
          cursor: 'pointer',
          borderRadius: '4px',
          textAlign: column.type === 'number' ? 'right' : 'left',
          transition: 'background-color 0.2s',
          '&:hover': { backgroundColor: '#f0f0f0' },
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {displayValue}
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3 style={{ marginBottom: '15px' }}>Portfolio Holdings</h3>

      {holdings.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
          No holdings to display
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'rgba(255, 163, 102, 0.08)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#FF8F44', color: 'white' }}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      width: col.width,
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding, idx) => (
                <tr
                  key={holding.id}
                  style={{
                    backgroundColor: idx % 2 === 0 ? '#f5f5f5' : '#fafafa',
                    borderBottom: '1px solid #e8e8e8',
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={`${holding.id}-${col.key}`}
                      style={{
                        padding: '8px',
                        fontSize: '13px',
                      }}
                    >
                      {renderCell(holding, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {holdings.length > 0 && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(255, 163, 102, 0.1)',
            borderRadius: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
          }}
        >
          <div>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>
              Total Portfolio Value (SGD)
            </p>
            <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: '#FF8F44' }}>
              SGD {formatCurrency(totalPortfolioValueSgd)}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>
              Number of Holdings
            </p>
            <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: '#FF8F44' }}>
              {holdings.length}
            </p>
          </div>
        </div>
      )}

      {/* Original Allocation Validation */}
      {holdings.length > 0 && (() => {
        const allocationValidation = validateAllocationSum();
        const allFilled = holdings.every(h => h.originalAllocationPercent !== null && h.originalAllocationPercent !== undefined && h.originalAllocationPercent !== '');

        if (allFilled && allocationValidation.total !== 100) {
          const totalStr = !isNaN(allocationValidation.total) && isFinite(allocationValidation.total) ? allocationValidation.total.toFixed(2) : '0.00';
          return (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '6px',
              color: '#856404',
              fontSize: '13px',
            }}>
              ⚠️ <strong>Original Allocation Total: {totalStr}%</strong> (Should be 100%)
            </div>
          );
        } else if (allFilled && allocationValidation.total === 100) {
          const totalStr = !isNaN(allocationValidation.total) && isFinite(allocationValidation.total) ? allocationValidation.total.toFixed(2) : '0.00';
          return (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#d4edda',
              border: '1px solid #28a745',
              borderRadius: '6px',
              color: '#155724',
              fontSize: '13px',
            }}>
              ✅ <strong>Original Allocation: {totalStr}%</strong> (Correct!)
            </div>
          );
        }
        return null;
      })()}

      <p style={{ marginTop: '10px', color: '#999', fontSize: '12px' }}>
        💡 Click any cell to edit. Fill in "Original Allocation %" to track growth since rebalancing. Use the Delete button to remove funds (especially those with 0 Units). Calculations update automatically.
      </p>
    </div>
  );
}
