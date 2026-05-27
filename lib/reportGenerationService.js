/**
 * Report Generation Service - Professional Portfolio Review
 * Converts report data + holdings into a professional, publication-quality HTML report
 */

/**
 * Calculate CAGR from inception date to current date
 */
export const calculateCAGR = (initialValue, finalValue, inceptionDate, currentDate = new Date()) => {
  if (!initialValue || initialValue <= 0 || !inceptionDate) return null;
  const yearsElapsed = (currentDate - new Date(inceptionDate)) / (1000 * 60 * 60 * 24 * 365.25);
  if (yearsElapsed <= 0) return null;
  const cagr = (Math.pow(finalValue / initialValue, 1 / yearsElapsed) - 1) * 100;
  return Math.round(cagr * 100) / 100;
};

/**
 * Calculate P&L percentage and amount
 */
export const calculatePAndL = (initialValue, currentValue) => {
  if (!initialValue || initialValue === 0) return { pAndLPercent: 0, pAndLAmount: 0 };
  const pAndLAmount = currentValue - initialValue;
  const pAndLPercent = (pAndLAmount / initialValue) * 100;
  return {
    pAndLPercent: Math.round(pAndLPercent * 100) / 100,
    pAndLAmount: Math.round(pAndLAmount * 100) / 100,
  };
};

/**
 * Format currency value for display
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-';
  const numValue = parseFloat(value);
  if (isNaN(numValue) || !isFinite(numValue)) return '-';
  const sign = numValue < 0 ? '-' : '';
  const absValue = Math.abs(numValue).toLocaleString('en-SG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${absValue}`;
};

/**
 * Safe conversion to fixed decimal places
 */
const safeToFixed = (value, decimals = 2) => {
  try {
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num)) return '0.00';
    return num.toFixed(decimals);
  } catch (e) {
    console.warn('[safeToFixed] Error:', value, e);
    return '0.00';
  }
};

/**
 * Convert text to naming case (title case)
 * e.g., "INFINITY US 500 STOCK" -> "Infinity Us 500 Stock"
 */
const toNamingCase = (text) => {
  if (!text) return text;
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format percentage value
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined) return '-';
  const numValue = parseFloat(value);
  if (isNaN(numValue) || !isFinite(numValue)) return '-';
  const sign = numValue >= 0 ? '+' : '';
  return `${sign}${numValue.toFixed(2)}%`;
};

/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-SG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Calculate months between two dates
 */
export const calculateMonths = (startDate, endDate = new Date()) => {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(0, Math.round(months));
};

/**
 * Main function to generate HTML report with professional layout
 */
export const generateHTMLReport = (reportData, holdingsSets) => {
  if (!reportData) {
    console.error('[generateHTMLReport] reportData is missing');
    return '<html><body><p>Error: Report data is missing</p></body></html>';
  }

  const {
    clientDetails = {},
    accounts = [],
    performance = [],
    branding = {},
  } = reportData;

  const safeHoldingsSets = Array.isArray(holdingsSets) ? holdingsSets : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safePerformance = Array.isArray(performance) ? performance : [];

  // Filter accounts to only those with holdings
  const accountsWithHoldings = safeAccounts.filter((_, idx) => idx < safeHoldingsSets.length);

  // Calculate overall metrics
  let totalCapitalInvested = 0;
  let totalCurrentValuation = 0;
  let earliestInception = null;
  let latestInception = null;

  accountsWithHoldings.forEach((account, idx) => {
    const perf = safePerformance[idx];
    const capitalInvested = parseFloat(perf?.capitalInvested) || 0;
    const currentValuation = parseFloat(perf?.currentValuation) || 0;

    totalCapitalInvested += capitalInvested;
    totalCurrentValuation += currentValuation;

    const inception = new Date(perf?.inceptionDate);
    if (inception && !isNaN(inception)) {
      if (!earliestInception || inception < earliestInception) earliestInception = inception;
      if (!latestInception || inception > latestInception) latestInception = inception;
    }
  });

  const overallPAndL = calculatePAndL(totalCapitalInvested, totalCurrentValuation);
  const longestMonths = latestInception ? calculateMonths(latestInception) : 0;
  const shortestMonths = earliestInception ? calculateMonths(earliestInception) : longestMonths;
  const timeRangeText = earliestInception && latestInception && earliestInception !== latestInception
    ? `${shortestMonths}-${longestMonths}`
    : longestMonths;

  // Build portfolio sections HTML
  let portfolioSectionsHTML = '';
  accountsWithHoldings.forEach((account, idx) => {
    try {
      const perf = safePerformance[idx];
      const holdings = safeHoldingsSets[idx];
      // Use calculated capital invested from performance data
      const capitalInvested = parseFloat(perf?.capitalInvested) || 0;
      const currentValuation = parseFloat(perf?.currentValuation) || 0;

      if (!holdings || !holdings.holdings) {
        return;
      }

      const pAndL = calculatePAndL(capitalInvested, currentValuation);
      const cagr = perf?.cagr || calculateCAGR(capitalInvested, currentValuation, perf?.inceptionDate);
      const months = calculateMonths(perf?.inceptionDate);

      const holdingsArray = holdings.holdings || [];
      const portfolioTotal = holdingsArray.reduce((sum, h) => sum + (parseFloat(h?.marketValueSgd) || 0), 0);

      const holdingsWithData = holdingsArray.map(h => ({
        ...h,
        allocation: portfolioTotal > 0 ? ((h?.marketValueSgd || 0) / portfolioTotal) * 100 : 0,
        originalAllocation: h?.originalAllocationPercent || null,
      })).map(h => {
        if (h.originalAllocation && capitalInvested > 0) {
          const originalCapitalForFund = (capitalInvested * h.originalAllocation) / 100;
          const currentValue = h.marketValueSgd || 0;
          const pnlPercent = originalCapitalForFund > 0 ? ((currentValue - originalCapitalForFund) / originalCapitalForFund) * 100 : 0;
          return { ...h, fundPnLPercent: pnlPercent };
        }
        return h;
      });

      const separator = idx > 0 ? '<div class="portfolio-separator"></div>' : '';
      const pAndLClass = pAndL.pAndLAmount >= 0 ? 'positive' : 'negative';
      const inceptionDate = formatDate(perf?.inceptionDate) || '-';
      const cagrValue = (cagr !== null && cagr !== undefined && !isNaN(cagr) && isFinite(cagr)) ? parseFloat(cagr).toFixed(2) : '-';

      // Check if any holding has original allocation data
      const hasOriginalAllocation = holdingsWithData.some(h => h?.originalAllocation && parseFloat(h.originalAllocation) > 0);

      let holdingsRows = '';
      let tableHeadersHTML = '';
      let totalRowColspan = '3';

      if (hasOriginalAllocation) {
        // Full table: Original Alloc %, Weightage %, Capital, Valuation, P&L %, P&L Amt
        tableHeadersHTML = '<tr><th>Fund Name</th><th class="numeric">Alloc %</th><th class="numeric">Weight %</th><th class="numeric">Capital</th><th class="numeric">Valuation</th><th class="numeric">P&L %</th><th class="numeric">P&L Amt</th></tr>';
        totalRowColspan = '3';

        holdingsWithData.forEach(h => {
          try {
            const allocation = parseFloat(h?.allocation || 0) || 0;
            const originalAllocValue = h?.originalAllocation ? parseFloat(h.originalAllocation) : 0;
            const originalAlloc = (originalAllocValue && !isNaN(originalAllocValue) && isFinite(originalAllocValue)) ? originalAllocValue : null;
            const fundCapital = capitalInvested > 0 ? (capitalInvested * (originalAlloc || 0)) / 100 : 0;
            const fundValuation = parseFloat(h?.marketValueSgd || 0) || 0;
            const fundPnL = fundCapital > 0 ? ((fundValuation - fundCapital) / fundCapital) * 100 : 0;
            const fundPnLClass = fundPnL >= 0 ? 'positive' : 'negative';

            const origAllocStr = (originalAlloc !== null && !isNaN(originalAlloc) && isFinite(originalAlloc)) ? safeToFixed(originalAlloc, 2) : '-';
            const allocStr = (!isNaN(allocation) && isFinite(allocation) && allocation !== null) ? safeToFixed(allocation, 2) : '0.00';
            const fundPnLStr = (!isNaN(fundPnL) && isFinite(fundPnL) && fundPnL !== null) ? safeToFixed(fundPnL, 2) : '0.00';

            holdingsRows += '<tr><td>' + toNamingCase(h?.fundName || 'N/A') + '</td><td class="numeric">' + origAllocStr + '%</td><td class="numeric">' + allocStr + '%</td><td class="numeric">' + formatCurrency(fundCapital) + '</td><td class="numeric">' + formatCurrency(fundValuation) + '</td><td class="numeric ' + fundPnLClass + '">' + fundPnLStr + '%</td><td class="numeric ' + fundPnLClass + '">' + formatCurrency(fundValuation - fundCapital) + '</td></tr>';
          } catch (e) {
            console.error('[Holdings Row Error]:', h, e);
            holdingsRows += '<tr><td colspan="7">Error rendering holding</td></tr>';
          }
        });
      } else {
        // Minimal table: Fund Name, Weight %, Capital, Valuation (when no original allocation)
        tableHeadersHTML = '<tr><th>Fund Name</th><th class="numeric">Weight %</th><th class="numeric">Capital</th><th class="numeric">Valuation</th></tr>';
        totalRowColspan = '2';

        holdingsWithData.forEach(h => {
          try {
            const fundValuation = parseFloat(h?.marketValueSgd || 0) || 0;
            const allocation = parseFloat(h?.allocation || 0) || 0;
            const allocStr = (!isNaN(allocation) && isFinite(allocation) && allocation !== null) ? safeToFixed(allocation, 2) : '0.00';

            holdingsRows += '<tr><td>' + toNamingCase(h?.fundName || 'N/A') + '</td><td class="numeric">' + allocStr + '%</td><td class="numeric">-</td><td class="numeric">' + formatCurrency(fundValuation) + '</td></tr>';
          } catch (e) {
            console.error('[Holdings Row Error]:', h, e);
            holdingsRows += '<tr><td colspan="4">Error rendering holding</td></tr>';
          }
        });
      }

      const pAndLPercentStr = (pAndL.pAndLPercent !== null && !isNaN(pAndL.pAndLPercent) && isFinite(pAndL.pAndLPercent)) ? safeToFixed(pAndL.pAndLPercent, 2) : '0.00';
      const totalRowHTML = hasOriginalAllocation
        ? '<tr class="total-row"><td colspan="' + totalRowColspan + '">TOTAL</td><td class="numeric">' + formatCurrency(capitalInvested) + '</td><td class="numeric">' + formatCurrency(currentValuation) + '</td><td class="numeric ' + pAndLClass + '">' + pAndLPercentStr + '%</td><td class="numeric ' + pAndLClass + '">' + formatCurrency(pAndL.pAndLAmount) + '</td></tr>'
        : '<tr class="total-row"><td colspan="' + totalRowColspan + '">TOTAL</td><td class="numeric">' + formatCurrency(capitalInvested) + '</td><td class="numeric">' + formatCurrency(currentValuation) + '</td></tr>';

      // Format provider name (e.g., "hsbc-life" -> "Hsbc Life")
      const formatProviderName = (providerValue) => {
        if (!providerValue) return '';
        return providerValue.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      };
      const providerDisplay = formatProviderName(account.accountProvider);

      // All portfolios use the same layout - don't vary based on allocation data
      const containerClass = 'portfolio-container';
      const assetsBreakdownTitle = idx === 0 ? '<div class="assets-breakdown-title">Assets Breakdown</div>' : '';
      const sectionHTML = separator + '<div class="portfolio-section">' + assetsBreakdownTitle + '<div class="' + containerClass + '"><div class="portfolio-sidebar"><div class="provider-name">' + providerDisplay + '</div><div class="portfolio-name">' + (account.name || 'Portfolio') + '</div><div class="sidebar-item"><div class="sidebar-label">Policyowner</div><div class="sidebar-value">' + (account.policyholderName || '-') + '</div></div><div class="sidebar-item"><div class="sidebar-label">P/N</div><div class="sidebar-value">' + (account.policyNumber || '-') + '</div></div><div class="sidebar-item"><div class="sidebar-label">Start date</div><div class="sidebar-value">' + inceptionDate + '</div></div><div class="sidebar-item"><div class="sidebar-label">Capital Invested</div><div class="sidebar-value">' + formatCurrency(capitalInvested) + '</div></div><div class="sidebar-item"><div class="sidebar-label">Months in</div><div class="sidebar-value">' + months + '</div></div><div class="sidebar-item"><div class="sidebar-label">CAGR</div><div class="sidebar-value">' + cagrValue + '%</div></div><div class="sidebar-item"><div class="sidebar-label">Account valuation</div><div class="sidebar-value">' + formatCurrency(currentValuation) + '</div></div><div class="sidebar-item"><div class="sidebar-label">P&L</div><div class="sidebar-value ' + pAndLClass + '">' + formatPercent(pAndL.pAndLPercent) + '</div></div></div><div class="portfolio-content"><table class="holdings-table"><thead>' + tableHeadersHTML + '</thead><tbody>' + holdingsRows + totalRowHTML + '</tbody></table></div></div></div>';

      portfolioSectionsHTML += sectionHTML;
    } catch (err) {
      console.error('[generateHTMLReport] Error rendering portfolio:', err);
    }
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Asset Review - ${clientDetails.fullName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: #f5f5f5;
          color: #2c3e50;
          line-height: 1.6;
          padding: 40px 20px;
        }

        /* Document wrapper */
        .page-container {
          max-width: 1100px;
          margin: 0 auto;
          background-color: #ffffff;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          padding: 0;
          overflow: hidden;
        }

        /* Header Hero Section */
        .header {
          background: linear-gradient(135deg, #101b3a 0%, #1a2f52 100%);
          color: #ffffff;
          padding: 21px 32px;
          margin-bottom: 0;
          border-bottom: 2px solid #d4af37;
        }

        .header-branding {
          font-size: 8px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 12px;
          font-family: 'Inter', sans-serif;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 17px;
        }

        .header-titles {
          display: flex;
          flex-direction: column;
          gap: 0;
          line-height: 1.05;
        }

        .report-title {
          font-size: 39px;
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.8px;
          font-family: 'Cormorant Garamond', serif;
          margin: 0;
        }

        .report-title-italic {
          font-family: 'Cormorant Garamond', serif;
          font-size: 39px;
          font-style: italic;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
        }

        .client-info {
          text-align: right;
          font-family: 'Inter', sans-serif;
        }

        .client-name {
          font-size: 10px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 2px;
          letter-spacing: -0.3px;
        }

        .advisor-info {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 400;
        }

        /* Metrics Grid - Inside Header */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 29px;
          padding-top: 15px;
          border-top: 1px solid rgba(212, 175, 55, 0.4);
          background-color: transparent;
        }

        .metric-card {
          padding: 0;
          background: transparent;
          border: none;
        }

        .metric-label {
          font-size: 7px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 4px;
          font-family: 'Inter', sans-serif;
        }

        .metric-value {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 2px;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.5px;
        }

        .metric-subtitle {
          font-size: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 400;
          font-family: 'Inter', sans-serif;
        }

        /* P&L color coding in metrics */
        .metric-value.positive {
          color: #16a34a !important;
        }

        .metric-value.negative {
          color: #dc2626 !important;
        }

        /* Report metadata */
        .report-date {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          font-size: 11px;
          color: #999;
          border-bottom: 1px solid #e8e8e8;
          font-family: 'Inter', sans-serif;
          background-color: #ffffff;
        }

        .confidential-notice {
          font-size: 11px;
          color: #999;
          font-style: italic;
        }

        /* Content area */
        .content-wrapper {
          padding: 60px 32px;
        }

        /* Portfolio Section */
        .portfolio-section {
          margin-bottom: 80px;
          page-break-inside: avoid;
        }

        .portfolio-section:last-of-type {
          margin-bottom: 0;
        }

        .portfolio-separator {
          height: 1px;
          background-color: #e8e8e8;
          margin: 60px 0;
        }

        .portfolio-container {
          display: grid;
          grid-template-columns: 230px 1fr;
          gap: 40px;
          align-items: start;
        }

        /* Account Summary Sidebar */
        .portfolio-sidebar {
          background-color: #fafafa;
          padding: 20px;
          border-radius: 0;
          border: 1px solid #e8e8e8;
          border-left: 1px solid #e8e8e8;
          width: 100%;
          max-width: 230px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .provider-name {
          font-size: 8.5px;
          font-weight: 500;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
          font-family: 'Inter', sans-serif;
        }

        .portfolio-name {
          font-size: 12px;
          font-weight: 700;
          color: #101b3a;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ddd;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.3px;
        }

        .sidebar-item {
          margin-bottom: 9px;
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 8px;
          align-items: baseline;
        }

        .sidebar-item:last-child {
          margin-bottom: 0;
        }

        .sidebar-label {
          font-size: 6.5px;
          font-weight: 600;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 0;
          font-family: 'Inter', sans-serif;
        }

        .sidebar-value {
          font-size: 9px;
          font-weight: 500;
          color: #2c3e50;
          word-break: break-word;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.2px;
          line-height: 1.3;
          text-align: right;
          text-transform: uppercase;
        }

        /* Bold specific sidebar values */
        .portfolio-sidebar > .sidebar-item:nth-child(6) .sidebar-value,
        .portfolio-sidebar > .sidebar-item:nth-child(9) .sidebar-value {
          font-weight: 600;
        }

        /* Assets Breakdown Title */
        .assets-breakdown-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 500;
          color: #101b3a;
          margin-bottom: 20px;
          letter-spacing: -0.5px;
        }

        /* Holdings Table */
        .portfolio-content {
          padding: 0;
          min-width: 0;
        }

        .holdings-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          background-color: transparent;
          font-family: 'Inter', sans-serif;
        }

        .holdings-table thead {
          background-color: #101b3a;
          border-top: 1px solid #101b3a;
          border-bottom: 1px solid #101b3a;
        }

        .holdings-table th {
          padding: 14px 12px;
          text-align: left;
          font-weight: 600;
          color: #ffffff;
          font-size: 9px;
          letter-spacing: 1px;
          font-family: 'Inter', sans-serif;
          padding-bottom: 12px;
          white-space: nowrap;
        }

        .holdings-table th.numeric {
          text-align: right;
        }

        .holdings-table td {
          padding: 13px 12px;
          border-bottom: 1px solid #f0f0f0;
          color: #2c3e50;
          font-weight: 400;
          font-family: 'Inter', sans-serif;
          white-space: nowrap;
        }

        .holdings-table tbody tr:nth-child(odd) {
          background-color: #fafafa;
        }

        .holdings-table tbody tr:nth-child(even) {
          background-color: transparent;
        }

        .holdings-table td.numeric {
          text-align: right;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          font-weight: 500;
        }

        .holdings-table tr.total-row {
          background-color: transparent;
          border-top: 1px solid #e8e8e8;
          border-bottom: 1px solid #e8e8e8;
          font-weight: 600;
          color: #101b3a;
        }

        .holdings-table tr.total-row td {
          padding: 14px 12px;
          border-bottom: none;
        }

        .holdings-table td.positive {
          color: #16a34a !important;
          font-weight: 600;
        }

        .holdings-table td.negative {
          color: #dc2626 !important;
          font-weight: 600;
        }

        /* Fund Name Column - Minimum 330px width with text wrapping */
        .holdings-table th:first-child {
          min-width: 330px;
          white-space: normal;
        }

        .holdings-table td:first-child {
          min-width: 330px;
          white-space: normal;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        /* Footer */
        .footer {
          margin-top: 0;
          padding: 40px 32px;
          border-top: 1px solid #e8e8e8;
          font-size: 11px;
          color: #999;
          background-color: #fafafa;
          font-family: 'Inter', sans-serif;
        }

        .footer-section {
          margin-bottom: 12px;
        }

        .footer-section:last-child {
          margin-bottom: 0;
        }

        .footer-section strong {
          color: #2c3e50;
          font-weight: 600;
        }

        /* Print styles */
        @media print {
          body {
            background-color: #ffffff;
            padding: 0;
          }
          .page-container {
            max-width: 100%;
            box-shadow: none;
          }
          .header {
            page-break-after: avoid;
          }
          .portfolio-section {
            page-break-inside: avoid;
          }
          .metrics-grid {
            page-break-after: avoid;
          }
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            padding-top: 20px;
          }
          .portfolio-container {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .content-wrapper {
            padding: 40px 28px;
          }
          .header {
            padding: 28px 32px;
          }
          .report-date {
            padding: 16px 32px;
          }
          .footer {
            padding: 30px 32px;
          }
          .portfolio-sidebar {
            padding: 30px;
          }
        }

        @media (max-width: 768px) {
          body {
            padding: 20px 0;
          }
          .page-container {
            box-shadow: none;
          }
          .header {
            padding: 30px 20px;
          }
          .header-titles {
            flex-direction: column;
            gap: 10px;
            margin-bottom: 30px;
          }
          .report-title,
          .report-title-italic {
            font-size: 32px;
          }
          .client-info {
            text-align: left;
            margin-top: 20px;
          }
          .metrics-grid {
            grid-template-columns: 1fr;
            padding: 30px 20px;
            gap: 25px;
          }
          .content-wrapper {
            padding: 30px 20px;
          }
          .report-date {
            flex-direction: column;
            align-items: flex-start;
            padding: 15px 20px;
            gap: 8px;
          }
          .holdings-table {
            font-size: 12px;
          }
          .holdings-table th,
          .holdings-table td {
            padding: 10px 8px;
          }
          .portfolio-sidebar {
            padding: 25px;
          }
          .footer {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <!-- Header Hero with Metrics Inside -->
        <div class="header">
          <div class="header-branding">${branding.companyName || 'COMPANY NAME'}</div>

          <div class="header-top">
            <div class="header-titles">
              <div class="report-title">Asset</div>
              <div class="report-title report-title-italic">Review</div>
            </div>
            <div class="client-info">
              <div class="client-name">${clientDetails.fullName || 'Client Name'}</div>
              <div class="advisor-info">${clientDetails.primaryAdvisor || 'Advisor'} · ${branding.companyName || 'Company'}</div>
            </div>
          </div>

          <!-- Metrics inside header -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Capital Invested</div>
              <div class="metric-value">${formatCurrency(totalCapitalInvested)}</div>
              <div class="metric-subtitle">SGD</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Portfolio Valuation</div>
              <div class="metric-value">${formatCurrency(totalCurrentValuation)}</div>
              <div class="metric-subtitle">Current value</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Profit & Loss</div>
              <div class="metric-value ${overallPAndL.pAndLAmount >= 0 ? 'positive' : 'negative'}">${formatPercent(overallPAndL.pAndLPercent)}</div>
              <div class="metric-subtitle">${formatCurrency(overallPAndL.pAndLAmount)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Period</div>
              <div class="metric-value">${longestMonths}</div>
              <div class="metric-subtitle">months</div>
            </div>
          </div>
        </div>

        <!-- Report Metadata -->
        <div class="report-date">
          <span>As at ${formatDate(clientDetails.reportDate)}</span>
          <span class="confidential-notice">Confidential — For client review purposes only</span>
        </div>

        <!-- Content -->
        <div class="content-wrapper">
          ${portfolioSectionsHTML}
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-section"><strong>Prepared by</strong> ${branding.companyName || 'Company'}</div>
          <div class="footer-section"><strong>Advisor</strong> ${clientDetails.primaryAdvisor || 'Advisor'}${clientDetails.secondaryAdvisor ? ', ' + clientDetails.secondaryAdvisor : ''}</div>
          <div class="footer-section"><strong>Date</strong> ${formatDate(clientDetails.reportDate)}</div>
          <div class="footer-section" style="margin-top: 16px; color: #ccc; font-size: 10px;">
            ${branding.confidentialityNotice || 'This document is confidential and for authorized client review only.'}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Generate and download report as HTML file
 */
export const downloadReport = (reportData, holdingsSets, filename = null) => {
  const html = generateHTMLReport(reportData, holdingsSets);
  const clientName = reportData.clientDetails.fullName.replace(/\s+/g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = 'Asset_Review_' + clientName + '_' + timestamp + '.html';

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename || defaultFilename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Open report in new window/tab
 */
export const openReportInNewWindow = (reportData, holdingsSets) => {
  const html = generateHTMLReport(reportData, holdingsSets);
  const newWindow = window.open('', '_blank');
  newWindow.document.write(html);
  newWindow.document.close();
  return newWindow;
};

/**
 * Generate report as string (for preview or storage)
 */
export const generateReport = (reportData, holdingsSets) => {
  return generateHTMLReport(reportData, holdingsSets);
};
