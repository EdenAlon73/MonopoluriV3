# Transactions Section — Test Instructions

This document provides framework-agnostic test specifications for implementing TDD (Test-Driven Development) for the Transactions section.

## Test Categories

### 1. User Flow Tests

#### Happy Path: Create One-Time Transaction
**Steps:**
1. User clicks "Add Transaction" button
2. Modal opens with empty form
3. User fills in:
   - Name: "Weekly Groceries"
   - Category: "Groceries"
   - Date: Today
   - Type: "Expense"
   - Frequency: "One-time"
   - Owner: "Shared"
4. User clicks "Save"
5. Modal closes
6. New transaction appears in table
7. Summary cards update with new totals

**Expected Results:**
- Transaction is created and saved
- Appears in transaction list
- Summary reflects new expense
- No errors displayed

#### Happy Path: Create Recurring Transaction
**Steps:**
1. User creates a transaction with frequency "Monthly"
2. Transaction is saved

**Expected Results:**
- Base transaction is created
- Future instances are generated (up to 12 months ahead)
- All instances appear in table under their respective months
- Each instance has recurring indicator

#### Edit Transaction
**Steps:**
1. User clicks on an existing transaction
2. Edit modal opens with pre-filled data
3. User changes amount from $100 to $150
4. User clicks "Save"

**Expected Results:**
- Transaction is updated
- New amount shows in table
- Summary totals recalculate
- Modal closes

#### Delete One-Time Transaction
**Steps:**
1. User clicks on a transaction
2. User clicks "Delete" button
3. Confirmation dialog appears
4. User confirms deletion

**Expected Results:**
- Transaction is removed from list
- Summary totals update
- Confirmation dialog closes

#### Delete Recurring Transaction
**Steps:**
1. User clicks on a recurring transaction
2. User clicks "Delete"
3. Confirmation dialog warns about deleting all future instances
4. User confirms

**Expected Results:**
- Base transaction is deleted
- All future instances are removed
- Summary updates
- No orphaned recurring instances remain

### 2. Filtering Tests

#### Filter by Owner
**Steps:**
1. Set owner filter to "Eden"

**Expected Results:**
- Only Eden's transactions display
- Shared transactions are hidden
- Summary shows totals for Eden only

#### Filter by Category
**Steps:**
1. Select "Groceries" category filter

**Expected Results:**
- Only transactions in Groceries category display
- Other categories hidden
- Summary reflects filtered totals

#### Search by Name
**Steps:**
1. Enter "coffee" in search field

**Expected Results:**
- Only transactions with "coffee" in name display
- Case-insensitive matching
- Summary shows filtered totals

#### Clear Filters
**Steps:**
1. Apply multiple filters
2. Click "Clear Filters" button

**Expected Results:**
- All filters reset
- All transactions display
- Summary shows grand totals

### 3. Empty State Tests

#### No Transactions Exist
**Condition:** Database has no transactions

**Expected UI:**
- Display empty state message: "No transactions yet"
- Show "Add Transaction" CTA button
- No table displayed
- Summary cards show $0.00 for all values

#### No Transactions Match Filter
**Condition:** Filters applied but no matches

**Expected UI:**
- Display "No transactions match your filters"
- Show "Clear Filters" button
- Keep filter controls visible
- Summary shows $0.00

### 4. Edge Cases

#### Upload Receipt Photo
**Steps:**
1. Create/edit transaction
2. Click "Upload Receipt"
3. Select image file
4. Save transaction

**Expected Results:**
- Receipt is uploaded and associated with transaction
- Transaction shows receipt indicator icon
- Clicking receipt icon shows photo

#### Invalid Form Inputs
**Test Cases:**
- Empty name field → Show validation error
- Amount of 0 or negative → Show validation error
- Date in far future (>100 years) → Show validation error
- No category selected → Show validation error

#### Owner Color Coding
**Test Cases:**
- Eden's transaction → Displays with blue accent
- Sivan's transaction → Displays with amber accent
- Shared transaction → Displays with neutral/stone accent

#### Recurring Transaction Edge Cases
**Test Cases:**
- Recurring transaction with end date in past → Don't generate future instances
- Edit one instance of recurring → Updates all future instances
- Delete with only 1 instance remaining → Works like one-time delete

### 5. Component Integration Tests

#### Summary Cards Update
**When:** Any transaction is created, edited, or deleted
**Verify:**
- Total Income recalculates correctly
- Total Expenses recalculate correctly
- Net Balance = Income - Expenses

#### Month Grouping
**Verify:**
- Transactions grouped by month (e.g., "January 2026")
- Most recent month first
- Expand/collapse functionality works
- Empty months not displayed

#### Responsive Design
**Test On:**
- Mobile (< 768px): Table converts to card layout, filters collapse
- Tablet (768px - 1023px): Table with horizontal scroll if needed
- Desktop (≥ 1024px): Full table visible

#### Dark Mode
**Verify:**
- All text readable in dark mode
- Color accents visible in dark mode
- Modal backgrounds appropriate
- No white flashes or harsh contrasts

## Implementation Notes

- Use your framework's testing tools (Jest, Vitest, RSpec, PHPUnit, Pytest, etc.)
- Test backend API endpoints separately
- Mock file uploads in unit tests
- Test database queries return expected data
- Verify component renders correctly with props
- Test callbacks are invoked with correct parameters

## Acceptance Criteria Checklist

- [ ] Can create one-time transaction
- [ ] Can create recurring transaction
- [ ] Can edit existing transaction
- [ ] Can delete transaction with confirmation
- [ ] Recurring deletion removes all instances
- [ ] Summary cards calculate correctly
- [ ] Filters work independently and combined
- [ ] Search is case-insensitive
- [ ] Empty states display appropriately
- [ ] Receipt upload works
- [ ] Form validation prevents invalid data
- [ ] Owner color coding displays correctly
- [ ] Month grouping works
- [ ] Responsive on all screen sizes
- [ ] Dark mode fully supported
