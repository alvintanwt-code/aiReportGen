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
                text: `You are an expert at reading financial tables with precision. Extract portfolio holdings with ABSOLUTE accuracy.

STEP 1: Locate the "Fx Rate" column header in the table. This column contains exchange rates.

STEP 2: For each row in the table, read the values in this EXACT order:
1. Fund Name (leftmost column)
2. Currency (e.g., USD, SGD, EUR)
3. Unit (quantity)
4. Unit Price
5. Fx Rate (READ EVERY CHARACTER including all decimal places - these are typically 4-6 decimal numbers like 1.27959, 1.48520, 1.00000)

STEP 3: CRITICAL - When reading Fx Rate values:
- Read character by character: digit, dot, digit, digit, digit, digit, digit
- Examples of correct reading: 1.27959, 1.48520, 1.00000, 0.95234
- DO NOT round to 1.3, 1.35, 1.5, or 1.0
- If you see "1.27959" → return 1.27959 exactly
- If you see "1.48520" → return 1.48520 exactly

STEP 4: Return ONLY valid JSON array (no markdown, no explanation):
[
  {
    "fundName": "exact fund name",
    "currency": "USD",
    "units": exact number,
    "unitPrice": exact number,
    "fxRateToSgd": exact FX rate with all decimals (e.g., 1.27959, NOT 1.3)
  }
]

CRITICAL REMINDERS:
- Preserve ALL decimal places in Fx Rate
- Do not round, truncate, or approximate
- If uncertain about a digit, say so in a separate field but best guess
- Focus on accuracy over speed`,
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
