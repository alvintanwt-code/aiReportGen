import Anthropic from '@anthropic-ai/sdk';
import formidable from 'formidable';
import * as fs from 'fs/promises';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const FNA_EXTRACTION_PROMPT = `You are a financial needs analysis expert. Extract the following information from the provided screenshots:

PERSONAL INFORMATION:
- Name
- Gender
- Age
- Marital status
- Dependents and their ages (in years)
- Key priorities highlighted

POLICIES:
For each insurance policy, extract:
- Type (Wealth, Life, Health)
- Policy name
- Annual premium
- Years left to pay
- Sum assured (Death, Disability, Critical Illness)
- If it's a Wealth policy: name, annual premium, total premium paid, years left to pay

ASSETS:
For each category, sum all individual holdings to get the total:
- Total cash savings (bank accounts)
- CPF OA (Ordinary Account) - total across all CPF accounts
- CPF SA (Special Account) - total across all CPF accounts
- CPF MA (Medisave Account) - total across all CPF accounts
- Equities (sum of all individual equity holdings, including stocks in tables)
- Mutual funds (sum of all mutual fund holdings in tables - Current Value column)
- Insurance cash value (cash surrender value or policy values)
- Residential property value (primary residence only)

LIABILITIES:
- Loans (any kind)
- Mortgage

CASHFLOW:
- Income
- Other income
- Net expenses
- Net investment RSP (Regular Savings Plan)

Return the data as a JSON object with the following structure:
{
  "personalInfo": {
    "name": "",
    "gender": "",
    "age": 0,
    "maritalStatus": "",
    "dependents": [{ "age": 0 }],
    "priorities": ""
  },
  "policies": [
    {
      "type": "",
      "name": "",
      "annualPremium": 0,
      "yearsLeftToPay": 0,
      "sumAssuredDeath": 0,
      "sumAssuredDisability": 0,
      "sumAssuredCI": 0,
      "totalPremiumPaid": 0
    }
  ],
  "assets": {
    "cashSavings": 0,
    "cpfOA": 0,
    "cpfSA": 0,
    "cpfMA": 0,
    "equities": 0,
    "mutualFunds": 0,
    "insuranceCashValue": 0,
    "residentialPropertyValue": 0
  },
  "liabilities": {
    "loans": 0,
    "mortgage": 0
  },
  "cashflow": {
    "income": 0,
    "otherIncome": 0,
    "netExpenses": 0,
    "netInvestmentRSP": 0
  }
}

Important:
- Extract ALL numeric values as numbers (not strings)
- If a value is not found, use 0 or empty string
- Be precise with currency amounts
- For tables with multiple rows: SUM all values in that category (e.g., if there are 5 equity holdings, add them all together)
- Use "Current Value" or equivalent column for investment totals
- Ignore unrealised gains/losses columns - only use current values
- For portfolio statements: look for "Total" rows at the bottom or sum individual holdings
- Return ONLY valid JSON, no markdown or explanations`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data using formidable
    const form = formidable({ multiples: true });
    const [fields, uploadedFiles] = await form.parse(req);

    // Extract files from the parsed form
    const files = [];
    const fileFields = ['screenshot1', 'screenshot2', 'screenshot3', 'screenshot4'];

    for (const field of fileFields) {
      if (uploadedFiles[field]) {
        const fieldFiles = Array.isArray(uploadedFiles[field])
          ? uploadedFiles[field]
          : [uploadedFiles[field]];
        files.push(...fieldFiles);
      }
    }

    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Prepare image content for Claude Vision
    const imageContent = [];
    for (const file of files) {
      const fileBuffer = await fs.readFile(file.filepath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';

      imageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType,
          data: base64Data,
        },
      });
    }

    // Call Claude Vision API with all images
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: FNA_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract the response
    const extractedText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON response
    let extractedData;
    try {
      // Find JSON in the response (it might be wrapped in markdown code blocks)
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = JSON.parse(extractedText);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Extracted text:', extractedText);
      return res.status(400).json({ error: 'Failed to parse extracted data' });
    }

    // Clean up uploaded files
    for (const file of files) {
      try {
        await fs.unlink(file.filepath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    return res.status(200).json(extractedData);
  } catch (error) {
    console.error('Extraction error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      type: error.type,
      stack: error.stack
    });
    return res.status(500).json({
      error: error.message || 'Unknown extraction error',
      details: error.type || 'Unknown error type'
    });
  }
}
