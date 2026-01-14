# Milestone 05: Analytics Section

## Overview
Implement a comprehensive financial analytics dashboard with interactive charts.

## Components to Build

### 1. AnalyticsDashboard Component
Main analytics view with vertical, report-style layout:
- Timeframe selector at top (This Month, Last 3 Months, Year to Date)
- Key metrics header
- Income vs. Expense trend chart
- Spending by category chart
- All charts update when timeframe changes

### 2. MetricCard Component
Display key financial metrics:
- **Net Worth:** Total assets
- **Monthly Savings Rate:** Percentage
- **Total Spend:** Current period amount
- **Comparison:** vs. previous period (show difference with up/down indicator)

### 3. TrendChart Component
Large line chart showing:
- **X-axis:** Time periods (months)
- **Y-axis:** Amount ($)
- **Two lines:**
  - Income (one color, e.g., green)
  - Expense (another color, e.g., red)
- **Interactive:** Hover tooltips showing exact values
- **Responsive:** Adapts to container width

### 4. CategoryChart Component
Large pie chart showing spending breakdown:
- **Segments:** One per category (Housing, Food, Transport, etc.)
- **Colors:** Distinct color for each category
- **Interactive:**
  - Hover tooltips showing category, amount, percentage
  - **Click to drill down:** Show transactions for that category
- **Responsive:** Adapts to container size

### 5. Drill-Down View
When user clicks a category slice:
- Show modal or side panel
- Display list of transactions in that category
- Include transaction name, amount, date
- Provide close button to return to main view

## Chart Implementation

Use **Recharts** library (already in your project):

```tsx
import { LineChart, Line, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Example trend chart
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={trendData}>
    <Line type="monotone" dataKey="income" stroke="#10b981" />
    <Line type="monotone" dataKey="expense" stroke="#ef4444" />
    <Tooltip />
    <Legend />
  </LineChart>
</ResponsiveContainer>
```

## Backend Integration

You'll need API endpoints for:
- `GET /api/analytics?timeframe=this-month` — Fetch analytics for timeframe
- Returns: metrics, trends, spending breakdown, transactions for drill-down

## Sample Data

See `../sections/analytics/sample-data.json` for realistic test data including:
- Metrics (net worth, savings rate, total spend)
- Trend data (income/expense over months)
- Spending breakdown by category
- Drill-down transaction list

## Reference Components

See `../sections/analytics/components/` for fully implemented React components:
- `AnalyticsDashboard.tsx`
- `MetricCard.tsx`
- `charts/TrendChart.tsx`
- `charts/CategoryChart.tsx`
- `index.ts` (exports)

## Dark Mode for Charts

Ensure charts work in dark mode:
- Use Tailwind dark mode colors
- Adjust text colors for readability
- Test contrast ratios
- Example: `text-stone-900 dark:text-stone-100`

## Acceptance Criteria

- [ ] Timeframe selector changes all data
- [ ] Key metrics display correctly
- [ ] Income vs. Expense line chart renders
- [ ] Spending pie chart renders
- [ ] Charts are interactive (hover tooltips)
- [ ] Clicking pie slice opens drill-down view
- [ ] Drill-down shows transactions for category
- [ ] Charts responsive on mobile
- [ ] Dark mode supported for all charts
- [ ] Empty state handled (no data available)

## Testing

See `../sections/analytics/tests.md` for complete TDD specifications including:
- User flow tests
- Chart interaction tests
- Drill-down behavior
- Timeframe switching
- Edge cases
