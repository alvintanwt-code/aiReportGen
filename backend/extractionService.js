/**
 * Extraction Service
 * Calls Claude Vision API to extract portfolio holdings from images
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extract portfolio holdings from an image using Claude Vision
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} mimeType - Image MIME type (image/jpeg, image/png, etc.)
 * @returns {Promise<Array>} Array of holding objects
 */
async function extractPortfolioFromImage(imageBuffer, mimeType) {
  console.log('[EXTRACTION_SERVICE] Starting extraction, mimeType:', mimeType);

  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');

    // Call Claude Vision API
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Please analyze this portfolio screenshot and extract all holdings information.

For each holding, extract:
- Fund/Stock Name
- Number of Units held
- Unit Price
- Currency (SGD, USD, etc.)

Return the response as a JSON array with this structure:
[
  {
    "fundName": "Name of Fund/Stock",
    "units": 1000,
    "unitPrice": 145.50,
    "currency": "USD"
  },
  ...
]

If any field is unclear or missing, use 0 or "Unknown" as a placeholder.
IMPORTANT: Return ONLY the JSON array, no other text.`,
            },
          ],
        },
      ],
    });

    console.log('[EXTRACTION_SERVICE] Got response from Claude');

    // Extract the text content from the response
    let responseText = response.content[0].text;
    console.log('[EXTRACTION_SERVICE] Response text:', responseText);

    // Claude might wrap JSON in markdown code blocks, so extract it
    const jsonMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch && jsonMatch[1]) {
      console.log('[EXTRACTION_SERVICE] Found JSON in markdown code block');
      responseText = jsonMatch[1].trim();
    }

    // Parse the JSON response
    let holdings = JSON.parse(responseText);

    // Ensure it's an array
    if (!Array.isArray(holdings)) {
      holdings = [holdings];
    }

    console.log('[EXTRACTION_SERVICE] Extracted', holdings.length, 'holdings');

    // Validate and clean the holdings data
    holdings = holdings.map((holding) => ({
      id: `holding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fundName: String(holding.fundName || holding.name || 'Unknown').trim(),
      units: parseFloat(holding.units) || 0,
      unitPrice: parseFloat(holding.unitPrice || holding.price) || 0,
      currency: String(holding.currency || 'SGD').toUpperCase().trim(),
      fxRateToSgd: holding.fxRateToSgd || getDefaultFxRate(holding.currency || 'SGD'),
    }));

    console.log('[EXTRACTION_SERVICE] Validated holdings:', holdings);

    return holdings;
  } catch (error) {
    console.error('[EXTRACTION_SERVICE] Error:', error.message);
    throw new Error(`Failed to extract portfolio data: ${error.message}`);
  }
}

/**
 * Get default FX rate to SGD based on currency
 * @param {string} currency - Currency code
 * @returns {number} FX rate
 */
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

module.exports = {
  extractPortfolioFromImage,
};
