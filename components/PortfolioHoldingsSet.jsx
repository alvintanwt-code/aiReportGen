'use client';

import { useState } from 'react';
import PortfolioTable from './PortfolioTable';

export default function PortfolioHoldingsSet({
  holdingsSet,
  onNameChange,
  onHoldingChange,
  onDelete,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(holdingsSet.name);

  console.log('[PortfolioHoldingsSet] Rendered:', holdingsSet.id);

  const handleNameSave = () => {
    if (tempName.trim()) {
      onNameChange(holdingsSet.id, tempName);
      setIsEditingName(false);
    }
  };

  return (
    <div
      style={{
        marginBottom: '30px',
        padding: '20px',
        border: '2px solid #007bff',
        borderRadius: '8px',
        backgroundColor: '#f0f8ff',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
        }}
      >
        {isEditingName ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Portfolio name (e.g., HSBC)"
              autoFocus
              style={{
                padding: '8px',
                border: '2px solid #007bff',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleNameSave}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Save
            </button>
            <button
              onClick={() => setIsEditingName(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div>
            <h3
              onClick={() => setIsEditingName(true)}
              style={{
                margin: '0',
                color: '#007bff',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
              }}
            >
              {holdingsSet.name || '(Unnamed Portfolio)'}
              <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
                (click to edit)
              </span>
            </h3>
          </div>
        )}

        <button
          onClick={() => {
            if (window.confirm(`Delete portfolio "${holdingsSet.name}"?`)) {
              onDelete(holdingsSet.id);
            }
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Delete
        </button>
      </div>

      <PortfolioTable
        holdings={holdingsSet.holdings}
        totalPortfolioValueSgd={holdingsSet.totalPortfolioValueSgd}
        onHoldingChange={(holdingId, field, value) => {
          onHoldingChange(holdingsSet.id, holdingId, field, value);
        }}
      />
    </div>
  );
}
