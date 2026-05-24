import Papa from 'papaparse';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read CSV file
    const text = await file.text();
    console.log('[EXTRACT_CSV_API] Processing CSV:', file.name);

    // Parse CSV
    const { data, errors } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings first, then convert carefully
    });

    if (errors.length > 0) {
      console.error('[EXTRACT_CSV_API] CSV parse errors:', errors);
    }

    // Helper function to parse numbers while preserving precision
    const parseNumber = (value) => {
      if (!value) return 0;
      const str = String(value).trim();
      // Remove spaces (thousand separators)
      const cleaned = str.replace(/\s/g, '').replace(/,/g, '.');
      return parseFloat(cleaned) || 0;
    };

    // Transform CSV data to holdings format
    const holdings = data
      .filter((row) => row.Fund || row.fundName) // Filter empty rows
      .map((row, index) => ({
        id: `h-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        fundName: row.Fund || row.fundName || '',
        currency: row['Fund Currency'] || row.currency || '',
        units: parseNumber(row.Unit || row.units),
        unitPrice: parseNumber(row['Unit Price'] || row.unitPrice),
        policyValueFundCurrency: parseNumber(
          row['Policy Value (Fund Currency)'] || row.policyValueFundCurrency
        ),
        fxRateToSgd: parseNumber(row['Fx Rate'] || row.fxRateToSgd), // FULL PRECISION
        policyValueSgd: parseNumber(
          row['Policy Value (Contract Currency)'] || row.policyValueSgd
        ),
        valuationDate: row['Valuation Date'] || row.valuationDate || '',
      }));

    console.log('[EXTRACT_CSV_API] Successfully extracted', holdings.length, 'holdings');
    console.log('[EXTRACT_CSV_API] Sample FX rates:', holdings.map(h => h.fxRateToSgd).slice(0, 3));

    return Response.json({
      success: true,
      holdings: holdings,
    });
  } catch (error) {
    console.error('[EXTRACT_CSV_API] Error:', error);
    return Response.json(
      { error: error.message || 'Failed to extract portfolio data from CSV' },
      { status: 500 }
    );
  }
}
