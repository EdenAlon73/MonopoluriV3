# Monopoluri V3 — Project Context Guide

Use this file to bootstrap new AI sessions with the essential context for how the app is structured, how data flows, and the norms to follow.

## What the app is
- Next.js 16 (App Router, `output: 'export'`) front‑end for personal finance (Eden & Sivan).
- Firebase is the backend: Google Auth for login, Firestore for transactions/goals.
- Core pages (app routes): `/transactions`, `/goals`, `/analytics`, `/ai-insights`; `/` redirects to `/transactions`.
- UI shell wraps all pages (`Shell` component) with header, floating dock nav, floating action (+) menu, and toast/confirm handling.

## Tech + Libraries
- React 19, TypeScript, Next.js App Router.
- Firebase (auth, firestore) via `web/src/lib/firebase.ts`.
- Styling: TailwindCSS + daisyUI; utility `cn` in `web/src/lib/utils.ts`.
- Icons: `lucide-react`; motion: `framer-motion`.
- Charts: `recharts` (analytics).
- Contexts/Hooks: `UserContext` (auth user), `useTransactions`, `useGoals`.

## Data & Types
- Transactions (`web/src/types/transactions.ts`):
  - Fields: `id`, `name`, `amount`, `type` (`income|expense`), `categoryId`, `categoryName?`, `ownerId`, `ownerType` (`individual|shared`), `date` (YYYY-MM-DD), `frequency`, `hasReceipt`, `receiptUrl?`, `parentTransactionId?`.
- Goals (`web/src/types/goals.ts`):
  - Fields: `id`, `title`, `targetAmount`, `savedAmount`, `deadline?`, `owner` (`Eden|Sivan|Shared`), `status` (`Active|Completed`), `icon`, `color`.
- Firestore collections: `transactions`, `goals`.

## State & Data Flow
- Auth: `UserProvider` wraps the app (`app/layout.tsx`), exposing `currentUser`, `login`, `logout`.
- Transactions: `useTransactions` subscribes to Firestore; adds recurring instances via `generateRecurringInstances`; `deleteAllTransactions` used by destructive admin button.
- Goals: `useGoals` subscribes to Firestore; `addFunds` updates saved amounts and completion status.
- Analytics: Now uses live transaction data (no mocks). Timeframes: This Month, Last 3 Months, YTD, All Time. Calculates net balance, savings rate, spend diff vs prior period, trends, category spend, and top expenses.

## Layout & Navigation
- `Shell` component: header with brand + profile menu (avatar toggles sign-out), floating bottom dock (icons for Transactions, Goals, Analytics, AI), floating action menu (+) shown only on `/transactions` and `/goals`.
- Floating Action Menu (`floating-action-menu.tsx`): big blue circular + button; menu options “Transaction” and “Goal”; auto-collapses after action; mobile offset to avoid dock overlap.
- Destructive action (Delete All Data) lives in Shell with confirm and toast feedback.

## Forms & Modals
- Add Transaction: `AddTransactionModal` uses standard buttons (no 3D); respects auth; supports frequencies including recurring generation.
- Add Goal: `AddGoalModal` standard buttons; owner/icon/color selection; completion confetti on add-funds if target reached.
- Modals are reused globally; Shell opens them from the floating menu and routes to the relevant page after save.

## Styling & UX Norms
- Buttons: primary/ghost variants from `Button` (not the 3D button) for modals; floating menu uses branded blue.
- Avoid instructions like “Use the + button…” in page headers (already removed).
- Mobile: floating + is offset from bottom; dock remains accessible.
- Keep icons from lucide; keep theme colors (#0073ea primary).

## Routing/Visibility Rules
- Floating + menu only on `/transactions` and `/goals`.
- Analytics and AI Insights do not show the floating +.
- After creating via floating menu, auto-route to the destination page (`/transactions` or `/goals`) and collapse the menu.

## Deployment & Dev
- Dev: `npm run dev` (Turbopack). Build: `npm run build` (static export). Lint: `npm run lint`.
- Deploy: Firebase Hosting (`monopoluri-v3-eden`) from `out` (`firebase.json` configured).

## Best Practices When Editing
- Use existing hooks/contexts instead of ad-hoc fetches.
- Keep hook order stable (avoid early returns before hooks).
- For Firestore ops, guard on `currentUser`.
- Preserve floating menu visibility rules and auto-collapse behavior.
- Favor `Button` over the deprecated 3D button except where explicitly desired.
- When adding analytics logic, derive from live transactions; respect timeframes and empty states.

## Key Files (workspace-relative)
- `web/src/components/Shell.tsx` — layout, header, dock, floating menu, destructive delete, modals wiring.
- `web/src/components/ui/floating-action-menu.tsx` — floating + button/menu.
- `web/src/components/modals/AddTransactionModal.tsx`, `AddGoalModal.tsx` — creation flows.
- `web/src/hooks/useTransactions.ts`, `useGoals.ts` — data subscriptions and mutations.
- `web/src/app/transactions/page.tsx`, `web/src/app/goals/page.tsx`, `web/src/app/analytics/page.tsx`, `web/src/app/ai-insights/page.tsx` — main pages.
- `web/src/lib/firebase.ts` — Firebase init.
- `web/src/lib/utils.ts` — `cn`, recurrence utils.
