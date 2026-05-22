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
        border: '1px solid #FF8F44',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
                padding: '14px 24px',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                borderRadius: '45px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                color: '#1a1a1a',
                fontFamily: "'Poppins', sans-serif",
                transition: 'all 0.2s ease',
              }}
            />
            <button
              onClick={handleNameSave}
              style={{
                padding: '10px 24px',
                backgroundColor: '#FFA366',
                color: 'white',
                border: 'none',
                borderRadius: '45px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '400',
                transition: 'background-color 0.2s ease',
                fontFamily: "'Poppins', sans-serif",
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#FF8F44'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#FFA366'}
            >
              Save
            </button>
            <button
              onClick={() => setIsEditingName(false)}
              style={{
                padding: '10px 24px',
                backgroundColor: 'rgba(192, 57, 43, 0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '45px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '400',
                transition: 'background-color 0.2s ease',
                fontFamily: "'Poppins', sans-serif",
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(192, 57, 43, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(192, 57, 43, 0.2)';
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
