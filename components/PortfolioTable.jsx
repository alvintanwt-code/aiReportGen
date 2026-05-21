'use client';

import { useState } from 'react';

export default function PortfolioTable({
  holdings,
  setId,
  onHoldingChange,
}) {
  const [editingCell, setEditingCell] = useState(null); // { holdingId, field }

  console.log('[PortfolioTable] Rendered with', holdings.length, 'holdings');

  const columns = [
    { key: 'fundName', label: 'Fund Name', width: '220px' },
    { key: 'units', label: 'Units', width: '100px', type: 'number' },
    { key: 'unitPrice', label: 'Unit Price', width: '110px', type: 'number' },
    { key: 'currency', label: 'Currency', width: '90px' },
    { key: 'fxRateToSgd', label: 'FX Rate', width: '90px', type: 'number' },
    { key: 'marketValueSgd', label: 'Market Value (SGD)', width: '150px', readOnly: true },
    { key: 'weightagePercent', label: 'Weight %', width: '90px', readOnly: true },
  ];

  const handleCellChange = (holdingId, field, newValue) => {
    console.log('[PortfolioTable] Cell changed:', { holdingId, field, newValue });

    const parsedValue =
      field === 'fundName' || field === 'currency'
        ? newValue
        : parseFloat(newValue) || 0;

    onHoldingChange(setId, holdingId, field, parsedValue);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return Number(value || 0).toFixed(2);
  };

  const formatPercentage = (value) => {
    return Number(value || 0).toFixed(2) + '%';
  };

  const renderCell = (holding, column) => {
    const isEditing =
      editingCell?.holdingId === holding.id &&
      editingCell?.field === column.key;
    const value = holding[column.key];

    // Format display value
    let displayValue = value;
    if (column.type === 'number' && !column.readOnly) {
      displayValue = formatNumber(value);
    } else if (column.key === 'marketValueSgd') {
      displayValue = formatCurrency(value);
    } else if (column.key === 'weightagePercent') {
      displayValue = formatPercentage(value);
    }

    if (column.readOnly) {
      return (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '6px',
            textAlign: column.type === 'number' ? 'right' : 'left',
            fontSize: '13px',
            fontWeight: column.key === 'weightagePercent' ? '500' : '400',
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
            padding: '10px 12px',
            border: '2px solid #1a1a1a',
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      );
    }

    return (
      <div
        onClick={() => setEditingCell({ holdingId: holding.id, field: column.key })}
        style={{
          padding: '12px',
          cursor: 'pointer',
          borderRadius: '6px',
          textAlign: column.type === 'number' ? 'right' : 'left',
          fontSize: '13px',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f8f8')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {displayValue}
      </div>
    );
  };

  return (
    <div>
      {holdings.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '32px 20px', fontSize: '14px' }}>
          No holdings in this group
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'transparent',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e5e5e5' }}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: '12px',
                      textAlign: col.type === 'number' ? 'right' : 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#666',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
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
                    backgroundColor: idx % 2 === 0 ? 'transparent' : '#fafafa',
                    borderBottom: '1px solid #e5e5e5',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#f8f8f8' : '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : '#fafafa';
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={`${holding.id}-${col.key}`}
                      style={{
                        padding: '0',
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

      <p style={{ marginTop: '16px', color: '#999', fontSize: '12px', textAlign: 'center' }}>
        Click any cell to edit. Updates calculate instantly.
      </p>
    </div>
  );
}
