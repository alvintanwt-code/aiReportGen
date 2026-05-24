import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file as base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Determine media type
    const mimeType = file.type || 'image/png';

    console.log('[EXTRACT_API] Processing image:', file.name, 'Type:', mimeType);

    // Call Claude Vision API
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
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
              text: `Extract portfolio holdings data from this image. Return ONLY valid JSON (no markdown, no code blocks).

CRITICAL INSTRUCTIONS:
- Extract FX rates with FULL PRECISION exactly as shown in the image (e.g., 1.27959, 1.48520, NOT rounded)
- Extract all decimal places for FX rates - this is critical for accuracy
- Extract Unit Price with full precision
- Extract Unit quantity as shown

For each holding, extract:
{
  "fundName": "exact fund name from image",
  "currency": "fund currency code",
  "units": number (exact value shown),
  "unitPrice": number (full precision),
  "policyValueFundCurrency": number (full precision),
  "fxRateToSgd": number (FULL PRECISION - e.g., 1.27959, NOT 1.3),
  "policyValueSgd": number (full precision),
  "valuationDate": "date as shown"
}

Return as valid JSON array: [{ ... }, { ... }]

IMPORTANT: Preserve ALL decimal places for fxRateToSgd. Do not round.`,
            },
          ],
        },
      ],
    });

    // Parse response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = content.text;
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    let holdings = JSON.parse(jsonText);

    // Validate and transform holdings
    holdings = holdings.map((h) => ({
      id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fundName: h.fundName || '',
      currency: h.currency || '',
      units: parseFloat(h.units) || 0,
      unitPrice: parseFloat(h.unitPrice) || 0,
      policyValueFundCurrency: parseFloat(h.policyValueFundCurrency) || 0,
      fxRateToSgd: parseFloat(h.fxRateToSgd) || 1, // FULL PRECISION preserved
      policyValueSgd: parseFloat(h.policyValueSgd) || 0,
      valuationDate: h.valuationDate || '',
    }));

    console.log('[EXTRACT_API] Successfully extracted', holdings.length, 'holdings');
    console.log('[EXTRACT_API] Sample FX rates:', holdings.map(h => h.fxRateToSgd).slice(0, 3));

    return Response.json({
      success: true,
      holdings: holdings,
    });
  } catch (error) {
    console.error('[EXTRACT_API] Error:', error);
    return Response.json(
      { error: error.message || 'Failed to extract portfolio data' },
      { status: 500 }
    );
  }
}
