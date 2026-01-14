# Milestone 04: Goals Section

## Overview
Implement financial goal management with progress tracking and celebration animations.

## Components to Build

### 1. GoalsList Component
Main view displaying goals in a responsive grid:
- **Active Goals Section** (top)
- **Completed Goals Section** (bottom, green theme)
- Responsive: 1 column mobile, 2 columns tablet, 3 columns desktop

### 2. GoalCard Component
Horizontal card layout showing:
- **Icon & Title**
- **Progress Bar** (linear, fills based on saved/target percentage)
- **Amount Display:** "$X,XXX saved of $X,XXX"
- **Days Left Badge:** Shows remaining days if deadline is set, hidden if no deadline
- **Owner Indicator:** Avatar or color accent for Eden/Sivan/Shared
- **Quick Actions:**
  - "Add Funds" button (prominent)
  - Edit icon/button
  - Delete icon/button

**Styling:**
- Active goals: Default theme with owner colors
- Completed goals: Green theme (green-500, green-100 background)

### 3. AddFundsModal Component
Quick interaction to add money toward a goal:
- Amount input field
- Add button
- Cancel button
- Updates progress when saved
- Automatically completes goal if 100% reached

### 4. GoalFormModal Component
Create/Edit modal with fields:
- Name (text input)
- Target Amount (number input)
- Owner selector (Eden/Sivan/Shared)
- Icon selector (choose from preset icons)
- Color picker (choose from preset colors)
- **Optional** Deadline (date picker, can be left empty)

## Goal Completion Animation

When a goal reaches 100%:
1. Trigger **confetti animation** (use `canvas-confetti` library)
2. Show brief celebration message
3. Move card to "Completed" section
4. Apply green completion styling
5. Disable "Add Funds" button

**Implementation:**
```tsx
import confetti from 'canvas-confetti';

// When goal reaches 100%
confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
});
```

## Backend Integration

You'll need API endpoints for:
- `GET /api/goals` — Fetch all goals
- `POST /api/goals` — Create new goal
- `PUT /api/goals/:id` — Update goal
- `POST /api/goals/:id/add-funds` — Add money to goal
- `DELETE /api/goals/:id` — Delete goal

## Sample Data

See `../sections/goals/sample-data.json` for realistic test data including:
- Active goals (Emergency Fund, MacBook, Japan Trip, etc.)
- Completed goals (Wedding Anniversary, Gaming Monitor)
- Various owners and progress levels

## Reference Components

See `../sections/goals/components/` for fully implemented React components:
- `GoalsList.tsx`
- `GoalCard.tsx`
- `index.ts` (exports)

## Acceptance Criteria

- [ ] Goals display in responsive grid
- [ ] Active and Completed sections separated
- [ ] Progress bars show correct percentage
- [ ] "Days Left" badge shows if deadline set, hidden if no deadline
- [ ] Owner colors applied correctly
- [ ] Add Funds modal works
- [ ] Create new goal via modal
- [ ] Edit existing goal
- [ ] Delete goal with confirmation
- [ ] Goal completion triggers confetti
- [ ] Completed goals styled with green theme
- [ ] Mobile responsive (stacks to single column)
- [ ] Dark mode supported

## Testing

See `../sections/goals/tests.md` for complete TDD specifications including:
- User flow tests
- Empty state tests
- Goal completion behavior
- Edge cases (negative amounts, past deadlines, etc.)
