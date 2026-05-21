# AI Report Generator - Phase 1 & 2

Portfolio review management app for financial advisors.

## Phase 1 Features ✅

✅ Create new clients (with name, DOB, email, mobile number)
✅ Delete clients (and their reviews)
✅ Create reviews under a client
✅ Delete reviews
✅ "Start Review" button navigates to upload page
✅ Local state with localStorage persistence
✅ Console logging for debugging

## Phase 2 Features ✅

✅ Upload portfolio screenshot image (drag-drop or click)
✅ Mock extraction (returns 5 sample holdings with realistic data)
✅ **Multiple portfolios per review** (unlimited screenshots)
✅ Name each portfolio (HSBC, AIA, Manulife, etc.)
✅ Portfolio holdings table with 8 columns per portfolio:
   - Fund Name, Units, Unit Price, Currency
   - FX Rate to SGD
   - Market Value (Original Currency) - calculated
   - Market Value (SGD) - calculated
   - Portfolio Weightage % - calculated
✅ Editable table cells (click to edit, calculations auto-update)
✅ Real-time calculations:
   - Market Value = Units × Unit Price
   - Market Value SGD = Market Value × FX Rate
   - Total Portfolio Value (SGD) per portfolio
   - Combined total across all portfolios
   - Weightage % = (Holding Value SGD / Total Value SGD) × 100
✅ Delete individual portfolio (keeps others)
✅ Rename portfolio anytime (click name to edit)
✅ Save all portfolios at once
✅ Review status changes to "extracted"
✅ Console logging at each stage for debugging

## Getting Started

### Phase 1-2: Frontend Only (Mock Extraction)

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Phase 3: Frontend + Backend (Real Extraction)

You need **two terminal windows**:

**Terminal 1: Backend**
```bash
cd backend
npm install
# Add your Anthropic API key to backend/.env
# Then start:
npm run dev
```

Backend runs on `http://localhost:3001`

**Terminal 2: Frontend**
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

The frontend will automatically call the backend at `http://localhost:3001/api/extract` when you upload images.

## How to Test Phase 1 & 2

### Phase 1: Client & Review Management

1. **Create a Client**
   - Click "+ New Client" button
   - Enter: Name, Date of Birth, Email, and Mobile Number
   - Click "Create Client"
   - You should see the client appear in the list

2. **Expand Client & Create Review**
   - Click the "Expand" button on a client card
   - Click "+ New Review" inside the expanded client
   - Enter a review name
   - Click "Create Review"
   - You should see the review appear under the client

3. **Delete a Review**
   - Click "Delete" on a review
   - Confirm the deletion
   - The review should disappear

### Phase 2: Upload & Multiple Portfolios

4. **Start a Review (Upload)**
   - Click "Start Review" on any review
   - You should see the upload page

5. **Upload First Portfolio Screenshot**
   - Drag-drop any image file OR click to select
   - Wait for "Extracting..." (1 second)
   - A dialog appears asking "Name this portfolio?"
   - Enter a name (e.g., "HSBC")
   - Click "Add Portfolio"
   - You should see a table with 5 sample holdings appear under the portfolio name

6. **Upload Additional Portfolios (As Many As Needed)**
   - Click "+ Upload Another" button
   - Upload another image
   - Name it (e.g., "AIA")
   - Click "Add Portfolio"
   - You should now see two tables on the same page
   - Repeat as many times as needed (no limit)

7. **Edit Table Data**
   - Click any cell to edit (Fund Name, Units, Unit Price, Currency, FX Rate)
   - Change a value (e.g., Units = 2000)
   - Click elsewhere to save
   - Watch the Market Value and Weightage % recalculate automatically
   - Console shows `[CALC] recalculatePortfolio...`

8. **Rename or Delete Portfolio**
   - Click the portfolio name (e.g., "HSBC") to edit it
   - Or click the "Delete" button on the portfolio to remove it (keeps others)

9. **Verify Combined Summary**
   - Scroll to "Combined Portfolio Summary" at the bottom
   - Shows total across all portfolios in SGD
   - Shows count of portfolios

10. **Save All Portfolios**
    - Click "Save All Portfolios" button
    - You should return to the dashboard
    - Review status should now show "extracted"
    - Return to the review → all portfolios should still be there

9. **Delete a Client**
   - Click "Delete" on a client card
   - Confirm the deletion
   - The client and all its reviews should disappear

## Debugging Data Flow

**Open browser console (F12 or Cmd+Option+I) to see debug logs:**

### Phase 1 Logs
- `[ClientList]` - client list operations
- `[ClientCard]` - individual client operations
- `[ReviewCard]` - individual review operations
- `[NewClientForm]` - client creation
- `[NewReviewForm]` - review creation
- `[App]` - main app state changes
- `[STORAGE]` - localStorage read/write operations

### Phase 2 Logs
- `[UploadArea]` - file upload events
- `[EXTRACTION_MOCK]` - mock extraction returns holdings
- `[PortfolioTable]` - table rendering and cell edits
- `[CALC]` - calculation operations (recalculatePortfolio, totals, weightages)
- `[ReviewUploadView]` - upload view state changes
- `[App]` - saving holdings to review

### Common Log Sequences

**Uploading and Extracting:**
```
[UploadArea] File selected: screenshot.png
[ReviewUploadView] handleUpload called with file: screenshot.png
[EXTRACTION_MOCK] Starting mock extraction of: screenshot.png
[EXTRACTION_MOCK] Extracted holdings: [...]
[CALC] recalculatePortfolio with 5 holdings
[ReviewUploadView] Got extracted holdings: [...]
[PortfolioTable] Rendered with 5 holdings
```

**Editing a Cell:**
```
[PortfolioTable] Cell changed: {holdingId: "...", field: "units", newValue: "2000"}
[ReviewUploadView] handleHoldingChange: {holdingId: "...", field: "units", newValue: 2000}
[CALC] recalculatePortfolio with 5 holdings
[CALC] Recalculated portfolio, total SGD: 350000.00
[PortfolioTable] Rendered with 5 holdings
```

**Saving Holdings:**
```
[ReviewUploadView] Saving holdings, count: 5
[App] handleSaveHoldings: 5 holdings
[App] Review status updated to "extracted"
[App] Saving reviews to localStorage
[STORAGE] Saving reviews: [...]
```

## Project Structure

```
/app
  ├── layout.jsx                  # Next.js root layout
  ├── page.jsx                    # Main app component (all state logic)
  └── globals.css                 # Global styles

/components
  ├── ClientList.jsx              # List of all clients
  ├── ClientCard.jsx              # Individual client with reviews
  ├── ReviewList.jsx              # List of reviews for a client
  ├── ReviewCard.jsx              # Individual review item
  ├── NewClientForm.jsx           # Form to create new client
  ├── NewReviewForm.jsx           # Form to create new review
  ├── UploadArea.jsx              # File upload drag-drop interface
  ├── PortfolioTable.jsx          # Editable holdings table
  ├── PortfolioHoldingsSet.jsx    # Single portfolio with name + delete (Phase 2 Refinement)
  ├── MultipleHoldingsSets.jsx    # Container for multiple portfolios (Phase 2 Refinement)
  └── ReviewUploadView.jsx        # Upload + multiple portfolios view (Phase 2 Refined)

/lib
  ├── mockData.js                 # Initial mock data
  ├── storage.js                  # localStorage helper functions
  ├── extractionMock.js           # Mock OCR/extraction (returns sample holdings)
  └── portfolioCalculations.js    # Calculation utilities (market value, weightage, etc.)

/types
  └── index.js                    # Data structure documentation

README.md                          # This file
package.json                       # Dependencies
next.config.js                     # Next.js configuration
```

## Data Structures

### Client
```javascript
{
  id: "string",
  name: "John Doe",
  dob: "1985-03-15",
  email: "john@example.com",
  mobileNumber: "+65 9123 4567",
  createdAt: "2026-05-21T...",
  reviews: ["review-id-1", "review-id-2"]
}
```

### Review
```javascript
{
  id: "string",
  clientId: "client-id",
  reviewName: "Q2 2026 Review",
  createdAt: "2026-05-21T...",
  status: "not_started" | "extracted",
  holdingsSets: [/* HoldingsSet objects */]
}
```

### HoldingsSet (Phase 2 Refinement)
```javascript
{
  id: "string",
  name: "HSBC",                  // portfolio name
  holdings: [/* Holding objects */],
  totalPortfolioValueSgd: 150000.00  // calculated total for this portfolio
}
```

### Holding (Phase 2)
```javascript
{
  id: "string",
  fundName: "Vanguard Total US Stock",
  units: 500,
  unitPrice: 145.67,
  currency: "USD",
  fxRateToSgd: 1.34,
  marketValueOriginal: 72835.00,    // calculated
  marketValueSgd: 97557.90,          // calculated
  weightagePercent: 27.45            // calculated
}
```

## Phase 3 Features ✅

✅ Node.js + Express backend server
✅ Claude Vision API integration
✅ Real portfolio extraction from screenshots
✅ Automatic FX rate defaults for currencies
✅ Error handling for bad images/API failures
✅ Structured JSON response format
✅ File upload validation (images only, <10MB)
✅ CORS enabled for frontend communication
✅ Console logging for debugging
✅ Environment variable configuration

## How Phase 3 Works

1. **Frontend** - User uploads portfolio screenshot
2. **Frontend** - Calls backend `POST /api/extract`
3. **Backend** - Receives image, validates it
4. **Backend** - Calls Claude Vision API with image
5. **Claude** - Analyzes image, extracts holdings
6. **Backend** - Parses response, returns JSON
7. **Frontend** - Displays holdings in table
8. **User** - Edits, renames, saves portfolios

## Notes

- Data is stored in localStorage, so it persists between page reloads
- All debug logs go to the browser console
- No database or backend yet
- No authentication or password protection
