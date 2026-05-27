/**
 * Report Generation Service
 * Converts report data + holdings into a professional HTML client report
 */

/**
 * Calculate CAGR from inception date to current date
 * @param {number} initialValue - Starting portfolio value
 * @param {number} finalValue - Ending portfolio value
 * @param {Date} inceptionDate - Portfolio inception date
 * @param {Date} currentDate - Current date (default: today)
 * @returns {number} CAGR as percentage, or null if invalid
 */
export const calculateCAGR = (initialValue, finalValue, inceptionDate, currentDate = new Date()) => {
  if (!initialValue || initialValue <= 0 || !inceptionDate) return null;

  const yearsElapsed = (currentDate - new Date(inceptionDate)) / (1000 * 60 * 60 * 24 * 365.25);
  if (yearsElapsed <= 0) return null;

  const cagr = (Math.pow(finalValue / initialValue, 1 / yearsElapsed) - 1) * 100;
  return Math.round(cagr * 100) / 100; // Round to 2 decimals
};

/**
 * Calculate P&L percentage and amount
 * @param {number} initialValue - Initial capital invested
 * @param {number} currentValue - Current portfolio value
 * @returns {{pAndLPercent: number, pAndLAmount: number}}
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
 * @param {number} value - Value to format
 * @param {string} currency - Currency code (default: SGD)
 * @returns {string} Formatted string
 */
export const formatCurrency = (value, currency = 'SGD') => {
  if (value === null || value === undefined) return '-';
  return `$${parseFloat(value).toLocaleString('en-SG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format percentage value
 * @param {number} value - Percentage value
 * @returns {string} Formatted string with % sign
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined) return '-';
  const numValue = parseFloat(value);
  const sign = numValue >= 0 ? '+' : '';
  return `${sign}${numValue.toFixed(2)}%`;
};

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
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
 * Main function to generate HTML report
 * @param {Object} reportData - Report configuration from ReportDetailsForm
 * @param {Array} holdingsSets - Portfolio holdings data
 * @returns {string} HTML report string
 */
export const generateHTMLReport = (reportData, holdingsSets) => {
  const {
    clientDetails,
    accounts,
    performance,
    branding,
  } = reportData;

  // Color scheme mapping
  const colorSchemes = {
    'dark-navy': {
      bgColor: '#1a2d4d',
      textColor: '#ffffff',
      accentColor: '#d4af37',
      cardBg: '#243e63',
      borderColor: '#3a5a8a',
    },
    'light-professional': {
      bgColor: '#ffffff',
      textColor: '#1a1a1a',
      accentColor: '#2c5aa0',
      cardBg: '#f5f5f5',
      borderColor: '#cccccc',
    },
    'modern-blue': {
      bgColor: '#0f172a',
      textColor: '#e2e8f0',
      accentColor: '#60a5fa',
      cardBg: '#1e293b',
      borderColor: '#475569',
    },
  };

  const colors = colorSchemes[branding.colorScheme] || colorSchemes['dark-navy'];

  // Calculate totals and metrics
  let totalCapitalInvested = 0;
  let totalCurrentValuation = 0;
  const accountMetrics = accounts.map((account, idx) => {
    const perf = performance[idx];
    const holdings = holdingsSets[idx];

    const initialCapital = parseFloat(account.initialCapital) || 0;
    const currentValuation = parseFloat(perf.currentValuation) || 0;

    totalCapitalInvested += initialCapital;
    totalCurrentValuation += currentValuation;

    const pAndL = calculatePAndL(initialCapital, currentValuation);
    const cagr = perf.cagr || calculateCAGR(initialCapital, currentValuation, perf.inceptionDate);

    return {
      account,
      perf,
      holdings,
      initialCapital,
      currentValuation,
      pAndL,
      cagr,
    };
  });

  const overallPAndL = calculatePAndL(totalCapitalInvested, totalCurrentValuation);

  // Generate HTML
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Portfolio Review - ${clientDetails.fullName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: ${colors.bgColor};
          color: ${colors.textColor};
          line-height: 1.6;
          padding: 0;
        }

        .page {
          page-break-after: always;
          padding: 40px;
          min-height: 100vh;
          background-color: ${colors.bgColor};
          color: ${colors.textColor};
        }

        .header {
          margin-bottom: 60px;
          border-bottom: 2px solid ${colors.accentColor};
          padding-bottom: 30px;
        }

        .company-name {
          font-size: 24px;
          font-weight: 300;
          color: ${colors.accentColor};
          margin-bottom: 20px;
          letter-spacing: 1px;
        }

        .report-title {
          font-size: 36px;
          font-weight: 600;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }

        .report-subtitle {
          font-size: 14px;
          color: ${colors.textColor};
          opacity: 0.7;
          margin-bottom: 20px;
        }

        .client-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
          font-size: 14px;
        }

        .client-info-item {
          display: flex;
          justify-content: space-between;
        }

        .client-info-label {
          opacity: 0.7;
          margin-right: 20px;
        }

        .client-info-value {
          font-weight: 500;
        }

        /* Metrics Cards */
        .metrics-section {
          margin-bottom: 60px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .metric-card {
          background-color: ${colors.cardBg};
          border: 1px solid ${colors.borderColor};
          padding: 25px;
          border-radius: 8px;
          text-align: center;
        }

        .metric-label {
          font-size: 12px;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: ${colors.accentColor};
          margin-bottom: 8px;
        }

        .metric-subtitle {
          font-size: 12px;
          opacity: 0.6;
        }

        /* Portfolio Sections */
        .portfolio-section {
          margin-bottom: 50px;
          page-break-inside: avoid;
        }

        .portfolio-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid ${colors.borderColor};
          color: ${colors.accentColor};
        }

        .portfolio-header {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
          background-color: ${colors.cardBg};
          padding: 20px;
          border-radius: 8px;
          border: 1px solid ${colors.borderColor};
        }

        .header-item {
          display: flex;
          justify-content: space-between;
        }

        .header-label {
          font-size: 13px;
          opacity: 0.7;
        }

        .header-value {
          font-weight: 600;
          font-size: 14px;
        }

        /* Holdings Table */
        .holdings-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
          background-color: ${colors.cardBg};
          border: 1px solid ${colors.borderColor};
          border-radius: 4px;
          overflow: hidden;
        }

        .holdings-table thead {
          background-color: ${colors.borderColor};
          color: ${colors.textColor};
        }

        .holdings-table th {
          padding: 15px;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
          border-bottom: 2px solid ${colors.accentColor};
        }

        .holdings-table td {
          padding: 12px 15px;
          border-bottom: 1px solid ${colors.borderColor};
          opacity: 0.9;
        }

        .holdings-table tbody tr:last-child td {
          border-bottom: none;
        }

        .numeric {
          text-align: right;
          font-family: 'Courier New', monospace;
        }

        .currency {
          color: ${colors.accentColor};
          font-weight: 500;
        }

        .positive {
          color: #4ade80;
        }

        .negative {
          color: #ff6b6b;
        }

        .total-row {
          background-color: ${colors.borderColor};
          font-weight: 600;
          border-top: 2px solid ${colors.accentColor};
        }

        /* Footer */
        .footer {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 1px solid ${colors.borderColor};
          font-size: 11px;
          opacity: 0.6;
          line-height: 1.8;
        }

        .confidentiality-notice {
          background-color: ${colors.cardBg};
          padding: 20px;
          border-radius: 4px;
          border-left: 4px solid ${colors.accentColor};
          margin-bottom: 20px;
          font-size: 11px;
        }

        @media print {
          body {
            padding: 0;
          }
          .page {
            padding: 40px;
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      <!-- Page 1: Cover & Summary -->
      <div class="page">
        <div class="header">
          <div class="company-name">${branding.companyName}</div>
          <div class="report-title">Portfolio Review</div>
          <div class="report-subtitle">As of ${formatDate(clientDetails.reportPeriod)}</div>

          <div class="client-info">
            <div class="client-info-item">
              <span class="client-info-label">Client</span>
              <span class="client-info-value">${clientDetails.fullName}</span>
            </div>
            <div class="client-info-item">
              <span class="client-info-label">Advisor</span>
              <span class="client-info-value">${clientDetails.primaryAdvisor}${clientDetails.secondaryAdvisor ? ', ' + clientDetails.secondaryAdvisor : ''}</span>
            </div>
            <div class="client-info-item">
              <span class="client-info-label">Report Date</span>
              <span class="client-info-value">${formatDate(clientDetails.reportDate)}</span>
            </div>
            <div class="client-info-item">
              <span class="client-info-label">Period Reviewed</span>
              <span class="client-info-value">${formatDate(clientDetails.reportPeriod)}</span>
            </div>
          </div>
        </div>

        <!-- Summary Metrics -->
        <div class="metrics-section">
          <div class="metric-card">
            <div class="metric-label">Capital Invested</div>
            <div class="metric-value">${formatCurrency(totalCapitalInvested)}</div>
            <div class="metric-subtitle">Total</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Current Valuation</div>
            <div class="metric-value">${formatCurrency(totalCurrentValuation)}</div>
            <div class="metric-subtitle">SGD</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Profit & Loss</div>
            <div class="metric-value ${overallPAndL.pAndLAmount >= 0 ? 'positive' : 'negative'}">
              ${formatPercent(overallPAndL.pAndLPercent)}
            </div>
            <div class="metric-subtitle">${formatCurrency(overallPAndL.pAndLAmount)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Number of Portfolios</div>
            <div class="metric-value">${holdingsSets.length}</div>
            <div class="metric-subtitle">Active</div>
          </div>
        </div>

        <div class="confidentiality-notice">
          <strong>Confidentiality Notice:</strong><br/>
          ${branding.confidentialityNotice}
        </div>
      </div>

      <!-- Pages 2+: Detailed Portfolio Pages -->
      ${accountMetrics.map((metric, idx) => {
        const { account, perf, holdings, initialCapital = 0, currentValuation = 0, pAndL, cagr } = metric;

        // Safe guard for holdings data
        if (!holdings || !holdings.holdings) {
          return '';
        }

        // Check if we have capital invested data
        const hasCapitalData = initialCapital > 0;

        // Calculate allocation percentages and check if original allocation is filled
        const holdingsWithAllocation = (holdings.holdings || []).map(h => ({
          ...h,
          allocation: currentValuation > 0 ? ((h.valuationInSgd || 0) / currentValuation) * 100 : 0,
          originalAllocation: h.originalAllocationPercent || null,
        }));

        // Check if all holdings have original allocation filled
        const hasAllOriginalAllocation = hasCapitalData && holdingsWithAllocation.length > 0 && holdingsWithAllocation.every(h => h.originalAllocation !== null && h.originalAllocation !== undefined && h.originalAllocation !== '');

        // Calculate P&L per fund if original allocation is available
        const holdingsWithPnL = holdingsWithAllocation.map(h => {
          if (hasAllOriginalAllocation && h.originalAllocation && initialCapital > 0) {
            // Original capital for this fund based on original allocation
            const originalCapitalForFund = (initialCapital * h.originalAllocation) / 100;
            const currentValue = h.valuationInSgd || 0;
            const pnlPercent = originalCapitalForFund > 0 ? ((currentValue - originalCapitalForFund) / originalCapitalForFund) * 100 : 0;
            return { ...h, fundPnLPercent: pnlPercent, fundPnLSgd: currentValue - originalCapitalForFund };
          }
          return h;
        });

        return `
          <div class="page">
            <div class="header">
              <div class="company-name">${branding.companyName}</div>
              <div class="report-title">${account.name}</div>
              <div class="report-subtitle">Portfolio Statement</div>
            </div>

            <div class="portfolio-section">
              <div class="portfolio-header">
                <div class="header-item">
                  <span class="header-label">Account Number</span>
                  <span class="header-value">${account.policyNumber || '-'}</span>
                </div>
                <div class="header-item">
                  <span class="header-label">Start Date</span>
                  <span class="header-value">${formatDate(account.startDate)}</span>
                </div>
                <div class="header-item">
                  <span class="header-label">Account Holder</span>
                  <span class="header-value">${account.policyholderName}</span>
                </div>
                <div class="header-item">
                  <span class="header-label">Provider</span>
                  <span class="header-value">${account.accountProvider || '-'}</span>
                </div>
              </div>

              <!-- Key Metrics for This Account -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                <div style="background-color: ${colors.cardBg}; padding: 20px; border-radius: 8px; border: 1px solid ${colors.borderColor}; text-align: center;">
                  <div style="font-size: 12px; opacity: 0.7; margin-bottom: 10px; text-transform: uppercase;">Current Value</div>
                  <div style="font-size: 24px; font-weight: 700; color: ${colors.accentColor};">${formatCurrency(currentValuation)}</div>
                </div>
                <div style="background-color: ${colors.cardBg}; padding: 20px; border-radius: 8px; border: 1px solid ${colors.borderColor}; text-align: center;">
                  <div style="font-size: 12px; opacity: 0.7; margin-bottom: 10px; text-transform: uppercase;">P&L Return</div>
                  <div style="font-size: 24px; font-weight: 700; color: ${pAndL.pAndLAmount >= 0 ? '#4ade80' : '#ff6b6b'};">${formatPercent(pAndL.pAndLPercent)}</div>
                  <div style="font-size: 11px; opacity: 0.7;">${formatCurrency(pAndL.pAndLAmount)}</div>
                </div>
                <div style="background-color: ${colors.cardBg}; padding: 20px; border-radius: 8px; border: 1px solid ${colors.borderColor}; text-align: center;">
                  <div style="font-size: 12px; opacity: 0.7; margin-bottom: 10px; text-transform: uppercase;">CAGR</div>
                  <div style="font-size: 24px; font-weight: 700; color: ${colors.accentColor};">${cagr ? formatPercent(cagr) : '-'}</div>
                </div>
              </div>

              <!-- Holdings Table (Smart Columns Based on Data Availability) -->
              <table class="holdings-table">
                ${!hasCapitalData ? `
                  <!-- Minimal View: No Capital Data Available -->
                  <thead>
                    <tr>
                      <th>Fund Name</th>
                      <th class="numeric">Weight %</th>
                      <th class="numeric">Valuation (SGD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${holdingsWithPnL.map(h => `
                      <tr>
                        <td>${h.fundName || 'N/A'}</td>
                        <td class="numeric">${(h.allocation || 0).toFixed(2)}%</td>
                        <td class="numeric currency">${formatCurrency(h.valuationInSgd || 0)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                  <tr class="total-row">
                    <td style="padding: 15px;">TOTAL</td>
                    <td class="numeric" style="padding: 15px;">100.00%</td>
                    <td class="numeric currency" style="padding: 15px;">${formatCurrency(currentValuation)}</td>
                  </tr>
                ` : `
                  <!-- Full View: Capital Data Available -->
                  <thead>
                    <tr>
                      <th>Fund Name</th>
                      ${hasAllOriginalAllocation ? '<th class="numeric">Original Weight %</th>' : ''}
                      <th class="numeric">Weight %</th>
                      <th class="numeric">Capital (SGD)</th>
                      <th class="numeric">Valuation (SGD)</th>
                      ${hasAllOriginalAllocation ? '<th class="numeric">P&L %</th>' : ''}
                    </tr>
                  </thead>
                  <tbody>
                    ${holdingsWithPnL.map(h => {
                      const fundCapital = initialCapital > 0 ? (initialCapital * (h.allocation || 0)) / 100 : 0;
                      const fundValuation = h.valuationInSgd || 0;
                      return `
                      <tr>
                        <td>${h.fundName || 'N/A'}</td>
                        ${hasAllOriginalAllocation ? `<td class="numeric">${h.originalAllocation ? parseFloat(h.originalAllocation).toFixed(2) : '-'}%</td>` : ''}
                        <td class="numeric">${(h.allocation || 0).toFixed(2)}%</td>
                        <td class="numeric currency">${formatCurrency(fundCapital)}</td>
                        <td class="numeric currency">${formatCurrency(fundValuation)}</td>
                        ${hasAllOriginalAllocation && h.fundPnLPercent !== undefined ? `<td class="numeric ${h.fundPnLPercent >= 0 ? 'positive' : 'negative'}">${formatPercent(h.fundPnLPercent)}</td>` : ''}
                      </tr>
                    `;
                    }).join('')}
                  </tbody>
                  <tr class="total-row">
                    <td colspan="${hasAllOriginalAllocation ? '5' : '4'}" style="padding: 15px;">TOTAL</td>
                    <td class="numeric currency" style="padding: 15px;">${formatCurrency(currentValuation)}</td>
                    ${hasAllOriginalAllocation && pAndL ? `<td class="numeric ${(pAndL.pAndLAmount || 0) >= 0 ? 'positive' : 'negative'}" style="padding: 15px;">${formatPercent(pAndL.pAndLPercent)}</td>` : ''}
                  </tr>
                `}
              </table>
            </div>

            <div class="footer">
              <p>This portfolio statement is provided for informational purposes only. Past performance does not guarantee future results.</p>
              <p style="margin-top: 10px;">For questions or clarifications, please contact your advisor.</p>
            </div>
          </div>
        `;
      }).join('')}

      <!-- Last Page: Summary & Disclaimers -->
      <div class="page">
        <div class="header">
          <div class="company-name">${branding.companyName}</div>
          <div class="report-title">Important Information</div>
        </div>

        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 15px; color: ${colors.accentColor};">
            Confidentiality & Disclaimer
          </h3>
          <div class="confidentiality-notice" style="border-left: 4px solid ${colors.accentColor};">
            ${branding.confidentialityNotice}
          </div>
        </div>

        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 15px; color: ${colors.accentColor};">
            Portfolio Summary
          </h3>
          <table class="holdings-table" style="margin-top: 15px;">
            <thead>
              <tr>
                <th>Portfolio</th>
                <th class="numeric">Capital Invested</th>
                <th class="numeric">Current Value</th>
                <th class="numeric">Return %</th>
                <th class="numeric">Return (SGD)</th>
              </tr>
            </thead>
            <tbody>
              ${accountMetrics.map(metric => `
                <tr>
                  <td>${metric.account.name}</td>
                  <td class="numeric currency">${formatCurrency(metric.initialCapital)}</td>
                  <td class="numeric currency">${formatCurrency(metric.currentValuation)}</td>
                  <td class="numeric ${metric.pAndL.pAndLAmount >= 0 ? 'positive' : 'negative'}">${formatPercent(metric.pAndL.pAndLPercent)}</td>
                  <td class="numeric ${metric.pAndL.pAndLAmount >= 0 ? 'positive' : 'negative'}">${formatCurrency(metric.pAndL.pAndLAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tr class="total-row">
              <td style="padding: 15px;">TOTAL</td>
              <td class="numeric currency" style="padding: 15px;">${formatCurrency(totalCapitalInvested)}</td>
              <td class="numeric currency" style="padding: 15px;">${formatCurrency(totalCurrentValuation)}</td>
              <td class="numeric ${overallPAndL.pAndLAmount >= 0 ? 'positive' : 'negative'}" style="padding: 15px;">${formatPercent(overallPAndL.pAndLPercent)}</td>
              <td class="numeric ${overallPAndL.pAndLAmount >= 0 ? 'positive' : 'negative'}" style="padding: 15px;">${formatCurrency(overallPAndL.pAndLAmount)}</td>
            </tr>
          </table>
        </div>

        <div class="footer" style="margin-top: 60px;">
          <p><strong>Report Prepared By:</strong> ${branding.companyName}</p>
          <p><strong>Advisor:</strong> ${clientDetails.primaryAdvisor}${clientDetails.secondaryAdvisor ? ', ' + clientDetails.secondaryAdvisor : ''}</p>
          <p><strong>Report Date:</strong> ${formatDate(clientDetails.reportDate)}</p>
          <p style="margin-top: 20px; opacity: 0.5; font-size: 10px;">
            This report was generated automatically. For questions, please contact your advisor.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Generate and download report as HTML file
 * @param {Object} reportData - Report configuration
 * @param {Array} holdingsSets - Holdings data
 * @param {string} filename - Filename for download (optional)
 */
export const downloadReport = (reportData, holdingsSets, filename = null) => {
  const html = generateHTMLReport(reportData, holdingsSets);
  const clientName = reportData.clientDetails.fullName.replace(/\s+/g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `Portfolio_Review_${clientName}_${timestamp}.html`;

  // Create blob and download
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
 * @param {Object} reportData - Report configuration
 * @param {Array} holdingsSets - Holdings data
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
 * @param {Object} reportData - Report configuration
 * @param {Array} holdingsSets - Holdings data
 * @returns {string} HTML report string
 */
export const generateReport = (reportData, holdingsSets) => {
  return generateHTMLReport(reportData, holdingsSets);
};
