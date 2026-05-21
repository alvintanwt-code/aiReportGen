import { IncomingForm } from 'formidable';
import fs from 'fs';
import { parse as csvParse } from 'csv-parse/sync';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Fuzzy match column headers
function normalizeColumnName(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function findColumn(headers, keywords) {
  for (const keyword of keywords) {
    const normalized = normalizeColumnName(keyword);
    for (const header of headers) {
      if (normalizeColumnName(header).includes(normalized)) {
        return header;
      }
    }
  }
  return null;
}

function getDefaultFxRate(currency) {
  const rates = {
    SGD: 1.0,
    USD: 1.35,
    EUR: 1.5,
    GBP: 1.7,
    JPY: 0.009,
    CNY: 0.19,
    HKD: 0.17,
    AUD: 0.9,
    CAD: 1.0,
  };
  return rates[currency.toUpperCase()] || 1.0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[CSV_EXTRACT] Request received');

    // Parse multipart form
    const form = new IncomingForm();
    const [fields, files] = await form.parse(req);

    const fileArray = files.file;
    if (!fileArray || !fileArray[0]) {
      throw new Error('No file uploaded');
    }

    const file = fileArray[0];
    const csvContent = fs.readFileSync(file.filepath, 'utf-8');

    console.log('[CSV_EXTRACT] Parsing CSV...');

    // Split by lines to find the header row
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);

    // Find the header row by looking for expected column keywords
    let headerRowIndex = -1;
    const headerKeywords = ['fund name', 'units', 'unit price', 'currency', 'no of units', 'qty', 'price'];

    for (let i = 0; i < lines.length; i++) {
      const lineContent = lines[i].toLowerCase();
      const matchCount = headerKeywords.filter(keyword => lineContent.includes(keyword)).length;
      if (matchCount >= 2) { // At least 2 keywords means this is likely the header row
        headerRowIndex = i;
        console.log('[CSV_EXTRACT] Found header row at index:', i);
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('Could not find header row. Expected columns: Fund Name, Units, Unit Price');
    }

    // Extract the CSV content from header row onwards
    const csvContentFromHeader = lines.slice(headerRowIndex).join('\n');

    // Parse CSV from the header row
    const records = csvParse(csvContentFromHeader, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log('[CSV_EXTRACT] Found', records.length, 'records');

    if (records.length === 0) {
      throw new Error('No data found in CSV');
    }

    // Get headers
    const headers = Object.keys(records[0]);
    console.log('[CSV_EXTRACT] Headers:', headers);

    // Auto-detect columns with fuzzy matching
    const fundNameCol = findColumn(headers, ['fund name', 'name', 'fund', 'instrument']);
    const unitsCol = findColumn(headers, ['units', 'qty', 'quantity', 'no. of units', 'shares', 'number']);
    const priceCol = findColumn(headers, ['unit price', 'price', 'cost', 'value']);
    const currencyCol = findColumn(headers, ['currency', 'fund currency', 'ccy', 'curr']);
    const fxRateCol = findColumn(headers, ['exchange rate', 'fx rate', 'rate', 'exrate']);

    console.log('[CSV_EXTRACT] Detected columns:', {
      fundName: fundNameCol,
      units: unitsCol,
      price: priceCol,
      currency: currencyCol,
      fxRate: fxRateCol,
    });

    // Validate required columns
    if (!fundNameCol || !unitsCol || !priceCol) {
      throw new Error(
        `Missing required columns. Found: ${headers.join(', ')}. ` +
        `Required: Fund Name, Units, Unit Price`
      );
    }

    // Extract and transform data
    const holdings = records
      .filter(
        (row) =>
          row[fundNameCol]?.trim() &&
          parseFloat(row[unitsCol]) > 0 &&
          parseFloat(row[priceCol]) > 0
      )
      .map((row, idx) => {
        const currency = (row[currencyCol] || 'SGD').toUpperCase().trim();
        const fxRate = fxRateCol
          ? parseFloat(row[fxRateCol]) || getDefaultFxRate(currency)
          : getDefaultFxRate(currency);

        return {
          id: `h-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
          fundName: String(row[fundNameCol]).trim(),
          units: parseFloat(row[unitsCol]) || 0,
          unitPrice: parseFloat(row[priceCol]) || 0,
          currency: currency,
          fxRateToSgd: fxRate,
        };
      });

    console.log('[CSV_EXTRACT] Extracted', holdings.length, 'holdings');

    if (holdings.length === 0) {
      throw new Error('No valid holdings data found in CSV');
    }

    return res.status(200).json({
      success: true,
      holdings,
      message: `Successfully extracted ${holdings.length} holdings from CSV`,
    });
  } catch (error) {
    console.error('[CSV_EXTRACT] Error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}
