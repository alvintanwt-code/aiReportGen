import Anthropic from '@anthropic-ai/sdk';
import formidable from 'formidable';
import * as fs from 'fs/promises';
import { getAdvisorSystemBlocks } from '../../lib/advisorSystem';

const client = new Anthropic({
  apiKey: process.env.LEET_ANTHROPIC_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

const FNA_EXTRACTION_PROMPT = `You are a financial needs analysis expert. Extract EVERY visible field from the provided screenshots. Do not skip fields just because they look like minor line items — capture all of them.

PERSONAL INFORMATION:
- Name, gender, age, marital status, key priorities
- Dependents: for each one capture name (if visible), relationship (child, spouse, parent, etc.), age in years, and "years of support" remaining (how many more years they will be financially supported — e.g., a 10-year-old child supported until 25 has 15 years of support)
- Target work-optional age: the age at which the client wants to be financially independent / able to stop working. Look in the priorities text, goals descriptions, and any free-text comments for phrases like "retire at 55", "FIRE", "financially independent by 45", "stop working at X", "early retirement at Y", "work-optional by Z". If a specific age is stated, capture it as a number. If only "early retirement" is mentioned without an age, use 55. If only "retirement" with no early framing, leave as 0 (the dashboard will default to 65).

POLICIES:
For each insurance policy, extract:
- Type (Wealth, Life, Health, CI, Disability, Hospital, etc.)
- Policy name
- Annual premium
- Years left to pay
- Sum assured (Death, Disability, Critical Illness)
- Total premium paid (for Wealth policies)

ASSETS — extract every category visible. Sum multiple holdings within the same category:
- Cash savings (bank accounts, fixed deposits)
- CPF OA, SA, MA (sum across all CPF accounts per type)
- SRS (Supplementary Retirement Scheme)
- Equities (individual stocks, sum the Current Value column)
- Bonds
- Mutual funds / unit trusts (sum Current Value column)
- ETFs
- Insurance cash value (surrender value across all policies)
- Residential property value (primary residence)
- Investment property value (any non-primary properties — rental or held for investment)
- Business interests (private company stakes, partnerships)
- Other assets (gold, art, crypto, alternative investments, anything else you see)

LIABILITIES — capture every debt category:
- Personal loans
- Primary residence mortgage
- Investment property mortgage
- Credit card debt
- Car loan
- Other liabilities (margin, study loans, anything else)

CASHFLOW:
- Monthly income (employment)
- Other income (bonuses, dividends, etc.)
- Rental income
- Regular investment (cash) — store this in "netInvestmentRSP":
    * The PRIMARY label to look for is "Regular Investment (Cash)" — capture this verbatim line if present.
    * Other valid labels: "Regular Savings Plan", "RSP", "Regular Investment", "Monthly Investment Contribution".
    * Found under the "Outflow" or "Monthly Outflows" section of the FNA.
    * Semantically: monthly cash the client is currently directing INTO investments. This is wealth-building,
      NOT consumption.
    * If multiple regular investment lines exist (e.g. one to RSP, one to ILP, one to SRS top-up), SUM them.
    * Do NOT include insurance premiums here (those belong under expenses.insurance).
    * Do NOT include CPF contributions here (those are auto-deducted from gross income, not declared outflows).
- Net expenses (total monthly expenses):
    * Strictly fixed + variable consumption items: housing, food, transport, utilities, insurance premiums,
      lifestyle, children's education, parents allowance, healthcare, other.
    * EXCLUDE regular investment / RSP — even though it appears as an outflow on the FNA, it is wealth-building,
      not an expense. It belongs in netInvestmentRSP, not netExpenses.
    * EXCLUDE CPF contributions (already auto-deducted from gross income).
- Expense BREAKDOWN — extract each line item even if it is small:
  - Housing (rent + utilities housing portion if combined)
  - Food
  - Transport
  - Utilities (electricity, water, gas, internet, mobile)
  - Insurance premiums (monthly)
  - Lifestyle / entertainment / dining out / shopping
  - Children education (school fees, tuition, enrichment)
  - Parents allowance / filial obligation
  - Healthcare (out-of-pocket)
  - Other expenses (anything not covered above)

GOALS — extract every goal you can see, categorised by horizon:
- Short term (0–3 years): e.g. emergency fund, wedding, vacation, car
- Mid term (3–10 years): e.g. property down payment, kids' early education
- Long term (10+ years): e.g. retirement, legacy, kids' tertiary education
For each goal capture: description (free text), target amount in SGD, target years from now

Return the data as a JSON object with this exact structure:
{
  "personalInfo": {
    "name": "",
    "gender": "",
    "age": 0,
    "maritalStatus": "",
    "dependents": [
      { "name": "", "relationship": "", "age": 0, "yearsOfSupport": 0 }
    ],
    "priorities": "",
    "targetWorkOptionalAge": 0
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
    "srs": 0,
    "equities": 0,
    "bonds": 0,
    "mutualFunds": 0,
    "etfs": 0,
    "insuranceCashValue": 0,
    "residentialPropertyValue": 0,
    "investmentPropertyValue": 0,
    "businessInterests": 0,
    "otherAssets": 0
  },
  "liabilities": {
    "loans": 0,
    "mortgage": 0,
    "investmentPropertyMortgage": 0,
    "creditCardDebt": 0,
    "carLoan": 0,
    "otherLiabilities": 0
  },
  "cashflow": {
    "income": 0,
    "otherIncome": 0,
    "rentalIncome": 0,
    "netInvestmentRSP": 0,
    "netExpenses": 0,
    "expenses": {
      "housing": 0,
      "food": 0,
      "transport": 0,
      "utilities": 0,
      "insurance": 0,
      "lifestyle": 0,
      "childrenEducation": 0,
      "parentsAllowance": 0,
      "healthcare": 0,
      "otherExpenses": 0
    }
  },
  "goals": {
    "shortTerm": [
      { "description": "", "targetAmount": 0, "targetYears": 0 }
    ],
    "midTerm": [
      { "description": "", "targetAmount": 0, "targetYears": 0 }
    ],
    "longTerm": [
      { "description": "", "targetAmount": 0, "targetYears": 0 }
    ]
  }
}

EXTRACTION RULES:
- Extract ALL numeric values as numbers (not strings)
- If a value is not visible in the screenshots, use 0 (for numbers) or "" (for strings)
- DO NOT invent or estimate values that aren't shown
- For tables with multiple rows in the same category: SUM all values
- Use "Current Value" / "Market Value" columns for investment totals
- Ignore unrealised gain/loss columns — only use current values
- For portfolio statements, prefer the "Total" row if shown; otherwise sum individual holdings
- If both a breakdown AND a total are shown for expenses, capture BOTH (the breakdown into "expenses" and the total into "netExpenses")
- If only a breakdown is shown, still fill "expenses" — leave "netExpenses" at 0
- If only a total is shown, fill "netExpenses" — leave breakdown lines at 0
- Goals arrays: include one object per goal you see. If no goals visible for a horizon, return an empty array []
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
    // System prompt = LEET Advisory house methodology (cached).
    // User message  = the extraction task for this specific upload.
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: getAdvisorSystemBlocks(),
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
