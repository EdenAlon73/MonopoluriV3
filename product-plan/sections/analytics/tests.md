# Analytics Section — Test Instructions

This document provides framework-agnostic test specifications for implementing TDD for the Analytics section.

## Test Categories

### 1. User Flow Tests

#### Happy Path: View Analytics Report
**Steps:**
1. User navigates to Analytics page
2. Default timeframe is "This Month"

**Expected Results:**
- Key metrics display (Net Worth, Savings Rate, Total Spend)
- Income vs. Expense trend chart renders
- Spending by category pie chart renders
- All data corresponds to current month

#### Change Timeframe
**Steps:**
1. User clicks timeframe selector
2. User selects "Last 3 Months"

**Expected Results:**
- All charts and metrics update
- Data now reflects last 3 months
- Charts animate transition
- No flash of incorrect data

#### Drill Down into Category
**Steps:**
1. User clicks on "Food" slice in pie chart
2. Drill-down view opens

**Expected Results:**
- Modal/panel displays
- Shows list of all transactions in "Food" category
- Each transaction shows name, amount, date
- Can close drill-down to return to main view

#### Close Drill-Down
**Steps:**
1. Drill-down is open
2. User clicks "Close" or clicks outside

**Expected Results:**
- Drill-down closes
- Returns to main analytics view
- Pie chart still interactive

### 2. Metrics Calculation Tests

#### Net Worth Calculation
**Test Cases:**
- Assets: $50,000, Liabilities: $0 → Net Worth = $50,000
- Assets: $100,000, Liabilities: $30,000 → Net Worth = $70,000
- Negative net worth displays correctly

#### Savings Rate Calculation
**Formula:** (Income - Expenses) / Income × 100

**Test Cases:**
- Income: $5000, Expenses: $4000 → 20%
- Income: $5000, Expenses: $5000 → 0%
- Income: $5000, Expenses: $6000 → Negative rate (display as 0% or show deficit)
- Income: $0 → Handle division by zero

#### Spend Comparison
**Test Cases:**
- This month: $4000, Last month: $4200 → Difference: -$200 (down arrow, green)
- This month: $4500, Last month: $4000 → Difference: +$500 (up arrow, red/amber)
- No previous period → Show "N/A" or hide comparison

### 3. Chart Rendering Tests

#### Income vs. Expense Trend Chart
**Verify:**
- X-axis shows time periods (months) correctly
- Y-axis shows amounts in currency format ($)
- Income line renders (e.g., green)
- Expense line renders (e.g., red)
- Lines don't overlap incorrectly
- Tooltips show exact values on hover

#### Spending by Category Pie Chart
**Verify:**
- Each category is a distinct slice
- Slice size proportional to spending
- Colors are distinct and accessible
- Labels display category names
- Tooltips show amount and percentage
- Chart totals to 100%

#### Interactive Tooltips
**Test:**
- Hover over line chart point → Shows date, income, expense
- Hover over pie slice → Shows category, amount, percentage
- Tooltips position correctly (don't overflow viewport)

### 4. Empty State Tests

#### No Data for Timeframe
**Condition:** Selected timeframe has no transactions

**Expected UI:**
- Display "No data available for this period"
- Show empty state message or illustration
- Charts don't render (or show empty state)
- Metrics show $0 or N/A

#### No Transactions Ever
**Condition:** User has never created a transaction

**Expected UI:**
- Empty state: "No financial data yet"
- CTA: "Track your first transaction"
- No charts displayed

### 5. Edge Cases

#### Very Large Numbers
**Test Cases:**
- Net Worth: $10,000,000+ → Formats correctly (e.g., "$10.5M")
- Spending: $100,000+ → Readable format

#### Very Small Numbers
**Test Cases:**
- Expense: $0.01 → Shows cents correctly
- Savings Rate: 0.5% → Shows decimal

#### Single Category
**Condition:** All expenses in one category

**Expected Results:**
- Pie chart shows one full circle
- Still interactive
- Tooltip shows 100%

#### Zero Spending in Timeframe
**Condition:** No expenses in selected period

**Expected Results:**
- Total Spend: $0
- Pie chart empty state or not displayed
- Metrics still show income

#### Timeframe with Missing Months
**Condition:** "Last 3 Months" but only 2 have data

**Expected Results:**
- Chart shows data for available months
- Missing months show $0 or are omitted
- No errors displayed

### 6. Responsive & Visual Tests

#### Responsive Charts
**Test On:**
- Mobile (< 768px): Charts stack vertically, full width
- Tablet (768px - 1023px): Charts may stack or side-by-side depending on design
- Desktop (≥ 1024px): Charts display in optimal layout

**Verify:**
- Charts resize smoothly
- Tooltips don't overflow screen edges
- Legends remain readable

#### Dark Mode
**Verify:**
- Chart backgrounds adapt (transparent or dark)
- Chart lines/slices have sufficient contrast
- Text labels readable
- Tooltips styled for dark mode
- Grid lines subtle but visible

#### Chart Interactivity on Touch Devices
**Verify:**
- Tap on pie slice opens drill-down (not just hover)
- Touch tooltips display correctly
- Pinch-to-zoom doesn't break charts (optional feature)

### 7. Integration Tests

#### Timeframe Selector Updates All Elements
**Verify:**
- Metrics recalculate
- Trend chart updates
- Pie chart updates
- All updates happen simultaneously (no staggered rendering)

#### Drill-Down Shows Correct Transactions
**Steps:**
1. Click "Food" category slice
2. Verify transactions shown are only "Food" category
3. Verify transactions match selected timeframe
4. Verify amounts sum to category total

## Implementation Notes

- Use Recharts library for chart rendering
- Mock chart data in unit tests
- Test chart components independently
- Verify API returns correct aggregated data
- Test date range calculations
- Handle timezone issues in date comparisons
- Optimize chart performance for large datasets

## Acceptance Criteria Checklist

- [ ] Key metrics display correctly
- [ ] Metrics calculations are accurate
- [ ] Trend chart renders income and expense lines
- [ ] Pie chart renders spending categories
- [ ] Timeframe selector changes all data
- [ ] Drill-down opens on category click
- [ ] Drill-down shows correct transactions
- [ ] Can close drill-down
- [ ] Tooltips work on hover (desktop) and tap (mobile)
- [ ] Charts are responsive
- [ ] Empty states display appropriately
- [ ] Dark mode works for all charts
- [ ] Very large and small numbers format correctly
- [ ] No errors with edge cases (zero spend, single category, etc.)
