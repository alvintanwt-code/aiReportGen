/**
 * Mock extraction function - simulates OCR/extraction without real Claude API
 * Returns fake but realistic portfolio holdings data
 * Phase 3 will replace this with real Claude Vision extraction
 */

export const mockExtractPortfolio = (imageFile) => {
  console.log('[EXTRACTION_MOCK] Starting mock extraction of:', imageFile.name);

  // Simulate a slight delay (like a real extraction would take)
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockHoldings = [
        {
          id: `holding-${Date.now()}-1`,
          fundName: 'Vanguard Total US Stock (VTSAX)',
          units: 500,
          unitPrice: 145.67,
          currency: 'USD',
          fxRateToSgd: 1.34,
        },
        {
          id: `holding-${Date.now()}-2`,
          fundName: 'Singlife Insurance Policy',
          units: 1,
          unitPrice: 85000,
          currency: 'SGD',
          fxRateToSgd: 1.0,
        },
        {
          id: `holding-${Date.now()}-3`,
          fundName: 'Nikko AM Index Asia Ex-Japan ETF',
          units: 2000,
          unitPrice: 22.45,
          currency: 'SGD',
          fxRateToSgd: 1.0,
        },
        {
          id: `holding-${Date.now()}-4`,
          fundName: 'DBS MSCI Singapore Index ETF',
          units: 1500,
          unitPrice: 3.85,
          currency: 'SGD',
          fxRateToSgd: 1.0,
        },
        {
          id: `holding-${Date.now()}-5`,
          fundName: 'Invesco QQQ Trust (QQQ)',
          units: 100,
          unitPrice: 405.50,
          currency: 'USD',
          fxRateToSgd: 1.34,
        },
      ];

      console.log('[EXTRACTION_MOCK] Extracted holdings:', mockHoldings);
      resolve(mockHoldings);
    }, 1000); // 1 second delay
  });
};
