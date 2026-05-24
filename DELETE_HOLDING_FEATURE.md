# Delete Holdings Row Feature

## Overview
Added the ability to delete individual fund holdings from the portfolio table. This is especially useful for removing old/inactive funds that have 0 Units but are still showing in the extracted data.

## Feature Details

### Smart Prompt System
The delete feature includes intelligent prompts:

**For funds with 0 Units:**
```
"[Fund Name]" has 0 Units.

Proceed to remove this fund?
```

**For funds with units:**
```
Remove "[Fund Name]"?
```

### How It Works

1. **User clicks Delete button** on any row in the holdings table
2. **Smart check**: If the fund has 0 Units, a special message is shown
3. **Confirmation**: User confirms the deletion
4. **Automatic recalculation**: Portfolio totals and weightages update instantly

### User Interface

- **Delete Button**: Red button ("Delete") appears in the Action column (rightmost)
- **Styling**: Hover effects for better interactivity
- **Position**: Last column in the table for easy access
- **Helper Text**: Updated instructions at bottom of table

## Implementation Details

### Files Modified

1. **PortfolioTable.jsx**
   - Added `onHoldingDelete` prop
   - Added Action column with delete button
   - Implemented `handleDeleteHolding()` with smart prompts
   - Updated helper text to mention delete feature

2. **PortfolioHoldingsSet.jsx**
   - Added `onHoldingDelete` prop
   - Passes delete handler to PortfolioTable
   - Bubbles up delete requests to parent

3. **MultipleHoldingsSets.jsx**
   - Added `onHoldingDelete` prop
   - Forwards delete handler through component tree

4. **ReviewUploadView.jsx**
   - Implemented `handleDeleteHolding()` logic
   - Filters out deleted holding
   - Recalculates portfolio totals and metrics
   - Passes handler through component chain

### Component Chain

```
ReviewUploadView
  ↓ handleDeleteHolding (setId, holdingId)
MultipleHoldingsSets
  ↓ onHoldingDelete
PortfolioHoldingsSet
  ↓ onHoldingDelete
PortfolioTable
  ↓ onHoldingDelete (delete button clicked)
  → handleDeleteHolding(holding)
```

## Code Flow

```javascript
// User clicks Delete button
handleDeleteHolding(holding) {
  // Check if units are 0
  if (units === 0) {
    // Smart prompt for zero-unit funds
    confirm(`"${fundName}" has 0 Units.\n\nProceed to remove this fund?`)
  } else {
    // Standard prompt
    confirm(`Remove "${fundName}"?`)
  }
  
  // On confirmation
  → calls onHoldingDelete(holdingId)
  → bubbles up to ReviewUploadView
  → filters holdings array
  → recalculates portfolio
  → updates state
}
```

## User Experience

### Before
- Screenshot with 50 holdings including 15 old funds with 0 Units
- User sees all 50 funds in table
- Difficult to clean data manually

### After
- User can quickly identify zero-unit funds
- Delete button provides smart prompt
- One click removes fund
- Portfolio recalculates automatically
- Table updates instantly

### Example Workflow

```
1. User uploads portfolio screenshot
2. See table with funds (some have 0 Units)
3. Scroll to fund with 0 Units
4. Click "Delete" button
5. Prompt: "XYZ Fund has 0 Units. Proceed to remove?"
6. Click "OK"
7. Fund removed, totals recalculate
8. Portfolio now shows 49 funds instead of 50
```

## Edge Cases Handled

✓ **Multiple zero-unit funds**: Each can be deleted independently
✓ **Last holding deletion**: User can delete down to 0 holdings (though they can't save with 0)
✓ **Recalculation**: All metrics update automatically
✓ **Confirmation**: Accidental clicks prevented with window.confirm()
✓ **Fund names with special characters**: Properly escaped in alerts

## Benefits

1. **Data Quality**: Remove stale/inactive holdings
2. **Cleaner Reports**: Final report won't include old funds
3. **Better UX**: Smart prompts guide user decisions
4. **Instant Feedback**: Portfolio updates immediately
5. **No Manual Cleanup**: Don't need external tools

## Future Enhancements (Optional)

- Bulk delete (select multiple rows)
- Undo/Redo functionality
- Archive instead of delete
- Export deleted items for audit trail
- Zero-unit filter/highlight
- Drag-to-reorder holdings

## Technical Notes

- Delete operations are **non-destructive to original data** (only affects current session)
- Recalculation uses existing `recalculatePortfolio()` utility
- No backend calls needed for deletion
- Changes persist until user saves portfolio
- If user doesn't save, deletions are discarded on refresh

## Testing Checklist

- [x] Delete fund with units → recalculates
- [x] Delete fund with 0 units → shows smart prompt
- [x] Delete multiple funds → each recalculates independently
- [x] Cancel deletion → nothing happens
- [x] Portfolio totals update correctly
- [x] Weightages recalculate
- [x] Market values update
- [x] Helper text visible
- [x] Delete button styling consistent

## Accessibility

- Delete button uses `title` attribute for tooltip
- Clear color coding (red for delete action)
- Text label is explicit ("Delete")
- Confirmation dialog prevents accidental deletions
- Works with keyboard navigation

---

## Summary

This feature adds a crucial data cleanup capability to the holdings table. Users can now easily remove old/inactive funds with a single click, with smart prompts guiding the process. The portfolio automatically recalculates, ensuring report accuracy.
