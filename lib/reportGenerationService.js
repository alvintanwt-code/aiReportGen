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
  return `$${parseFloat(value).toLocaleString('en-SG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format percentage value
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined) return '-';
  const numValue = parseFloat(value);
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
    const initialCapital = parseFloat(account.initialCapital) || 0;
    const currentValuation = parseFloat(perf?.currentValuation) || 0;

    totalCapitalInvested += initialCapital;
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

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Asset Review - ${clientDetails.fullName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #1a2d4d;
          color: #e8e8e8;
          line-height: 1.6;
        }

        .page-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 60px 80px;
          background-color: #1a2d4d;
          min-height: 100vh;
        }

        /* Header Section */
        .header {
          margin-bottom: 60px;
          border-bottom: 2px solid #d4af37;
          padding-bottom: 40px;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }

        .header-branding {
          font-size: 12px;
          font-weight: 400;
          color: #d4af37;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .header-titles {
          display: flex;
          align-items: baseline;
          gap: 15px;
        }

        .report-title {
          font-size: 48px;
          font-weight: 400;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        .report-title-italic {
          font-style: italic;
          font-weight: 300;
          color: #d4af37;
        }

        .client-info {
          text-align: right;
        }

        .client-name {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .advisor-info {
          font-size: 14px;
          color: #999999;
          font-weight: 400;
        }

        /* Metrics Cards */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }

        .metric-card {
          background-color: rgba(15, 31, 53, 0.8);
          padding: 25px;
          border-radius: 0;
          border: 1px solid rgba(212, 175, 55, 0.2);
        }

        .metric-label {
          font-size: 11px;
          font-weight: 600;
          color: #999999;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #d4af37;
          margin-bottom: 6px;
          font-family: 'Courier New', monospace;
        }

        .metric-subtitle {
          font-size: 12px;
          color: #666666;
          font-weight: 400;
        }

        /* Report Date */
        .report-date {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #999999;
        }

        .confidential-notice {
          font-size: 11px;
          color: #666666;
          font-style: italic;
        }

        /* Portfolio Section */
        .portfolio-section {
          margin-bottom: 60px;
          page-break-inside: avoid;
        }

        .portfolio-separator {
          height: 1px;
          background-color: rgba(212, 175, 55, 0.2);
          margin: 60px 0;
        }

        .portfolio-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 40px;
        }

        /* Left Sidebar */
        .portfolio-sidebar {
          background-color: rgba(15, 31, 53, 0.6);
          padding: 25px;
          border-radius: 0;
          border-left: 3px solid #d4af37;
        }

        .portfolio-name {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
        }

        .sidebar-item {
          margin-bottom: 18px;
        }

        .sidebar-label {
          font-size: 11px;
          font-weight: 600;
          color: #999999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .sidebar-value {
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          word-break: break-word;
        }

        /* Right Content */
        .portfolio-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        /* Holdings Table */
        .holdings-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          background-color: transparent;
        }

        .holdings-table thead {
          background-color: rgba(212, 175, 55, 0.1);
          border-top: 1px solid #d4af37;
          border-bottom: 1px solid #d4af37;
        }

        .holdings-table th {
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #d4af37;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .holdings-table th.numeric {
          text-align: right;
        }

        .holdings-table td {
          padding: 12px 15px;
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
          color: #e8e8e8;
        }

        .holdings-table tr:last-child td {
          border-bottom: 1px solid #d4af37;
        }

        .holdings-table td.numeric {
          text-align: right;
          font-family: 'Courier New', monospace;
        }

        .total-row {
          background-color: rgba(212, 175, 55, 0.05);
          font-weight: 600;
        }

        .total-row td {
          border-bottom: none;
        }

        .positive {
          color: #4ade80;
        }

        .negative {
          color: #ff6b6b;
        }

        /* Footer */
        .footer {
          margin-top: 80px;
          padding-top: 40px;
          border-top: 1px solid rgba(212, 175, 55, 0.2);
          font-size: 11px;
          color: #666666;
        }

        .footer-section {
          margin-bottom: 15px;
        }

        .footer-section strong {
          color: #999999;
        }

        @media print {
          body {
            padding: 0;
          }
          .page-container {
            padding: 40px 60px;
            max-width: 100%;
          }
          .portfolio-section {
            page-break-inside: avoid;
          }
        }

        @media (max-width: 1200px) {
          .page-container {
            padding: 40px 40px;
          }
          .portfolio-container {
            grid-template-columns: 250px 1fr;
            gap: 30px;
          }
        }

        @media (max-width: 768px) {
          .page-container {
            padding: 30px 20px;
          }
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .portfolio-container {
            grid-template-columns: 1fr;
          }
          .holdings-table {
            font-size: 11px;
          }
          .holdings-table th,
          .holdings-table td {
            padding: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <!-- Header -->
        <div class="header">
          <div class="header-branding">${branding.companyName || 'COMPANY NAME'}</div>

          <div class="header-top">
            <div class="header-titles">
              <span class="report-title">Asset</span>
              <span class="report-title report-title-italic">Review</span>
            </div>
            <div class="client-info">
              <div class="client-name">${clientDetails.fullName || 'Client Name'}</div>
              <div class="advisor-info">${clientDetails.primaryAdvisor || 'Advisor'} - ${branding.companyName || 'Company'}</div>
            </div>
          </div>

          <!-- Metrics Cards -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Capital Invested</div>
              <div class="metric-value">${formatCurrency(totalCapitalInvested)}</div>
              <div class="metric-subtitle">SGD total deployed</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Portfolio Valuation</div>
              <div class="metric-value">${formatCurrency(totalCurrentValuation)}</div>
              <div class="metric-subtitle">As of ${formatDate(clientDetails.reportDate)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Profit & Loss</div>
              <div class="metric-value ${overallPAndL.pAndLAmount >= 0 ? 'positive' : 'negative'}">
                ${formatPercent(overallPAndL.pAndLPercent)}
              </div>
              <div class="metric-subtitle">${formatCurrency(overallPAndL.pAndLAmount)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Time Period</div>
              <div class="metric-value">${longestMonths} months</div>
              <div class="metric-subtitle">${timeRangeText.toString().includes('-') ? timeRangeText + ' mth range' : 'Since inception'}</div>
            </div>
          </div>

          <!-- Report Date & Confidential Notice -->
          <div class="report-date">
            <span>As at ${formatDate(clientDetails.reportDate)}</span>
            <span class="confidential-notice">Confidential - For client review purposes only</span>
          </div>
        </div>

        <!-- Portfolio Sections -->
        ${accountsWithHoldings.map((account, idx) => {
          try {
            const perf = safePerformance[idx];
            const holdings = safeHoldingsSets[idx];
            const initialCapital = parseFloat(account.initialCapital) || 0;
            const currentValuation = parseFloat(perf?.currentValuation) || 0;

            if (!holdings || !holdings.holdings) {
              return '';
            }

            const pAndL = calculatePAndL(initialCapital, currentValuation);
            const cagr = perf?.cagr || calculateCAGR(initialCapital, currentValuation, perf?.inceptionDate);
            const months = calculateMonths(perf?.inceptionDate);

            // Calculate holdings with allocation
            const holdingsArray = holdings.holdings || [];
            const portfolioTotal = holdingsArray.reduce((sum, h) => sum + (parseFloat(h?.marketValueSgd) || 0), 0);

            const holdingsWithData = holdingsArray.map(h => ({
              ...h,
              allocation: portfolioTotal > 0 ? ((h?.marketValueSgd || 0) / portfolioTotal) * 100 : 0,
              originalAllocation: h?.originalAllocationPercent || null,
            })).map(h => {
              if (h.originalAllocation && initialCapital > 0) {
                const originalCapitalForFund = (initialCapital * h.originalAllocation) / 100;
                const currentValue = h.marketValueSgd || 0;
                const pnlPercent = originalCapitalForFund > 0 ? ((currentValue - originalCapitalForFund) / originalCapitalForFund) * 100 : 0;
                return { ...h, fundPnLPercent: pnlPercent };
              }
              return h;
            });

            const separator = idx > 0 ? '<div class="portfolio-separator"></div>' : '';
            const pAndLClass = pAndL.pAndLAmount >= 0 ? 'positive' : 'negative';
            const inceptionDate = formatDate(perf?.inceptionDate) || '-';
            const cagrValue = cagr ? cagr.toFixed(2) : '-';

            let holdingsRows = '';
            holdingsWithData.forEach(h => {
              try {
                const allocation = parseFloat(h?.allocation || 0);
                const originalAlloc = h?.originalAllocation ? parseFloat(h.originalAllocation) : null;
                const fundCapital = initialCapital > 0 ? (initialCapital * (allocation || 0)) / 100 : 0;
                const fundValuation = parseFloat(h?.marketValueSgd || 0);
                const fundPnL = fundCapital > 0 ? ((fundValuation - fundCapital) / fundCapital) * 100 : 0;
                const fundPnLClass = fundPnL >= 0 ? 'positive' : 'negative';

                holdingsRows += \`<tr>
                  <td>\${h?.fundName || 'N/A'}</td>
                  <td class="numeric">\${h?.currency || '-'}</td>
                  <td class="numeric">\${isNaN(originalAlloc) ? '-' : originalAlloc.toFixed(2)}%</td>
                  <td class="numeric">\${isNaN(allocation) ? '0.00' : allocation.toFixed(2)}%</td>
                  <td class="numeric">\${formatCurrency(fundCapital)}</td>
                  <td class="numeric">\${formatCurrency(fundValuation)}</td>
                  <td class="numeric \${fundPnLClass}">\${fundPnL.toFixed(2)}%</td>
                  <td class="numeric \${fundPnLClass}">\${formatCurrency(fundValuation - fundCapital)}</td>
                </tr>\`;
              } catch (e) {
                console.error('[Holdings Row Error]:', h, e);
                holdingsRows += '<tr><td colspan="8">Error rendering holding</td></tr>';
              }
            });

            return \`
              \${separator}
              <div class="portfolio-section">
                <div class="portfolio-container">
                  <div class="portfolio-sidebar">
                    <div class="portfolio-name">\${account.name || 'Portfolio'}</div>
                    <div class="sidebar-item">
                      <div class="sidebar-label">Policyowner</div>
                      <div class="sidebar-value">\${account.policyholderName || '-'}</div>
                    </div>
                    <div class="sidebar-item">
                      <div class="sidebar-label">P/N</div>
                      <div class="sidebar-value">\${account.policyNumber || '-'}</div>
                    </div>
                    <div class="sidebar-item">
                      <div class="sidebar-label">Start date</div>
                      <div class="sidebar-value">\${inceptionDate}</div>
                    </div>
                    <div class="sidebar-item">
                      <div class="sidebar-label">Capital Invested</div>
                      <div class="sidebar-value">\${formatCurrency(initialCapital)}</div>
                    </div>
                    <div class="sidebar-item">
                      <div class="sidebar-label">Months in</div>
                      <div class="sidebar-value">\${months}</div>
                    </div>
                    <div class="sidebar-item">
                      <div class="sidebar-label">CAGR</div>
                      <div class="sidebar-value">\${cagrValue}%</div>
                    </div>
                    <div class="sidebar-item">
                      <div class="sidebar-label">Account valuation</div>
                      <div class="sidebar-value">\${formatCurrency(currentValuation)}</div>
                    </div>
                    <div class="sidebar-item">
                      <div class="sidebar-label">P&L</div>
                      <div class="sidebar-value \${pAndLClass}">
                        \${formatPercent(pAndL.pAndLPercent)}
                      </div>
                    </div>
                  </div>
                  <div class="portfolio-content">
                    <table class="holdings-table">
                      <thead>
                        <tr>
                          <th>Fund Name</th>
                          <th class="numeric">CCY</th>
                          <th class="numeric">Alloc %</th>
                          <th class="numeric">Weight %</th>
                          <th class="numeric">Capital</th>
                          <th class="numeric">Valuation</th>
                          <th class="numeric">P&L %</th>
                          <th class="numeric">P&L Amt</th>
                        </tr>
                      </thead>
                      <tbody>
                        \${holdingsRows}
                        <tr class="total-row">
                          <td colspan="4">TOTAL</td>
                          <td class="numeric">\${formatCurrency(initialCapital)}</td>
                          <td class="numeric">\${formatCurrency(currentValuation)}</td>
                          <td class="numeric \${pAndLClass}">\${pAndL.pAndLPercent.toFixed(2)}%</td>
                          <td class="numeric \${pAndLClass}">\${formatCurrency(pAndL.pAndLAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            \`;
          } catch (err) {
            console.error('[generateHTMLReport] Error rendering portfolio:', err);
            return '';
          }
        }).join('')}

        <!-- Footer -->
        <div class="footer">
          <div class="footer-section">
            <strong>Report Prepared By:</strong> ${branding.companyName || 'Company Name'}
          </div>
          <div class="footer-section">
            <strong>Advisor:</strong> ${clientDetails.primaryAdvisor || 'Advisor'}${clientDetails.secondaryAdvisor ? `, ${clientDetails.secondaryAdvisor}` : ''}
          </div>
          <div class="footer-section">
            <strong>Report Date:</strong> ${formatDate(clientDetails.reportDate)}
          </div>
          <div class="footer-section" style="margin-top: 20px; opacity: 0.7; font-size: 10px;">
            ${branding.confidentialityNotice || 'This document is confidential and for client review purposes only.'}
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
  const defaultFilename = \`Asset_Review_\${clientName}_\${timestamp}.html\`;

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
