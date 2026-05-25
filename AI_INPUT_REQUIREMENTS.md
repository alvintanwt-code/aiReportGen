# AI Input Requirements for Intelligent Portfolio Reports

## WHAT THE AI NEEDS TO GENERATE COMPLETE REPORTS

---

## **SECTION 1: PORTFOLIO DATA**

### Current Holdings
```javascript
{
  holdings: [
    {
      fundName: "Global Tech Fund",
      units: 500,
      unitPrice: 45.20,
      currency: "SGD",
      valuationSGD: 22600,
      allocation: 24.4%
    },
    {
      fundName: "Diversified Bond Fund",
      units: 1000,
      unitPrice: 32.50,
      currency: "SGD",
      valuationSGD: 32500,
      allocation: 35.1%
    },
    // ... more holdings
  ],
  totalPortfolioValue: 926250
}
```

### Previous Period Data (for comparison)
```javascript
{
  previousReviewDate: "2023-12-31",
  previousHoldings: [
    {
      fundName: "Global Tech Fund",
      units: 420,
      unitPrice: 35.80,
      valuationSGD: 15036
    },
    // ... previous state
  ],
  previousPortfolioValue: 846250
}
```

### Client Contributions & Withdrawals
```javascript
{
  contributions: [
    { date: "2024-01-15", amount: 15000 },
    { date: "2024-04-01", amount: 15000 },
    { date: "2024-07-15", amount: 15000 },
  ],
  totalContributions: 45000,
  withdrawals: 0
}
```

---

## **SECTION 2: ADVISOR ACTIONS & DECISIONS**

### Rebalancing/Fund Switches
```javascript
{
  advisorActions: [
    {
      date: "2024-03-15",
      type: "rebalancing",
      description: "Took profits from Tech fund peak, redeployed to defensive",
      details: {
        soldFund: "Global Tech Fund",
        soldUnits: 80,
        soldValue: 4640,
        boughtFund: "Diversified Bond Fund",
        boughtUnits: 140
      },
      rationale: "Tech valuation stretched; lock gains"
    },
    {
      date: "2024-06-01",
      type: "addition",
      description: "Added EM holding despite weakness",
      details: {
        addedFund: "Emerging Markets Fund",
        addedValue: 5000
      },
      rationale: "Patient positioning for long-term"
    }
  ]
}
```

---

## **SECTION 3: CLIENT PROFILE & OBJECTIVES**

### Client Information
```javascript
{
  clientName: "John Smith",
  age: 38,
  riskProfile: "moderate",
  investmentHorizon: 15, // years
  
  financialObjective: {
    target: 1200000, // SGD
    targetDate: 2032, // age 45
    purpose: "Wealth accumulation for early retirement"
  },
  
  investmentPhilosophy: {
    buyAndHold: true,
    globalDiversification: true,
    focusOnObjective: true,
    acceptVolatility: true
  },
  
  clientType: "educated", // understands investing
  preferredCommunication: "quarterly_review"
}
```

### Investment Preferences
```javascript
{
  investmentType: "regular_subscription", // lump sum or regular
  frequency: "monthly",
  amount: 3000,
  
  assetAllocationStrategy: "global_diversified",
  rebalancingFrequency: "annual_or_as_needed",
  
  acceptableLossThreshold: 15, // max drawdown %
  focusMetric: "objective_progress", // not beating benchmark
}
```

---

## **SECTION 4: ADVISOR PHILOSOPHY & STRATEGY**

### Advisor Profile
```javascript
{
  advisorName: "Jane Doe",
  philosophy: {
    globalMarkets: true,
    contraryToRecencyBias: true,
    clientEducation: true,
    costOptimization: true,
    disciplinedTiming: true
  },
  
  portfolio_approach: "buy_and_hold_with_tactical_rebalancing",
  
  investingBeliefs: [
    "Good companies exist everywhere in world",
    "Market cycles are normal and exploitable",
    "Client education prevents panic",
    "Cost matters as much as returns",
    "Time in market beats timing market"
  ],
  
  clientSegmentation: "high_earners_seeking_freedom"
}
```

---

## **SECTION 5: MARKET CONTEXT**

### Period Performance Data
```javascript
{
  reviewPeriod: {
    start: "2024-01-01",
    end: "2024-12-31"
  },
  
  marketPerformance: {
    usEquities: { ytd: 26.2, q4: -1.2 },
    globalEquities: { ytd: 8.5, q4: -0.8 },
    fixedIncome: { ytd: 4.2, q4: 1.1 },
    emergingMarkets: { ytd: -2.5, q4: -3.2 },
    usdStrength: { ytd: 5.5 },
    technologSector: { ytd: 28.0 },
    financialsSector: { ytd: 3.2 },
    energySector: { ytd: 2.1 }
  },
  
  marketContext: {
    highlights: "AI-driven tech rally, rate stabilization, EM challenged",
    keyEvents: [
      "Q1: Rate hike expectations ease",
      "Q2: Tech momentum accelerates",
      "Q3: Fed signals pause",
      "Q4: Broader market hesitation"
    ],
    volatilityLevel: "moderate"
  }
}
```

---

## **SECTION 6: PERFORMANCE CALCULATIONS**

### Calculated Metrics
```javascript
{
  // Automatic calculations from above data
  performance: {
    periodReturn: 4.0,
    periodReturnInvestmentGains: 35000,
    netOfContributions: true,
    
    benchmarkComparison: {
      clientReturn: 4.0,
      benchmarkReturn: 6.8,
      difference: -2.8,
      reason: "Expected due to diversification + new capital"
    },
    
    cumulativePerformance: {
      sinceInception: 26.25,
      yearOverYear: [
        { year: 2023, return: 21.5 },
        { year: 2024, return: 4.0 }
      ]
    },
    
    objectiveProgress: {
      targetAmount: 1200000,
      currentAmount: 926250,
      progressPercent: 77,
      yearsRemaining: 7,
      requiredAnnualReturn: 4.2
    }
  }
}
```

---

## **WHAT THE AI GENERATES FROM THIS:**

```
AI ANALYSIS ENGINE receives the above data and generates:

1. OPENING INSIGHT
   → Analyzes market context + portfolio performance
   → Writes 2-3 sentences connecting story to client situation
   
2. NARRATIVE FLOW
   → Advisor actions + market context → Strategic explanation
   → Why decisions made sense at the time
   
3. PERFORMANCE COMMENTARY
   → "You gained X%, market did Y%, here's why the difference"
   → Educational context (dilution from contributions, etc)
   
4. DECISIONS EXPLANATION
   → Why rebalancing was done
   → What was the market signal
   → What was the outcome
   
5. MARKET CONTEXT NARRATIVE
   → What happened in markets this period
   → How it affected the portfolio
   → How positioning protected them
   
6. OBJECTIVE PROGRESS
   → On pace? Ahead? Behind?
   → What return rate needed going forward
   → Reassurance or action items
   
7. FORWARD OUTLOOK
   → Based on market conditions + client objectives
   → Suggested actions (if any)
   → Risk factors to monitor
   
8. EMOTIONAL CLOSING
   → Reinforce trust and advisor competence
   → Connect to client's long-term vision
   → Build sticky relationship
```

---

## **DATA VALIDATION THE AI NEEDS:**

```javascript
{
  validation: {
    // Must verify before generating report
    portfolioValueMath: "previousValue + contributions + gains = currentValue",
    allocationSums: "individual allocations add to ~100%",
    returnCalculation: "gains match (current - previous - contributions)",
    datesLogical: "review date >= previous date",
    clientObjectiveRealistic: "required return is achievable"
  }
}
```

---

## **OPTIONAL INPUTS (FOR ENHANCED REPORTS):**

```javascript
{
  // If advisor provides more detail, AI can create richer insights
  optionalInputs: {
    advisorNotes: "Specific observations about period",
    clientConcerns: "Any worries client expressed",
    lifeEvents: "Marriage, home purchase, job change, etc",
    comparisonPortfolios: "What if they kept original allocation?",
    specificSectorInsights: "Our view on tech, EM, bonds",
    taxOptimizationNotes: "Realized losses, carried forward, etc",
    upcomingNeeds: "Planned withdrawal timing, lump sum needs"
  }
}
```

---

## **THE COMPLETE FLOW:**

```
ADVISOR INPUT:
├─ Current holdings (table from upload)
├─ Previous holdings (from PDF or manual)
├─ Contributions & withdrawals
├─ Actions taken (fund switches, rebalancing)
├─ Client profile (from form wizard)
├─ Investment objectives
└─ Market context (auto-fetched from APIs)

↓

AI PROCESSING:
├─ Validates all data
├─ Calculates returns and metrics
├─ Understands advisor philosophy
├─ Analyzes decisions made
├─ Compares to market conditions
├─ Assesses objective progress
└─ Determines narrative tone

↓

REPORT GENERATION:
├─ Opens with insight about period
├─ Tells the story of what happened
├─ Explains decisions and outcomes
├─ Shows progress toward goals
├─ Educates client
├─ Builds trust and credibility
└─ Closes with confidence and next steps

↓

OUTPUT:
7-page professional report that makes client feel:
✓ Accounted for
✓ Cared for
✓ Educated
✓ Confident in advisor
✓ Clear on progress
✓ Ready to continue
```

---

## **SUMMARY: MINIMUM VIABLE INPUTS**

To generate a complete intelligent report, you need:

### Must-Have:
1. Current holdings (fund, units, prices)
2. Previous holdings (for comparison)
3. Contributions this period
4. Client objectives (target $, timeline)
5. Investment approach (buy & hold vs tactical)
6. Market context summary

### Should-Have:
7. Advisor actions taken (rebalancing dates & reasons)
8. Client profile (age, risk tolerance, objective)
9. Advisor philosophy (core beliefs)

### Nice-to-Have:
10. Advisor notes on the period
11. Client life events
12. Specific market insights

**Minimum setup time: 10-15 minutes per review**  
**Result: Professional, personalized, intelligent report**

---
