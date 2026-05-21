'use client';

import { useState } from 'react';

export default function PortfolioTable({
  holdings,
  totalPortfolioValueSgd,
  onHoldingChange,
}) {
  const [editingCell, setEditingCell] = useState(null); // { holdingId, field }

  console.log('[PortfolioTable] Rendered with', holdings.length, 'holdings');

  const columns = [
    { key: 'fundName', label: 'Fund Name', width: '200px' },
    { key: 'units', label: 'Units', width: '80px', type: 'number' },
    { key: 'unitPrice', label: 'Unit Price', width: '100px', type: 'number' },
    { key: 'currency', label: 'Currency', width: '80px' },
    { key: 'fxRateToSgd', label: 'FX Rate to SGD', width: '100px', type: 'number' },
    { key: 'marketValueOriginal', label: 'Market Value (Original)', width: '140px', readOnly: true },
    { key: 'marketValueSgd', label: 'Market Value (SGD)', width: '140px', readOnly: true },
    { key: 'weightagePercent', label: 'Weightage %', width: '100px', readOnly: true },
  ];

  const handleCellChange = (holdingId, field, newValue) => {
    console.log('[PortfolioTable] Cell changed:', { holdingId, field, newValue });

    const parsedValue =
      field === 'fundName' || field === 'currency'
        ? newValue
        : parseFloat(newValue) || 0;

    onHoldingChange(holdingId, field, parsedValue);
    // Don't close the input here - onBlur and onKeyDown handle closing
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toFixed(2);
  };

  const formatPercentage = (value) => {
    return Number(value || 0).toFixed(2);
  };

  const renderCell = (holding, column) => {
    const isEditing =
      editingCell?.holdingId === holding.id &&
      editingCell?.field === column.key;
    const value = holding[column.key];

    // Format display value
    let displayValue = value;
    if (column.type === 'number' && !column.readOnly) {
      displayValue = Number(value || 0).toFixed(2);
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
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
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
                    backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white',
                    borderBottom: '1px solid #eee',
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
            backgroundColor: '#e8f4f8',
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
            <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
              SGD {formatCurrency(totalPortfolioValueSgd)}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>
              Number of Holdings
            </p>
            <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
              {holdings.length}
            </p>
          </div>
        </div>
      )}

      <p style={{ marginTop: '10px', color: '#999', fontSize: '12px' }}>
        Click any cell to edit. Calculations update automatically.
      </p>
    </div>
  );
}
