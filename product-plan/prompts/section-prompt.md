# Section-by-Section Implementation Prompt for Monopoluri

I have a complete product design package for **Monopoluri**, a private finance-tracking web app for a married couple. I want to implement it incrementally, one milestone at a time, so we can test and validate each piece before moving forward.

## Before You Start

I need you to ask me clarifying questions about:

1. **Authentication & User Model:**
   - Should we implement full authentication (login/signup) or just profile switching?
   - Where should user profiles be stored (database, localStorage, session)?
   - Do we need password protection or is it a truly private/local app?

2. **Tech Stack:**
   - **Backend:** What should we use? (Next.js API routes, Express, Rails, Laravel, Python/Flask, etc.)
   - **Database:** What database? (PostgreSQL, MySQL, MongoDB, SQLite, etc.)
   - **State Management:** Preference for React state management? (Context, Redux, Zustand, TanStack Query, etc.)
   - **Deployment Target:** Where will this be hosted? (Vercel, AWS, Heroku, self-hosted, etc.)

3. **AI Integration (for Insights section, Milestone 06):**
   - Should we integrate with an actual AI API (OpenAI, Anthropic, etc.)?
   - Or implement with mock/hardcoded responses initially?
   - Budget considerations for AI API usage?

4. **File Uploads (for receipts in Transactions section, Milestone 03):**
   - Where should receipt photos be stored? (S3, Cloudinary, local filesystem, etc.)
   - File size limits?

## What I'm Providing

This design package contains:

1. **Product Overview** (`product-overview.md`) — What we're building and why
2. **Incremental Implementation Instructions** (`instructions/incremental/`) — One file per milestone
3. **Design System** (`design-system/`) — Colors, typography, tokens
4. **Data Model** (`data-model/`) — TypeScript types and sample data
5. **Shell Components** (`shell/components/`) — Navigation and layout (React + Tailwind)
6. **Section Components** (`sections/*/components/`) — All feature components (React + Tailwind)
7. **Test Instructions** (`sections/*/tests.md`) — Framework-agnostic TDD specs for each section

## Implementation Approach

We'll build **one milestone at a time** in this order:

### Milestone 01: Foundation
Set up design tokens, data model types, and routing structure.
**Instructions:** `instructions/incremental/01-foundation.md`

### Milestone 02: Application Shell
Build the navigation, layout, and user profile system.
**Instructions:** `instructions/incremental/02-shell.md`

### Milestone 03: Transactions Section
Implement transaction tracking with filtering and recurring transactions.
**Instructions:** `instructions/incremental/03-transactions.md`

### Milestone 04: Goals Section
Build goal management with progress tracking and confetti animations.
**Instructions:** `instructions/incremental/04-goals.md`

### Milestone 05: Analytics Section
Create interactive charts for financial analytics.
**Instructions:** `instructions/incremental/05-analytics.md`

### Milestone 06: AI Insights Section
Implement insight feed and advisor chat interface.
**Instructions:** `instructions/incremental/06-ai-insights.md`

## Current Milestone

**Let's start with Milestone 01: Foundation**

After you ask your clarifying questions and I answer, please:

1. Read `product-overview.md` for context
2. Read `instructions/incremental/01-foundation.md` for detailed requirements
3. Set up the project structure
4. Implement Milestone 01 according to the specifications
5. Write tests (if applicable for this milestone)
6. Let me know when it's complete so we can test it

Then we'll move to Milestone 02, and so on.

## Key Requirements

- **Design Tokens:** Use the exact colors (slate primary, red secondary, stone neutral) and fonts (Manrope, IBM Plex Mono)
- **Responsive:** Mobile-first, works on all screen sizes
- **Dark Mode:** Full dark mode support
- **User Colors:** Dynamic theming based on active user (blue for Eden, amber for Sivan)
- **Props-Based Components:** All components accept data/callbacks via props
- **Production-Ready:** Not a prototype, this should be fully functional

## Available Files

All files are in the design package I'm providing. Key paths:
- `product-overview.md` — Product context
- `instructions/incremental/01-foundation.md` — Start here
- `design-system/` — Design tokens
- `data-model/types.ts` — TypeScript interfaces
- `data-model/sample-data.json` — Test data
- Reference components in `shell/` and `sections/` directories

## Let's Begin

Please ask me your clarifying questions about authentication, tech stack, AI integration, and file storage. Once I answer, we'll start with **Milestone 01: Foundation**.
