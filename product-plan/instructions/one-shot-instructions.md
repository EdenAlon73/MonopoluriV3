# Monopoluri — Complete Implementation Instructions

This document contains all implementation milestones for building Monopoluri from scratch.

---

## Milestone 01: Foundation

### Overview
Set up the core infrastructure including design tokens, data model types, and routing structure.

### Tasks

#### 1. Design System Setup
Install and configure Tailwind CSS with the Monopoluri design tokens:

**Colors:**
- Primary: `slate` (main brand color)
- Secondary: `red` (accent color)
- Neutral: `stone` (grays and backgrounds)

**Typography:**
- Heading: `Manrope` (Google Fonts)
- Body: `Manrope` (Google Fonts)
- Mono: `IBM Plex Mono` (Google Fonts)

**Implementation:**
- Add Google Fonts links to your HTML
- Configure Tailwind to use these fonts
- Ensure all components use the design tokens

#### 2. Data Model Types
Create TypeScript interfaces for all entities:

**Entities:**
- `User` — Represents Eden or Sivan with profile color identity
- `Transaction` — Income/expense entries with category, owner, frequency
- `Category` — Groups transactions into spending types
- `Goal` — Financial targets with progress tracking
- `Receipt` — Optional photo attachments for transactions
- `Report` — Aggregated analytics data
- `InsightCard` — AI-powered financial insights
- `ChatMessage` — Advisor chat messages

**See:** `data-model/types.ts` for complete type definitions

#### 3. Routing Structure
Set up routes for all main sections:
- `/` — Home/Dashboard (redirect to Transactions)
- `/transactions` — Transaction tracking
- `/goals` — Goal management
- `/analytics` — Financial analytics
- `/insights` — AI insights and chat

#### 4. Authentication Placeholder
Since this is a private app for a couple, authentication needs are minimal. Implement:
- Simple profile switching between Eden and Sivan
- Store active profile in app state (no backend auth required initially)
- Color theming based on active user

---

## Milestone 02: Application Shell

### Overview
Implement the persistent navigation and layout that wraps all sections.

### Tasks

#### 1. AppShell Component
Create the main layout component with:
- Fixed sidebar navigation (256px wide on desktop)
- Logo/app name at top
- Main navigation items in middle
- User menu at bottom
- Responsive behavior:
  - Desktop (≥1024px): Fixed sidebar always visible
  - Tablet (768px-1023px): Sidebar visible but narrower
  - Mobile (<768px): Hamburger menu with overlay

#### 2. MainNav Component
Navigation items linking to all sections:
- Transactions
- Goals
- Analytics
- AI Insights
- Highlight active section
- Use appropriate icons for each item

#### 3. UserMenu Component
Display at bottom of sidebar:
- Active user name (Eden or Sivan)
- Profile color indicator
- Profile switcher
- Logout button (optional, since it's a private app)

#### 4. Profile Color System
Implement dynamic color theming:
- Eden: Blue accents
- Sivan: Amber accents
- Apply active user's color throughout the session

**See:** `shell/components/` for complete implementation

---

## Milestone 03: Transactions Section

### Overview
Implement comprehensive transaction tracking with filtering, categorization, and recurring transactions.

### Tasks

#### 1. Transaction List View
Create the main transaction tracking interface:
- Summary cards showing total income, expenses, and net balance
- Filterable transaction table with columns:
  - Date
  - Name
  - Category
  - Amount
  - Type (Income/Expense)
  - Owner (Eden/Sivan/Shared)
- Table grouped by month with expand/collapse
- Visual indicator for transactions with receipt photos
- Color-coded by owner (blue for Eden, amber for Sivan, neutral for Shared)

#### 2. Transaction Modal
Form for adding/editing transactions:
- Name field
- Category selector (dropdown)
- Date picker (default: today)
- Type selector (Income/Expense)
- Frequency selector:
  - One-time
  - Daily
  - Weekly
  - Bi-weekly
  - Monthly
- Owner selector (Eden/Sivan/Shared)
- Optional photo upload for receipt
- Save and Cancel buttons

#### 3. Transaction CRUD Operations
- **Create:** Add new transaction via modal
- **Read:** Display in filterable table
- **Update:** Edit via modal
- **Delete:** Remove with confirmation dialog
  - For recurring transactions: confirmation to delete all future instances

#### 4. Filtering & Search
Implement filters for:
- Date range
- Transaction name (search)
- Category
- Owner (Eden/Sivan/Shared/All)
- Type (Income/Expense/All)

#### 5. Recurring Transactions
Logic for generating future transaction entries:
- When creating a recurring transaction, auto-generate future instances
- Display recurring indicator in table
- Editing one instance affects all future instances
- Deleting removes all future instances with confirmation

**See:** `sections/transactions/` for components and sample data

**Testing:** See `sections/transactions/tests.md` for TDD specifications

---

## Milestone 04: Goals Section

### Overview
Implement financial goal management with progress tracking and celebration animations.

### Tasks

#### 1. Goals List View
Display goals as a responsive grid:
- **Active Goals:** Top section
- **Completed Goals:** Bottom section (green theme)
- Each goal card shows:
  - Title & Icon
  - Progress bar (linear, percentage-based)
  - Amount Saved / Target Amount
  - "Days Left" badge (if deadline set)
  - Owner indicator (Eden/Sivan/Shared)

#### 2. Goal Card Component
Horizontal card layout with:
- Icon and color customization
- Progress visualization
- Quick "Add Funds" button
- Edit/Delete actions

#### 3. Add Funds Modal
Quick interaction to add money toward a goal:
- Amount input field
- Add button
- Update progress and save

#### 4. Create/Edit Goal Form
Modal form with fields:
- Name
- Target Amount
- Owner (Eden/Sivan/Shared)
- Icon selector
- Color picker
- **Optional** Deadline (date picker)

#### 5. Goal Completion
When a goal reaches 100%:
- Trigger confetti animation (use canvas-confetti library)
- Move card to "Completed" section
- Apply green completion theme
- Show celebration message

**See:** `sections/goals/` for components and sample data

**Testing:** See `sections/goals/tests.md` for TDD specifications

---

## Milestone 05: Analytics Section

### Overview
Implement a comprehensive financial analytics dashboard with interactive charts.

### Tasks

#### 1. Key Metrics Header
Display prominent metrics:
- Net Worth (total assets minus liabilities)
- Monthly Savings Rate (percentage)
- Total Spend (current period)
- Comparison vs. previous period

#### 2. Income vs. Expense Trend Chart
Large line chart showing:
- Income line (one color)
- Expense line (different color)
- X-axis: Time period (months)
- Y-axis: Amount
- Interactive tooltips on hover

#### 3. Spending by Category Chart
Large pie chart breaking down expenses:
- Each slice represents a category
- Color-coded segments
- Interactive tooltips showing amount and percentage
- Click to drill down (see transactions for that category)

#### 4. Timeframe Selector
Switch context for entire report:
- This Month
- Last 3 Months
- Year to Date
- Update all charts and metrics when changed

#### 5. Drill-Down Functionality
When clicking a category in the pie chart:
- Display modal or panel
- Show list of transactions in that category
- Provide way to close and return to overview

**Chart Library:** Use Recharts (already installed) for interactive charts

**See:** `sections/analytics/` for components and sample data

**Testing:** See `sections/analytics/tests.md` for TDD specifications

---

## Milestone 06: AI Insights Section

### Overview
Implement an intelligence hub combining proactive insights with an interactive financial advisor chat.

### Tasks

#### 1. Insights Feed (Top Section)
Scrollable list of insight cards:
- **Card Types:**
  - Anomaly (unusual spending detected)
  - Forecast (projections and predictions)
  - Suggestion (optimization recommendations)
- **Card Content:**
  - Distinct icon for each type
  - Title
  - Message (concise text)
  - Date/timestamp
  - Visual trend indicator (positive/negative/neutral)
- Read-only (no action buttons)
- Professional, data-driven tone

#### 2. Advisor Chat (Bottom Section)
Interactive chat interface:
- Standard chat bubbles (user vs AI)
- Message input field
- Send button
- Chat history display
- Support for formatted responses (bold text, lists, etc.)

#### 3. Chat Functionality
- Accept user questions about finances
- Display AI responses (can be mock/placeholder initially)
- Maintain chat history
- Professional financial advisor persona
- Auto-scroll to latest message

#### 4. Tone & Styling
- **Persona:** Formal Financial Advisor
- **Voice:** Professional, data-driven, objective
- **Visuals:** Premium, trustworthy design
- **Typography:** Consider serif fonts for AI voice to distinguish from UI

**See:** `sections/ai-insights/` for components and sample data

**Testing:** See `sections/ai-insights/tests.md` for TDD specifications

---

## Implementation Notes

### Empty States
Every section should handle empty states gracefully:
- No transactions yet
- No goals created
- No analytics data available
- No chat history

Provide clear CTAs to add first item.

### Loading States
Implement loading indicators for:
- Initial data fetch
- Form submissions
- Chart rendering
- AI response generation

### Error Handling
Handle errors gracefully:
- Failed API calls
- Invalid form inputs
- Missing data
- Network issues

### Responsive Design
All components must be mobile-responsive:
- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)
- Test on mobile, tablet, and desktop screen sizes
- Optimize charts for small screens

### Dark Mode
Implement dark mode support using Tailwind's `dark:` variant:
- All text must be readable in both modes
- Charts must adapt colors for dark backgrounds
- Test contrast ratios

### Accessibility
Ensure components are accessible:
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Focus states
- Screen reader support
