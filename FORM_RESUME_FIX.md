# Form Draft Resume Fix - Detailed Explanation

## The Problem

The form draft resume feature was not properly restoring user-filled fields. When users clicked "Resume", the form would load but show default empty values instead of the previously saved data.

### Root Cause

There was a **critical race condition** in the auto-save mechanism:

1. **On component mount:**
   - `accountsData` initialized with default values (all fields empty strings)
   - First `useEffect` (lines 59-72) detects saved draft, sets `hasSavedDraft = true`
   - **IMMEDIATELY**, second `useEffect` (lines 76-98) runs and saves the form state to localStorage
   - This auto-save happens with DEFAULT values, **overwriting** the previously saved draft that contained user data!

2. **When user clicks Resume:**
   - `loadDraft()` is called
   - It retrieves the localStorage, but it now contains the defaults from step 1!
   - User sees empty form fields instead of their saved data

## The Solution

### 1. Added `isInitialMount` State Flag

```javascript
const [isInitialMount, setIsInitialMount] = useState(true);
```

This flag tracks whether the component is on its first render.

### 2. Modified First useEffect to Set Flag to False

```javascript
useEffect(() => {
  const savedDraft = localStorage.getItem(STORAGE_KEY);
  if (savedDraft) {
    setHasSavedDraft(true);
  }
  // Mark that initial mount is complete
  setIsInitialMount(false);  // <-- KEY FIX
}, []);
```

After the first `useEffect` completes (checking for saved draft), it sets `isInitialMount = false`.

### 3. Auto-Save Checks isInitialMount

```javascript
useEffect(() => {
  if (isInitialMount) {
    console.log('[ReportDetailsForm] Skipping auto-save on initial mount');
    return;  // <-- KEY FIX: Don't save defaults
  }

  // Proceed with auto-save...
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
}, [isInitialMount, step, clientFullName, ...]);
```

The auto-save now skips its first run. This prevents overwriting the previously saved draft with default values.

### 4. Improved Number Input Handling

Updated all number inputs to properly handle both empty strings and numeric values:

```javascript
// Before (problematic):
<input
  type="number"
  value={account.initialCapital}
  onChange={(e) => handleAccountChange(idx, 'initialCapital', parseFloat(e.target.value) || '')}
/>

// After (robust):
<input
  type="number"
  value={account.initialCapital === null || account.initialCapital === undefined ? '' : account.initialCapital}
  onChange={(e) => handleAccountChange(idx, 'initialCapital', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
/>
```

This ensures:
- Empty input displays as empty string, not 0
- User-entered values are converted to numbers for storage
- Loaded values display correctly

## Execution Flow (After Fix)

1. **Mount**: Component loads, accountsData has defaults
2. **First useEffect**: Detects saved draft (if exists), sets `isInitialMount = false`
3. **Second useEffect**: Sees `isInitialMount = true`, **skips auto-save**
4. **Render**: Shows resume banner if draft exists
5. **User clicks Resume**: 
   - Calls `loadDraft()`
   - Retrieves original saved draft from localStorage (still has all user data)
   - Updates state with saved values
   - Form re-renders with all filled fields restored ✅
6. **User makes edits**: 
   - `isInitialMount` is now false
   - Auto-save runs normally
   - Changes are saved to localStorage

## Fields Fixed

All number input fields now properly preserve values:
- ✅ Initial Capital
- ✅ Total Top Ups
- ✅ Premium Amount
- ✅ Regular Top Ups
- ✅ Regular Withdrawals
- ✅ Current Valuation

Plus all text fields:
- ✅ Primary Advisor Name
- ✅ Secondary Advisor Name
- ✅ Account Name
- ✅ Policyholder Name

And date fields (already working):
- ✅ Inception Date
- ✅ Report Date
- ✅ Report Period

## Testing the Fix

1. Fill out the form with values on all three steps
2. Close the browser tab or navigate away
3. Return to the app
4. You should see the "📝 Draft Saved" banner
5. Click "Resume"
6. ✅ All previously filled values should be restored
