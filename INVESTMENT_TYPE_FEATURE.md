# Dynamic Investment Type Feature

## Overview
Enhanced the ReportDetailsForm with conditional fields based on investment type selection. The form now adapts to show relevant contribution details for either Lump Sum or Regular Subscription investments.

## Features

### 1. Investment Type Selection (Step 2)
Radio button selection between two investment types:
- **Lump Sum** - One-time initial investment with optional top-ups
- **Regular Subscription** - Recurring premium payments (annual or monthly) with optional top-ups and withdrawals

### 2. Conditional Form Fields

#### For Lump Sum Investments
Blue-highlighted section showing:
- **Initial Capital (SGD)** - Required field
- **Total Top Ups (SGD)** - Optional field (total of all additional contributions)

Example:
```
Initial Capital: 100,000
Total Top Ups: 50,000
Total Invested: 150,000
```

#### For Regular Subscription Investments
Purple-highlighted section showing:
- **Premium Frequency** - Dropdown (Annual/Monthly)
- **Premium Amount (SGD)** - Required field (varies by frequency)
- **Any Top Ups (SGD)** - Optional field (additional lump sum contributions)
- **Any Withdrawals (SGD)** - Optional field (partial withdrawals)

Example (Annual):
```
Premium Frequency: Annual
Premium Amount: 12,000/year
Any Top Ups: 10,000
Any Withdrawals: 5,000
```

### 3. Updated Account Provider List
Sorted alphabetically:
- AIA
- Etiqa
- FWD
- HSBC Life
- Income
- Manulife
- Singlife
- Tokiomarine
- Other

## User Experience

### Step 2: Portfolio Accounts

**Default State:**
```
┌─ Portfolio 1 ──────────────────────────┐
│ Account Name: [text input]             │
│ Policy Number: [text input]            │
│ Start Date: [date picker]              │
│ Policyholder Name: [text input]        │
│ Account Provider: [dropdown ▼]         │
│                                        │
│ Investment Type:                       │
│ ⊙ Lump Sum  ⊙ Regular Subscription   │
└────────────────────────────────────────┘
```

**When Lump Sum Selected:**
```
┌─ Investment Type (LUMP SUM) ───────────┐
│ ┌─ Blue Section ─────────────────────┐ │
│ │ Initial Capital: [___________]     │ │
│ │ Total Top Ups:   [___________]     │ │
│ └─────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**When Regular Subscription Selected:**
```
┌─ Investment Type (REGULAR) ────────────┐
│ ┌─ Purple Section ────────────────────┐ │
│ │ Premium Frequency: [Annual/Monthly] │ │
│ │ Premium Amount:    [___________]    │ │
│ │ Any Top Ups:       [___________]    │ │
│ │ Any Withdrawals:   [___________]    │ │
│ └─────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

## Form Validation

### Required Fields by Type

**Lump Sum:**
- Initial Capital (must be provided)
- All other fields optional

**Regular Subscription:**
- Premium Amount (must be provided based on frequency)
- All other fields optional

### Smart Validation
```javascript
if (investmentType === 'lumpsum') {
  if (!initialCapital) error: 'Initial capital is required'
}
else if (investmentType === 'regular') {
  if (!premiumAmount) error: 'Premium amount is required'
}
```

## Data Structure

### State
```javascript
accountsData = [
  {
    id: 'set-1',
    name: 'HSBC Life',
    policyNumber: 'ABC123',
    startDate: '2024-01-15',
    policyholderName: 'John Smith',
    accountProvider: 'hsbc-life',
    
    // Investment Type
    investmentType: 'lumpsum', // or 'regular'
    
    // Lump Sum
    initialCapital: 100000,
    totalTopUps: 50000,
    
    // Regular Subscription
    premiumFrequency: 'annual', // or 'monthly'
    premiumAmount: 12000,
    regularTopUps: 10000,
    regularWithdrawals: 5000,
  }
]
```

### Output Summary
Each account generates an investment summary:

**Lump Sum:**
```
"Lump Sum: Initial Capital SGD 100,000 + Top Ups SGD 50,000"
```

**Regular:**
```
"Regular Annual Premium: SGD 12,000 + Top Ups SGD 10,000 - Withdrawals SGD 5,000"
```

## Visual Design

### Color Coding
- **Lump Sum** - Blue (#e8f4f8) with blue left border
- **Regular** - Purple (#f0e8f4) with purple left border
- Helps users distinguish between investment types

### Field Organization
- Grid layout (1fr 1fr for two-column sections)
- Grouped by relevance
- Clear labels and placeholders
- Consistent with rest of form

## Implementation Details

### Modified Component
**ReportDetailsForm.jsx**

**Changes:**
1. Added investment type state to accountsData
2. Added all new fields (frequency, premiums, top-ups, withdrawals)
3. Implemented conditional rendering based on investmentType
4. Updated validation logic
5. Enhanced data output with investment summaries
6. Updated provider dropdown with alphabetized list

### Data Flow
```
User selects Investment Type
         ↓
Form re-renders with conditional fields
         ↓
User fills type-specific details
         ↓
Validation checks required fields for type
         ↓
onGenerateReport includes investment details
```

## Use Cases

### Scenario 1: Life Insurance with Lump Sum
```
Client: "I invested SGD 100,000 upfront and added SGD 25,000 after 2 years"

Form Entry:
- Investment Type: Lump Sum
- Initial Capital: 100,000
- Total Top Ups: 25,000

Summary: "Lump Sum: Initial Capital SGD 100,000 + Top Ups SGD 25,000"
```

### Scenario 2: Endowment with Regular Premiums
```
Client: "I pay SGD 1,500 monthly and added SGD 10,000 once. I withdrew SGD 3,000 last year"

Form Entry:
- Investment Type: Regular Subscription
- Premium Frequency: Monthly
- Premium Amount: 1,500
- Any Top Ups: 10,000
- Any Withdrawals: 3,000

Summary: "Regular Monthly Premium: SGD 1,500 + Top Ups SGD 10,000 - Withdrawals SGD 3,000"
```

### Scenario 3: Pure Annual Subscription
```
Client: "I pay SGD 12,000 every year, no additional contributions"

Form Entry:
- Investment Type: Regular Subscription
- Premium Frequency: Annual
- Premium Amount: 12,000
- Any Top Ups: (leave empty)
- Any Withdrawals: (leave empty)

Summary: "Regular Annual Premium: SGD 12,000"
```

## Benefits

✅ **Type-Specific**: Only shows relevant fields
✅ **Clear Guidance**: Different colors for different types
✅ **Smart Validation**: Validates based on investment type
✅ **Flexible**: Handles complex contribution patterns
✅ **Professional**: Generates clear summaries
✅ **User-Friendly**: Intuitive radio button selection
✅ **Comprehensive**: Captures top-ups and withdrawals
✅ **International**: Covers both local and regional insurers

## Future Enhancements

- Add contribution history table (multi-year tracking)
- Calculate total contributed based on premium frequency
- Add policy anniversary date
- Track surrender charges and riders
- Support for currency-specific premiums (USD, HKD, etc.)
- PDF report includes contribution timeline chart
- Comparison with other policies on same account

## Testing Checklist

- [x] Lump Sum option shows/hides correct fields
- [x] Regular option shows/hides correct fields
- [x] Validation works for each type
- [x] Color highlighting works
- [x] Provider list is alphabetized
- [x] Radio buttons switch correctly
- [x] All fields accept expected inputs
- [x] Summary text generates correctly
- [x] Multiple accounts work independently
- [x] Form resets properly between portfolios

---

## Summary

The dynamic investment type feature transforms a generic form into a specialized tool for capturing insurance product details. By adapting to the specific investment structure (lump sum vs. regular subscription), the form becomes more intuitive and captures all relevant financial information needed for comprehensive portfolio reporting.
