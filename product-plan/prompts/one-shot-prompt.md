# One-Shot Implementation Prompt for Monopoluri

I have a complete product design package for **Monopoluri**, a private finance-tracking web app for a married couple. I need you to implement it following the specifications, components, and instructions provided.

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

3. **AI Integration (for Insights section):**
   - Should we integrate with an actual AI API (OpenAI, Anthropic, etc.)?
   - Or implement with mock/hardcoded responses initially?
   - Budget considerations for AI API usage?

4. **File Uploads (for receipts):**
   - Where should receipt photos be stored? (S3, Cloudinary, local filesystem, etc.)
   - File size limits?

## What I'm Providing

This design package contains:

1. **Product Overview** (`product-overview.md`) — What we're building and why
2. **Complete Implementation Instructions** (`instructions/one-shot-instructions.md`) — All 6 milestones combined
3. **Design System** (`design-system/`) — Colors, typography, tokens
4. **Data Model** (`data-model/`) — TypeScript types and sample data
5. **Shell Components** (`shell/components/`) — Navigation and layout (React + Tailwind)
6. **Section Components** (`sections/*/components/`) — All feature components (React + Tailwind)
7. **Test Instructions** (`sections/*/tests.md`) — Framework-agnostic TDD specs for each section

## Your Task

After you've asked your clarifying questions and I've provided answers:

1. **Set up the project** following the tech stack we agree on
2. **Implement all 6 milestones:**
   - Milestone 01: Foundation (design tokens, data model, routing)
   - Milestone 02: Application Shell (navigation, layout)
   - Milestone 03: Transactions Section
   - Milestone 04: Goals Section
   - Milestone 05: Analytics Section
   - Milestone 06: AI Insights Section
3. **Integrate the provided React components** (or rewrite if using a different frontend framework)
4. **Build the backend** (API endpoints, database schema, authentication)
5. **Write tests** following the provided test instructions
6. **Ensure everything works** (mobile responsive, dark mode, all features functional)

## Key Requirements

- **Design Tokens:** Use the exact colors (slate primary, red secondary, stone neutral) and fonts (Manrope, IBM Plex Mono)
- **Responsive:** Mobile-first, works on all screen sizes
- **Dark Mode:** Full dark mode support
- **User Colors:** Dynamic theming based on active user (blue for Eden, amber for Sivan)
- **Props-Based Components:** All components accept data/callbacks via props
- **Production-Ready:** Not a prototype, this should be fully functional

## Available Files

All files are in the design package I'm providing. Key paths:
- `product-overview.md` — Start here for context
- `instructions/one-shot-instructions.md` — Your implementation roadmap
- `design-system/` — Design tokens
- `data-model/types.ts` — TypeScript interfaces
- `data-model/sample-data.json` — Test data
- `shell/components/` — Shell React components
- `sections/transactions/components/` — Transaction components
- `sections/goals/components/` — Goal components
- `sections/analytics/components/` — Analytics components
- `sections/ai-insights/components/` — AI Insights components
- `sections/*/tests.md` — Test specifications

## Let's Begin

Please ask me your clarifying questions about authentication, tech stack, AI integration, and file storage. Once I answer, you can begin implementation.
