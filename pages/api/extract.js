/**
 * Vercel Serverless Function for Portfolio Extraction
 * POST /api/extract
 * Calls Claude Vision API to extract holdings from portfolio images
 */

// Direct API call instead of SDK

// Configure for large file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

/**
 * Extract portfolio holdings from image using Claude Vision
 */
async function extractPortfolioFromImage(imageBuffer, mimeType) {
  console.log('[API/EXTRACT] Starting extraction, mimeType:', mimeType);
  console.log('[API/EXTRACT] Image size:', imageBuffer.length, 'bytes');

  try {
    // Convert buffer to base64
    console.log('[API/EXTRACT] Converting to base64...');
    const base64Image = imageBuffer.toString('base64');
    console.log('[API/EXTRACT] Base64 length:', base64Image.length);

    // Call Claude Vision API directly via fetch
    console.log('[API/EXTRACT] Calling Anthropic API via fetch...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
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
                text: 'Extract holdings from this portfolio screenshot. Return ONLY a JSON array of {fundName, units, unitPrice, currency}.',
              },
            ],
          },
        ],
      }),
    });

    console.log('[API/EXTRACT] Got response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${response.status} - ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log('[API/EXTRACT] Got response from Claude');

    // Extract the text content from the response
    let responseText = data.content[0].text;

    // Claude might wrap JSON in markdown code blocks, so extract it
    const jsonMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch && jsonMatch[1]) {
      console.log('[API/EXTRACT] Found JSON in markdown code block');
      responseText = jsonMatch[1].trim();
    }

    // Parse the JSON response
    let holdings = JSON.parse(responseText);

    // Ensure it's an array
    if (!Array.isArray(holdings)) {
      holdings = [holdings];
    }

    console.log('[API/EXTRACT] Extracted', holdings.length, 'holdings');

    // Validate and clean the holdings data
    holdings = holdings.map((holding) => ({
      id: `holding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fundName: String(holding.fundName || holding.name || 'Unknown').trim(),
      units: parseFloat(holding.units) || 0,
      unitPrice: parseFloat(holding.unitPrice || holding.price) || 0,
      currency: String(holding.currency || 'SGD').toUpperCase().trim(),
      fxRateToSgd: holding.fxRateToSgd || getDefaultFxRate(holding.currency || 'SGD'),
    }));

    console.log('[API/EXTRACT] Validated holdings:', holdings);

    return holdings;
  } catch (error) {
    console.error('[API/EXTRACT] Error:', error.message);
    throw new Error(`Failed to extract portfolio data: ${error.message}`);
  }
}

/**
 * Get default FX rate to SGD based on currency
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

/**
 * Parse multipart form data
 */
async function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      const buffer = Buffer.concat(chunks);

      // Extract boundary from content-type header
      const contentType = req.headers['content-type'];
      const boundaryMatch = contentType.match(/boundary=([^;]+)/);
      if (!boundaryMatch) {
        return reject(new Error('Invalid content-type'));
      }

      const boundary = boundaryMatch[1];

      // Find the file data between boundaries
      const boundaryBuffer = Buffer.from(`--${boundary}`);
      const endBoundaryBuffer = Buffer.from(`--${boundary}--`);

      let startIndex = buffer.indexOf(boundaryBuffer);
      if (startIndex === -1) {
        return reject(new Error('Boundary not found'));
      }

      startIndex += boundaryBuffer.length;

      // Find the next boundary or end boundary
      let endIndex = buffer.indexOf(boundaryBuffer, startIndex);
      if (endIndex === -1) {
        endIndex = buffer.indexOf(endBoundaryBuffer, startIndex);
      }

      if (endIndex === -1) {
        return reject(new Error('End boundary not found'));
      }

      // Extract headers and file data
      const section = buffer.slice(startIndex, endIndex).toString('utf-8', 0, 500);
      const headerEndIndex = section.indexOf('\r\n\r\n');

      if (headerEndIndex === -1) {
        return reject(new Error('Headers not found'));
      }

      // Get Content-Type from headers
      const headers = section.substring(0, headerEndIndex);
      const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/);
      const mimeType = contentTypeMatch ? contentTypeMatch[1] : 'image/jpeg';

      // Extract file binary data
      const fileStartIndex = startIndex + headerEndIndex + 4; // +4 for \r\n\r\n
      let fileEndIndex = buffer.indexOf('\r\n--', fileStartIndex);
      if (fileEndIndex === -1) {
        fileEndIndex = buffer.indexOf('\n--', fileStartIndex);
        const fileBuffer = buffer.slice(fileStartIndex, fileEndIndex);
        return resolve({ buffer: fileBuffer, mimeType });
      }

      const fileBuffer = buffer.slice(fileStartIndex, fileEndIndex);
      resolve({ buffer: fileBuffer, mimeType });
    });

    req.on('error', reject);
  });
}

/**
 * API Handler
 */
export default async function handler(req, res) {
  console.log('[API] Extract request received, method:', req.method);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const { buffer: imageBuffer, mimeType } = await parseFormData(req);

    console.log('[API] File received, size:', imageBuffer.length, 'bytes, type:', mimeType);

    // Extract holdings from image
    const holdings = await extractPortfolioFromImage(imageBuffer, mimeType);

    console.log('[API] Extraction successful, returning', holdings.length, 'holdings');

    // Return extracted holdings
    return res.status(200).json({
      success: true,
      holdings,
      message: `Successfully extracted ${holdings.length} holdings from the image`,
    });
  } catch (error) {
    console.error('[API] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract portfolio data',
    });
  }
}
