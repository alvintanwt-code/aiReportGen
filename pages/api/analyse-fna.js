import Anthropic from '@anthropic-ai/sdk';
import { getAdvisorSystemBlocks } from '../../lib/advisorSystem';

const client = new Anthropic({
  apiKey: process.env.LEET_ANTHROPIC_KEY,
});

export const config = {
  maxDuration: 60,
};

function buildAnalysisPrompt(data, metrics) {
  const fmt = (v) => Math.round(v || 0).toLocaleString('en-SG');
  return `You have already been given the LEET Advisory methodology, house views, product index, and client playbooks via the system prompt. Now produce an ADVISOR'S READ of this specific client — a context page that will appear BEFORE any product recommendation.

This is NOT a recommendation page. Do not suggest specific products, providers, or sums assured. Your job is to demonstrate UNDERSTANDING of the client so the advisor can verify accuracy at a glance.

CLIENT DATA (extracted from FNA):
${JSON.stringify(data, null, 2)}

COMPUTED METRICS (use these values verbatim — do not recompute):
- Age: ${metrics.age}
- Target work-optional age: ${metrics.targetAge} (${metrics.targetAgeFromExtraction ? 'extracted from client priorities' : 'dashboard default — client has not stated a target'})
- FI Ratio: ${metrics.fiRatio.toFixed(1)}% — Phase: ${metrics.phase}
- Years to target: ${metrics.yearsToTarget}
- Net worth: S$${fmt(metrics.netWorth)}
- Liquid assets (all sources): S$${fmt(metrics.liquidAssets)}
- Non-CPF liquid (carries bridge years to 65): S$${fmt(metrics.nonCPFLiquid)}
- Total liabilities: S$${fmt(metrics.totalLiabilities)}
- Debt ratio (debt ÷ total assets): ${metrics.debtRatio.toFixed(1)}%
- Monthly income (all sources): S$${fmt(metrics.monthlyIncome)}
- Monthly expenses: S$${fmt(metrics.monthlyExpenses)}
- Monthly savings: S$${fmt(metrics.monthlySavings)}
- Savings rate: ${metrics.savingsRate.toFixed(1)}%
- Projected CPF Life income from 65: S$${fmt(metrics.annualCPFLifeIncome)}/yr
- Required nest egg at target age: S$${fmt(metrics.requiredNestEgg)}
- Projected liquid at target age: S$${fmt(metrics.projectedLiquidAtTarget)}

Return JSON with this exact shape (and nothing else):
{
  "snapshot": "3-5 sentence paragraph in LEET voice. Open with a one-line who-they-are. State the financial position bluntly using real numbers from above. End with a one-line read on trajectory — what story the numbers actually tell. No platitudes, no bullets, no headers.",
  "archetype": {
    "code": "A | B | C | D | E",
    "label": "Young Working Adult | Young Average Family | Generation X | Pre-retiree/Retiree | Affluent/HNW",
    "confidence": "high | medium | low",
    "rationale": "One sentence — what specifically made it this archetype."
  },
  "score": {
    "value": 6.5,
    "max": 10,
    "rationale": "One sentence — what's pulling the score up, what's holding it back. 10 = ideal positioning for this archetype, 5 = average, 1 = severe issues."
  },
  "ratios": [
    { "label": "Debt servicing ratio", "value": "string like \\"22%\\"", "verdict": "healthy | watch | off-track", "comment": "One line." },
    { "label": "Savings rate", "value": "string like \\"18%\\"", "verdict": "healthy | watch | off-track", "comment": "One line." },
    { "label": "Protection coverage", "value": "string like \\"8x annual income\\"", "verdict": "healthy | watch | off-track", "comment": "One line." }
  ],
  "priorities": [
    { "title": "Where the conversation needs to go (no products)", "rationale": "One short paragraph — why this priority before the next." }
  ],
  "fragilities": [
    { "title": "Hidden fragility name (from LEET fragility framework)", "rationale": "Brief explanation of why this is a fragility for this client." }
  ]
}

RULES:
- Use the deterministic values supplied above. For "Protection coverage": total death sum assured (sum across all policies) ÷ annual income (monthly income × 12), expressed as a multiple like "8x annual income".
- Verdict thresholds: savings rate — healthy ≥20%, watch 10-19%, off-track <10%. DSR — healthy <30%, watch 30-45%, off-track >45%. Protection coverage — healthy ≥10x, watch 5-9x, off-track <5x. Override these only if the archetype context clearly justifies it (e.g. an HNW with low protection ratio may be appropriate because of self-insurance).
- Priorities: 3 to 5 items, ranked by urgency. NO product names. NO providers. NO specific sums assured. State only "where the conversation should focus" — e.g. "Close the protection gap before income peaks", "Lock the 10-year compounding window".
- Fragilities: only include if genuinely present in the data. Empty array if none. Examples: overpaying for parent-bought policies, whole life with high cost low cover, asset-rich-cash-poor with short retirement runway, single-income optimisation in a dual-income household, estate planning gap at HNW scale.
- Snapshot paragraph voice: experienced advisor speaking. No "as an AI". No bullet lists inside the paragraph. Plain English, slight dry humour OK, no platitudes. Match the house style.
- Return ONLY valid JSON. No markdown code fences, no commentary before or after.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { extractedData, metrics } = req.body || {};
    if (!extractedData || !metrics) {
      return res.status(400).json({ error: 'extractedData and metrics are required' });
    }

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: getAdvisorSystemBlocks(),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildAnalysisPrompt(extractedData, metrics),
            },
          ],
        },
      ],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

    let analysis;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch (parseError) {
      console.error('Analyse JSON parse error:', parseError);
      console.error('Raw text:', text);
      return res.status(400).json({
        error: 'Failed to parse analysis JSON',
        raw: text.slice(0, 500),
      });
    }

    return res.status(200).json({
      analysis,
      usage: {
        cache_creation_input_tokens: response.usage?.cache_creation_input_tokens,
        cache_read_input_tokens: response.usage?.cache_read_input_tokens,
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens,
      },
    });
  } catch (error) {
    console.error('Analyse error:', error);
    return res.status(500).json({
      error: error.message || 'Unknown analysis error',
      details: error.type || 'Unknown error type',
    });
  }
}
