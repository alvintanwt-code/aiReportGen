import { IncomingForm } from 'formidable';
import fs from 'fs';

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
 * Normalize fund name for comparison (lowercase, trim whitespace)
 */
function normalizeFundName(name) {
  return String(name).toLowerCase().trim();
}

/**
 * Consolidate duplicate fund names by summing their units
 */
function consolidateHoldings(holdings) {
  const consolidated = {};
  const nameMap = {}; // Map normalized names to original first occurrence

  holdings.forEach(holding => {
    const normalizedKey = normalizeFundName(holding.fundName);

    if (consolidated[normalizedKey]) {
      // Add units to existing holding
      consolidated[normalizedKey].units += holding.units;
      console.log(`[CONSOLIDATION] Merged "${holding.fundName}" with "${nameMap[normalizedKey]}" - new units: ${consolidated[normalizedKey].units}`);
    } else {
      // First occurrence of this fund
      consolidated[normalizedKey] = { ...holding };
      nameMap[normalizedKey] = holding.fundName;
      console.log(`[CONSOLIDATION] First occurrence of "${holding.fundName}" with ${holding.units} units`);
    }
  });

  return Object.values(consolidated);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[EXTRACT] Request received');

    const form = new IncomingForm();
    const [fields, files] = await form.parse(req);

    const fileArray = files.file;
    if (!fileArray || !fileArray[0]) {
      throw new Error('No file uploaded');
    }

    const file = fileArray[0];
    const imageBuffer = fs.readFileSync(file.filepath);
    const mimeType = file.mimetype || 'image/jpeg';
    const base64 = imageBuffer.toString('base64');

    console.log('[EXTRACT] Image ready');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `You are an expert at reading financial portfolio tables from ANY platform or format. Extract holdings intelligently regardless of table structure.

STEP 1: IDENTIFY THE COLUMNS
First, identify what columns exist in the table by their headers. They may have different names across platforms:
- Fund/Product Name: "Product Name", "Fund", "Investment", "Security", "Asset", "Description"
- Quantity/Units: "Units", "Quantity", "Shares", "Units Held", "No. of Units", "Nominal Value/Quantity", "Holdings", "Amount"
- Current Unit Price: "Unit Price", "Price", "Indicative Price", "NAV", "Current Price", "Price per Unit"
- Cost Per Unit: "Weighted Average Cost", "Cost per Unit", "Average Cost", "Cost Price"
- Currency: "Currency", "Ccy", "Currency Code" (or inferred from amounts)
- Current Value: "Current Value", "Market Value", "Total Value", "Value", "Amount"
- Exchange Rate: "Fx Rate", "Exchange Rate", "FX", "Conversion Rate", "Rate"

STEP 2: MAP COLUMNS SEMANTICALLY
Match the actual column headers to the standard fields. Use context and column position to infer meaning.
For example:
- "Nominal Value/Quantity" column = Number of Units (not the investment amount)
- "Indicative Price" column = Current Unit Price
- "Weighted Average Cost" = Cost per unit paid originally (use "Indicative Price" for current value)
- If you see "Current Value" and missing units: calculate units = Current Value / Indicative Price
- If you see a column with decimal numbers between 0.5-2.0, it's likely FX rate
- Current Value = Units × Indicative Price (calculate if not shown)

STEP 3: EXTRACT WITH PRECISION
For each row, extract:
1. fundName: The investment/product name
2. currency: Currency code (USD, SGD, EUR, etc.) - infer if not explicit
3. units: Quantity/number of units held (extract or calculate)
4. unitPrice: Price per unit (extract or calculate as Current Value / Units)
5. fxRateToSgd: Exchange rate to SGD (look for FX/exchange rate column, default to 1.0 if SGD)

STEP 4: HANDLE VARIATIONS
- If "Current Value" is shown but units/price missing: try to infer from other columns
- If currency is not explicit in table: assume SGD if currency code not present
- If FX rate not shown: use 1.0 for SGD, look up standard rates for other currencies
- Ignore total/summary rows - extract only individual holdings

STEP 5: Return ONLY valid JSON array (no markdown, no explanation):
[
  {
    "fundName": "exact fund name",
    "currency": "USD",
    "units": number,
    "unitPrice": number,
    "fxRateToSgd": number with decimals (e.g., 1.27959)
  }
]

CRITICAL RULES:
- Preserve ALL decimal places in all numbers
- Do not round or approximate
- Be flexible with column names but consistent with values
- Extract from the actual data shown, calculate if needed
- Return best-effort for any missing data`,
              },
            ],
          },
        ],
      }),
    });

    console.log('[EXTRACT] Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('[EXTRACT] API error:', error);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let text = data.content[0].text;

    console.log('[EXTRACT] Claude response received');

    // Extract JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON in response');
    }

    let holdings = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(holdings)) holdings = [holdings];

    console.log('[EXTRACT] Extracted', holdings.length, 'holdings');

    // Clean and format holdings
    const formattedHoldings = holdings.map((h, idx) => ({
      id: `h-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      fundName: cleanFundName(String(h.fundName || 'Unknown')),
      units: parseFloat(h.units) || 0,
      unitPrice: parseFloat(h.unitPrice) || 0,
      currency: String(h.currency || 'SGD').toUpperCase(),
      fxRateToSgd: parseFloat(h.fxRateToSgd) || 0,
    }));

    // Consolidate duplicate fund names
    const consolidatedHoldings = consolidateHoldings(formattedHoldings);

    console.log('[EXTRACT] After consolidation:', consolidatedHoldings.length, 'holdings');
    console.log('[EXTRACT] FX Rates:', consolidatedHoldings.map(h => `${h.fundName.substring(0, 20)}: ${h.fxRateToSgd}`));

    return res.status(200).json({
      success: true,
      holdings: consolidatedHoldings,
    });
  } catch (error) {
    console.error('[EXTRACT] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
