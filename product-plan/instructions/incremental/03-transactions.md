# Milestone 03: Transactions Section

## Overview
Implement comprehensive transaction tracking with filtering, categorization, and recurring transactions.

## Components to Build

### 1. TransactionsList Component
Main view displaying:
- **Summary Cards:** Total Income, Total Expenses, Net Balance
- **Transaction Table:** Filterable list with columns:
  - Date
  - Name
  - Category
  - Amount
  - Type (Income/Expense)
  - Owner (Eden/Sivan/Shared)
- **Grouping:** Organize by month with expand/collapse
- **Visual Indicators:**
  - Receipt icon if transaction has photo
  - Color-coded by owner (blue=Eden, amber=Sivan, neutral=Shared)

### 2. TransactionCard Component
Individual transaction row in table:
- Display all transaction details
- Click to open edit modal
- Visual styling based on owner and type

### 3. TransactionModal Component
Form for creating/editing transactions:
- **Fields:**
  - Name (text input)
  - Category (dropdown/select)
  - Date (date picker, default: today)
  - Type (Income/Expense selector)
  - Frequency (One-time, Daily, Weekly, Bi-weekly, Monthly)
  - Owner (Eden/Sivan/Shared selector)
  - Optional photo upload (for receipt)
- **Buttons:** Save, Cancel
- **Delete button** (in edit mode only)

### 4. Filtering & Search
Implement filters for:
- Date range picker
- Transaction name search
- Category filter
- Owner filter (Eden/Sivan/Shared/All)
- Type filter (Income/Expense/All)

## Backend Integration

You'll need API endpoints for:
- `GET /api/transactions` — Fetch all transactions (with optional filters)
- `POST /api/transactions` — Create new transaction
- `PUT /api/transactions/:id` — Update transaction
- `DELETE /api/transactions/:id` — Delete transaction
- `GET /api/categories` — Fetch all categories

## Recurring Transactions Logic

When creating a recurring transaction:
1. Store the base transaction with frequency
2. Generate future instances (up to 1 year ahead)
3. Each instance links back to the base transaction
4. Editing the base updates all future instances
5. Deleting the base removes all future instances (with confirmation)

## Sample Data

See `../sections/transactions/sample-data.json` for realistic test data including:
- Users (Eden and Sivan)
- Categories (Salary, Groceries, Rent, etc.)
- Sample transactions (income and expenses)

## Reference Components

See `../sections/transactions/components/` for fully implemented React components:
- `TransactionsList.tsx`
- `TransactionCard.tsx`
- `TransactionModal.tsx`
- `index.ts` (exports)

## Acceptance Criteria

- [ ] Summary cards show correct totals
- [ ] Transaction table displays all transactions
- [ ] Transactions grouped by month
- [ ] Can expand/collapse monthly groups
- [ ] Color-coded by owner (blue, amber, neutral)
- [ ] Add new transaction via modal
- [ ] Edit existing transaction
- [ ] Delete transaction with confirmation
- [ ] All filters work correctly
- [ ] Recurring transactions generate future instances
- [ ] Photo upload works (can be placeholder initially)
- [ ] Mobile responsive
- [ ] Dark mode supported

## Testing

See `../sections/transactions/tests.md` for complete TDD specifications including:
- User flow tests
- Empty state tests
- Edge cases
- Recurring transaction behavior
