# Milestone 01: Foundation

## Overview
Set up the core infrastructure including design tokens, data model types, and routing structure.

## Design System Setup

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
1. Add Google Fonts links to your HTML:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

2. Configure Tailwind to use these fonts in your CSS or config
3. Ensure dark mode is enabled

## Data Model Types

Create TypeScript interfaces for all entities. See `../data-model/types.ts` for complete definitions.

**Core Entities:**
- `User` — Represents Eden or Sivan with profile color identity
- `Transaction` — Income/expense entries with category, owner, frequency
- `Category` — Groups transactions into spending types
- `Goal` — Financial targets with progress tracking
- `Receipt` — Optional photo attachments for transactions
- `Report` — Aggregated analytics data
- `InsightCard` — AI-powered financial insights
- `ChatMessage` — Advisor chat messages

## Routing Structure

Set up routes for all main sections:
- `/` — Home (redirect to `/transactions`)
- `/transactions` — Transaction tracking
- `/goals` — Goal management
- `/analytics` — Financial analytics
- `/insights` — AI insights and chat

## Authentication & User Profile

Since this is a private app for a couple, authentication needs are minimal:

1. **Profile Switching:** Allow switching between Eden and Sivan profiles
2. **App State:** Store active profile in app state (Context/Redux/Zustand)
3. **Color Theming:** Apply user's color (blue for Eden, amber for Sivan) throughout the session
4. **No Backend Auth Required Initially:** Can add later if needed

## Acceptance Criteria

- [ ] Tailwind CSS configured with Manrope and IBM Plex Mono fonts
- [ ] All data model TypeScript types created
- [ ] Routing structure set up for all sections
- [ ] Profile switching mechanism implemented
- [ ] Dark mode enabled and tested
- [ ] Can navigate between all route placeholders
