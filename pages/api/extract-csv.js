import { IncomingForm } from 'formidable';
import fs from 'fs';
import { parse as csvParse } from 'csv-parse/sync';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Remove currency indicators like (USD), (SGD), etc. from fund names
 */
function cleanFundName(fundName) {
  if (!fundName) return fundName;
  // Remove currency patterns like (USD), (SGD), (HKD), etc. and any trailing/leading spaces
  return fundName
    .replace(/\s*\([A-Z]{3}\)\s*$/i, '') // Match (XXX) at the end
    .replace(/\s*\([A-Z]{3}\)\s*/gi, ' ') // Match (XXX) anywhere else
    .trim();
}

/**
 * Consolidate duplicate fund names by summing their units
 */
function consolidateHoldings(holdings) {
  const consolidated = {};

  holdings.forEach(holding => {
    const key = holding.fundName.toLowerCase();

    if (consolidated[key]) {
      // Add units to existing holding
      consolidated[key].units += holding.units;
    } else {
      // First occurrence of this fund
      consolidated[key] = { ...holding };
    }
  });

  return Object.values(consolidated);
}

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

// Parse number that may have comma as thousands separator
function parseNumber(value) {
  if (!value) return 0;
  // Remove commas and parse
  return parseFloat(String(value).replace(/,/g, '')) || 0;
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
          parseNumber(row[unitsCol]) > 0 &&
          parseNumber(row[priceCol]) > 0
      )
      .map((row, idx) => {
        const currency = (row[currencyCol] || 'SGD').toUpperCase().trim();
        const fxRate = fxRateCol
          ? parseNumber(row[fxRateCol]) || getDefaultFxRate(currency)
          : getDefaultFxRate(currency);

        return {
          id: `h-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
          fundName: cleanFundName(String(row[fundNameCol])),
          units: parseNumber(row[unitsCol]),
          unitPrice: parseNumber(row[priceCol]),
          currency: currency,
          fxRateToSgd: fxRate,
        };
      });

    console.log('[CSV_EXTRACT] Extracted', holdings.length, 'holdings');

    if (holdings.length === 0) {
      throw new Error('No valid holdings data found in CSV');
    }

    // Consolidate duplicate fund names
    const consolidatedHoldings = consolidateHoldings(holdings);
    console.log('[CSV_EXTRACT] After consolidation:', consolidatedHoldings.length, 'holdings');

    return res.status(200).json({
      success: true,
      holdings: consolidatedHoldings,
      message: `Successfully extracted ${consolidatedHoldings.length} holdings from CSV`,
    });
  } catch (error) {
    console.error('[CSV_EXTRACT] Error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}
