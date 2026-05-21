import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[EXTRACT] Request received');

    // Parse multipart form
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

    console.log('[EXTRACT] Image ready:', base64.length, 'chars');

    // Call Anthropic API directly with fetch
    console.log('[EXTRACT] Calling Anthropic API...');
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
                  data: base64,
                },
              },
              {
                type: 'text',
                text: 'Extract all investment holdings from this portfolio screenshot. Return ONLY a JSON array with objects containing: fundName, units, unitPrice, currency. No markdown, no explanation.',
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

    console.log('[EXTRACT] Got response, parsing...');

    // Extract JSON if wrapped in markdown
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      console.log('[EXTRACT] Found markdown wrapper');
      text = jsonMatch[1].trim();
    }

    let holdings = JSON.parse(text);
    if (!Array.isArray(holdings)) holdings = [holdings];

    console.log('[EXTRACT] Extracted', holdings.length, 'holdings');

    return res.status(200).json({
      success: true,
      holdings: holdings.map(h => ({
        id: `h-${Date.now()}`,
        fundName: String(h.fundName || 'Unknown').trim(),
        units: parseFloat(h.units) || 0,
        unitPrice: parseFloat(h.unitPrice) || 0,
        currency: String(h.currency || 'SGD').toUpperCase(),
        fxRateToSgd: 1.0,
      })),
    });
  } catch (error) {
    console.error('[EXTRACT] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
