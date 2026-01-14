# Goals Section — Test Instructions

This document provides framework-agnostic test specifications for implementing TDD for the Goals section.

## Test Categories

### 1. User Flow Tests

#### Happy Path: Create New Goal
**Steps:**
1. User clicks "Create Goal" button
2. Modal opens with empty form
3. User fills in:
   - Title: "Emergency Fund"
   - Target Amount: $20,000
   - Owner: "Shared"
   - Icon: "shield"
   - Color: "stone"
   - Deadline: "2026-12-31" (optional)
4. User clicks "Save"

**Expected Results:**
- Goal is created with $0 saved
- Goal appears in "Active Goals" section
- Progress bar shows 0%
- "Days Left" badge displays if deadline set

#### Happy Path: Add Funds to Goal
**Steps:**
1. User clicks "Add Funds" button on a goal card
2. Modal opens with amount input
3. User enters $500
4. User clicks "Add"

**Expected Results:**
- Goal's saved amount increases by $500
- Progress bar updates to show new percentage
- Modal closes
- No confetti (goal not complete)

#### Happy Path: Complete a Goal
**Steps:**
1. Goal has $900 saved of $1000 target
2. User adds $100 funds
3. Goal reaches 100%

**Expected Results:**
- **Confetti animation triggers**
- Goal moves to "Completed Goals" section
- Goal styled with green completion theme
- "Add Funds" button disabled
- Celebration message displays briefly

#### Edit Existing Goal
**Steps:**
1. User clicks edit icon on goal card
2. Edit modal opens with pre-filled data
3. User changes target amount from $1000 to $1500
4. User clicks "Save"

**Expected Results:**
- Goal target amount updates
- Progress percentage recalculates
- Changes reflected immediately

#### Delete Goal
**Steps:**
1. User clicks delete icon on goal card
2. Confirmation dialog appears
3. User confirms deletion

**Expected Results:**
- Goal is removed from list
- No orphaned data remains
- Confirmation closes

### 2. Progress Calculation Tests

#### Calculate Progress Percentage
**Test Cases:**
- $0 saved of $1000 → 0%
- $500 saved of $1000 → 50%
- $1000 saved of $1000 → 100%
- $1200 saved of $1000 → 100% (capped, overfunding allowed)

#### Days Left Calculation
**Test Cases:**
- Deadline: Tomorrow → "1 day left"
- Deadline: 30 days away → "30 days left"
- Deadline: Today → "0 days left" or "Due today"
- Deadline: Past → "Overdue" or "Past due"
- No deadline → Badge hidden

### 3. Empty State Tests

#### No Goals Exist
**Condition:** User has not created any goals

**Expected UI:**
- Display empty state: "No goals yet"
- Show "Create Goal" CTA button
- No goal cards displayed
- Both Active and Completed sections empty

#### Only Completed Goals
**Condition:** User has completed goals but no active ones

**Expected UI:**
- Active section shows: "No active goals"
- Completed section shows completed goal cards
- "Create Goal" button visible

#### Only Active Goals
**Condition:** User has active goals but no completed ones

**Expected UI:**
- Active section shows goal cards
- Completed section shows: "No completed goals yet"

### 4. Edge Cases

#### Overfunding a Goal
**Steps:**
1. Goal has $900 saved of $1000 target
2. User adds $200 (would exceed target)

**Expected Results:**
- Saved amount becomes $1100
- Progress bar shows 100% (capped)
- Goal completes normally
- Confetti triggers

#### Negative Amount Input
**Steps:**
1. User tries to add -$100

**Expected Results:**
- Validation error displays
- Amount not added
- Form doesn't submit

#### Goal with No Deadline
**Test:**
- Goal created without deadline
- "Days Left" badge is hidden
- Goal functions normally otherwise

#### Editing Completed Goal
**Steps:**
1. User tries to edit a completed goal

**Expected Results:**
- Can edit title, icon, color
- Cannot reduce saved amount below target
- Stays in Completed section

#### Deleting Completed Goal
**Steps:**
1. User deletes a completed goal

**Expected Results:**
- Works same as deleting active goal
- No confetti on delete
- Removed from Completed section

### 5. Visual & Animation Tests

#### Confetti Animation
**When:** Goal reaches 100%

**Expected Results:**
- Confetti animation plays (using canvas-confetti)
- Animation completes fully
- Doesn't block user interaction
- Works on mobile and desktop

#### Owner Color Indicators
**Test Cases:**
- Eden goal → Blue avatar/accent
- Sivan goal → Amber avatar/accent
- Shared goal → Neutral/stone avatar/accent

#### Progress Bar Styling
**Test Cases:**
- 0-30% → One color (e.g., red/amber)
- 31-70% → Another color (e.g., amber/yellow)
- 71-100% → Success color (e.g., green)

Or use consistent brand color (slate/blue) throughout.

### 6. Component Integration Tests

#### Goals Grouped by Status
**Verify:**
- Active and Completed sections separated
- Active goals at top, Completed at bottom
- Each section has its own heading

#### Responsive Grid Layout
**Test On:**
- Mobile (< 768px): 1 column
- Tablet (768px - 1023px): 2 columns
- Desktop (≥ 1024px): 3 columns

#### Dark Mode
**Verify:**
- All text readable in dark mode
- Progress bars visible
- Completed goals green theme works in dark mode
- Owner color accents visible

#### Add Funds Modal
**Verify:**
- Opens on button click
- Amount input has focus
- Enter key submits form
- Escape key closes modal
- Click outside closes modal

## Implementation Notes

- Use your framework's testing tools
- Mock confetti library in unit tests
- Test date calculations with various timezones
- Verify percentage calculations are precise
- Test backend API endpoints separately
- Mock current date for "days left" tests

## Acceptance Criteria Checklist

- [ ] Can create new goal
- [ ] Can add funds to goal
- [ ] Goal completion triggers confetti
- [ ] Completed goals move to Completed section
- [ ] Completed goals styled with green theme
- [ ] Can edit existing goal
- [ ] Can delete goal with confirmation
- [ ] Progress bar calculates correctly
- [ ] "Days Left" badge shows/hides correctly
- [ ] Days left calculation accurate
- [ ] Owner colors applied correctly
- [ ] Empty states display appropriately
- [ ] Form validation works
- [ ] Responsive grid layout
- [ ] Dark mode fully supported
- [ ] Confetti animation works
