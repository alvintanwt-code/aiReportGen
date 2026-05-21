'use client';

export default function PortfolioOverviewCards({ holdingsSets }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate aggregates across all holdings sets
  const allHoldings = holdingsSets.flatMap((set) => set.holdings);
  const totalValue = allHoldings.reduce(
    (sum, h) => sum + h.unitPrice * h.units * h.fxRateToSgd,
    0
  );

  // Get top holdings
  const topHoldings = allHoldings
    .map((h) => ({
      ...h,
      marketValue: h.unitPrice * h.units * h.fxRateToSgd,
    }))
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 5);

  // Get currencies
  const currencies = [...new Set(allHoldings.map((h) => h.currency))];

  // Calculate weightages
  const topHoldingsWithWeightage = topHoldings.map((h) => ({
    ...h,
    weightage: Math.round((h.marketValue / totalValue) * 100),
  }));

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
        Portfolio Overview
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Total Portfolio Card */}
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: '#999',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Total Portfolio Value
          </p>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: '0' }}>
            {formatCurrency(totalValue)}
          </p>
        </div>

        {/* Currency Exposure Card */}
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: '#999',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Currency Exposure
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {currencies.map((ccy) => (
              <span
                key={ccy}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                }}
              >
                {ccy}
              </span>
            ))}
          </div>
        </div>

        {/* Holdings Count Card */}
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: '#999',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Total Holdings
          </p>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: '0' }}>
            {allHoldings.length}
          </p>
        </div>
      </div>

      {/* Top Holdings Card */}
      {topHoldingsWithWeightage.length > 0 && (
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            padding: '24px',
            marginTop: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: '#999',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Top Holdings
          </p>
          <div style={{ display: 'grid', gap: '12px' }}>
            {topHoldingsWithWeightage.map((holding, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: idx < topHoldingsWithWeightage.length - 1 ? '12px' : '0',
                  borderBottom:
                    idx < topHoldingsWithWeightage.length - 1
                      ? '1px solid #e5e5e5'
                      : 'none',
                }}
              >
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>
                    {holding.fundName}
                  </p>
                  <p style={{ fontSize: '12px', color: '#999', margin: '0' }}>
                    {formatCurrency(holding.marketValue)}
                  </p>
                </div>
                <div
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                  }}
                >
                  {holding.weightage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
