'use client';

export default function PortfolioIntelligenceDashboard({
  clientName,
  totalValue,
  holdingsCount,
  currencyCount,
  sourceCount,
  aiConfidence,
  status,
}) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const today = new Date();
  const monthName = today.toLocaleString('en-US', { month: 'long' });
  const year = today.getFullYear();

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e5e5e5',
        borderRadius: '12px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
          Portfolio Intelligence
        </h1>
        <p style={{ fontSize: '14px', color: '#999' }}>
          {clientName} • {monthName} {year}
        </p>
      </div>

      {/* Main metrics grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Total Value */}
        <div>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Portfolio Value
          </p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a' }}>
            {formatCurrency(totalValue)}
          </p>
        </div>

        {/* Holdings */}
        <div>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Holdings
          </p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a' }}>
            {holdingsCount}
          </p>
        </div>

        {/* Currencies */}
        <div>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Currencies
          </p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a' }}>
            {currencyCount}
          </p>
        </div>

        {/* Sources */}
        <div>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Portfolio Sources
          </p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a' }}>
            {sourceCount}
          </p>
        </div>
      </div>

      {/* Bottom section with confidence and status */}
      <div
        style={{
          borderTop: '1px solid #e5e5e5',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            AI Confidence
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '100px',
                height: '6px',
                backgroundColor: '#e5e5e5',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${aiConfidence}%`,
                  backgroundColor: '#2e7d32',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>
              {aiConfidence}%
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Status
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#2e7d32',
            }}
          >
            <span style={{ fontSize: '16px' }}>✓</span>
            {status}
          </div>
        </div>
      </div>
    </div>
  );
}
