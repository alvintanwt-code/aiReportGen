/**
 * Portfolio calculation utilities
 * Calculates market values, FX conversions, and weightages
 */

/**
 * Calculate market value in original currency
 * @param {number} units
 * @param {number} unitPrice
 * @returns {number}
 */
export const calculateMarketValueOriginal = (units, unitPrice) => {
  if (!units || !unitPrice) return 0;
  return Number((units * unitPrice).toFixed(2));
};

/**
 * Calculate market value in SGD
 * @param {number} marketValueOriginal
 * @param {number} fxRateToSgd
 * @returns {number}
 */
export const calculateMarketValueSgd = (marketValueOriginal, fxRateToSgd) => {
  if (!marketValueOriginal || !fxRateToSgd) return 0;
  return Number((marketValueOriginal * fxRateToSgd).toFixed(2));
};

/**
 * Calculate total portfolio value in SGD
 * @param {Array} holdings
 * @returns {number}
 */
export const calculateTotalPortfolioValueSgd = (holdings) => {
  console.log('[CALC] calculateTotalPortfolioValueSgd');

  if (!holdings || holdings.length === 0) return 0;

  const total = holdings.reduce((sum, holding) => {
    const marketValueSgd = holding.marketValueSgd || 0;
    return sum + marketValueSgd;
  }, 0);

  return Number(total.toFixed(2));
};

/**
 * Calculate weightage percentage
 * @param {number} marketValueSgd - holding value in SGD
 * @param {number} totalPortfolioValueSgd - total portfolio value in SGD
 * @returns {number} percentage (0-100)
 */
export const calculateWeightage = (marketValueSgd, totalPortfolioValueSgd) => {
  if (!marketValueSgd || !totalPortfolioValueSgd || totalPortfolioValueSgd === 0) {
    return 0;
  }
  return Number(((marketValueSgd / totalPortfolioValueSgd) * 100).toFixed(2));
};

/**
 * Recalculate all derived fields for a holding
 * @param {Object} holding - holding object with units, unitPrice, currency, fxRateToSgd
 * @returns {Object} holding with calculated fields
 */
export const recalculateHolding = (holding) => {
  const marketValueOriginal = calculateMarketValueOriginal(
    holding.units,
    holding.unitPrice
  );
  const marketValueSgd = calculateMarketValueSgd(
    marketValueOriginal,
    holding.fxRateToSgd
  );

  return {
    ...holding,
    marketValueOriginal,
    marketValueSgd,
  };
};

/**
 * Recalculate all holdings and weightages
 * @param {Array} holdings
 * @returns {Object} { holdings, totalPortfolioValueSgd }
 */
export const recalculatePortfolio = (holdings) => {
  console.log('[CALC] recalculatePortfolio with', holdings.length, 'holdings');

  // Recalculate each holding
  const recalculatedHoldings = holdings.map((holding) =>
    recalculateHolding(holding)
  );

  // Calculate total portfolio value
  const totalPortfolioValueSgd =
    calculateTotalPortfolioValueSgd(recalculatedHoldings);

  // Add weightage to each holding
  const holdingsWithWeightage = recalculatedHoldings.map((holding) => ({
    ...holding,
    weightagePercent: calculateWeightage(
      holding.marketValueSgd,
      totalPortfolioValueSgd
    ),
  }));

  console.log('[CALC] Recalculated portfolio, total SGD:', totalPortfolioValueSgd);

  return {
    holdings: holdingsWithWeightage,
    totalPortfolioValueSgd,
  };
};
