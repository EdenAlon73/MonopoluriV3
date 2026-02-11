# AI CSV Import Guide (MonopoluriV3)

This guide describes the CSV format accepted by the Settings -> Import CSV flow.

Use this when asking an AI model to convert bank statements into an import-ready CSV.

## Required Columns

CSV must include these columns (order does not matter):

- `Date`
- `Name` (or `Description`)
- `Category` (also accepts `Catagory` / `Catgory`)
- `Owner`
- `Amount` (or `Value`)

Recommended header row:

```csv
Date,Name,Category,Owner,Amount
```

## Recommended Formatting (Best for AI output)

- Date: `YYYY-MM-DD` (example: `2026-01-22`)
- Amount: include explicit sign
  - Income: `+1234.56`
  - Expense: `-89.10`
- Owner: one of `Shared`, `Eden`, `Sivan`
- Category: use category names from the list below

## Category List

### Income categories

- Salary
- Freelance
- Gift
- Refunds
- Other

### Expense categories

- Housing
- Dining Out
- Groceries
- Insurance
- Subscriptions
- Transport
- Travel
- Shopping
- Utilities
- Entertainment
- Health
- Personal Care
- Misc

## How Amount Signs Work

The importer infers transaction type mainly from `Amount` sign:

- `-` means expense
- `+` means income

If sign is missing:

1. importer tries to infer type from `Category`
2. if still unclear, defaults to expense

Supported amount inputs include currencies/symbols and common formats:

- `-120.50`
- `+2,450.00`
- `€-45.20`
- `(89.90)` (treated as negative/expense)

## Date Parsing

Accepted date formats:

- `YYYY-MM-DD` (recommended)
- `MM/DD/YYYY`
- other JS-parseable date strings

Invalid dates are skipped.

## Duplicate Handling

If `Skip existing entries (same date and amount)` is enabled in the UI (default on), rows are skipped when an existing transaction already has the same:

- `Date`
- `Amount` (normalized to cents)

Owner and category are ignored for duplicate matching.

## Minimal Example CSV

```csv
Date,Name,Category,Owner,Amount
2026-01-03,Monthly salary,Salary,Eden,+12500.00
2026-01-04,Rami Levi Groceries,Groceries,Shared,-642.18
2026-01-06,Spotify Family,Subscriptions,Shared,-29.90
2026-01-08,Gas Station Paz,Transport,Eden,-280.00
2026-01-09,Flight to Rome,Travel,Shared,-1580.00
2026-01-10,Tax refund Jan,Refunds,Eden,+430.50
```

## AI Prompt Template (Copy/Paste)

```text
Convert the bank statement data I provide into a CSV for MonopoluriV3 import.

Output only raw CSV (no markdown fences, no explanation), with this exact header:
Date,Name,Category,Owner,Amount

Rules:
1) Date format must be YYYY-MM-DD.
2) Amount must include sign: negative for expenses, positive for income.
3) Choose Category from this exact list only:
   Income: Salary, Freelance, Gift, Refunds, Other
   Expense: Housing, Dining Out, Groceries, Insurance, Subscriptions, Transport, Travel, Shopping, Utilities, Entertainment, Health, Personal Care, Misc
4) Owner must be one of: Shared, Eden, Sivan.
5) Use concise merchant/transaction text in Name.
6) If uncertain category, use Misc for expenses or Other for income.
7) Keep one transaction per row.

Categorize primarily by transaction/merchant name.
```

## Notes

- Columns are matched case-insensitively.
- Fields containing commas should be quoted with `"..."`.
- Rows with missing required fields are skipped.
