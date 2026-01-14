# Milestone 02: Application Shell

## Overview
Implement the persistent navigation and layout that wraps all sections.

## Components to Build

### 1. AppShell Component
Main layout wrapper with:
- Fixed sidebar navigation (256px wide on desktop)
- Logo/app name at top ("Monopoluri")
- Main navigation in middle
- User menu at bottom
- Main content area to the right

**Responsive Behavior:**
- **Desktop (≥1024px):** Fixed sidebar always visible, full width
- **Tablet (768px-1023px):** Sidebar visible but narrower
- **Mobile (<768px):** Hamburger menu, slides in from left, overlay covers content

### 2. MainNav Component
Navigation items for all sections:
- Transactions (icon: receipt/list)
- Goals (icon: target/flag)
- Analytics (icon: chart/graph)
- AI Insights (icon: sparkles/brain)

**Behavior:**
- Highlight active section
- Click to navigate
- Show icons + labels on desktop
- Icons only on narrower screens (optional)

### 3. UserMenu Component
Display at bottom of sidebar:
- Active user name (Eden or Sivan)
- Profile color indicator (visual accent in user's color)
- Profile switcher dropdown or button
- Optional logout button

## Profile Color System

Implement dynamic theming based on active user:
- **Eden:** Blue accents (slate-600, blue-500, etc.)
- **Sivan:** Amber accents (amber-500, amber-600, etc.)

Apply active user's color to:
- Navigation active state
- User menu indicator
- Primary buttons
- Progress bars
- Any accent elements

**Implementation Approach:**
- Use CSS custom properties or Tailwind's dynamic classes
- Update theme when user switches profiles
- Persist active profile in localStorage (optional)

## Reference Components

See `../shell/components/` for fully implemented React components:
- `AppShell.tsx`
- `MainNav.tsx`
- `UserMenu.tsx`
- `index.ts` (exports)

## Acceptance Criteria

- [ ] AppShell renders with sidebar and content area
- [ ] Navigation highlights active section
- [ ] User menu displays active user
- [ ] Profile switching works and updates theme color
- [ ] Responsive: sidebar collapses to hamburger menu on mobile
- [ ] Mobile menu opens/closes with overlay
- [ ] Dark mode works correctly
- [ ] All navigation links work (even if sections are empty)
