# Google Stitch Prompt: Foundation + Add Transaction / Add Goal Windows

Use this as your working prompt in Google Stitch.

## 1) Master Prompt (Paste First)

```text
You are building UI for Monopoluri V3, a private finance app for a married couple (Eden + Sivan) who manage shared and individual money together.

GOAL
Create a production-quality UI foundation, then focus on two modal windows:
1) Add Transaction
2) Add Goal

TECH + CONSTRAINTS
- React + TypeScript + Tailwind CSS.
- Mobile-first, responsive desktop layout.
- Keep components reusable and props-driven.
- Use accessible semantics, keyboard support, and clear focus states.
- Keep visual style consistent with a clean productivity app aesthetic.

PROJECT STRUCTURE TO TARGET
- App routes: /auth, /transactions, /goals, /analytics, /ai-insights
- Global shell:
  - Sticky top header with brand + profile menu.
  - Floating bottom dock navigation.
  - Floating + action menu on /transactions and /goals only.
- Data model (UI contracts):
  - Transaction: id, name, amount, type (income|expense), categoryId, categoryName, ownerId, ownerType (individual|shared), date (YYYY-MM-DD), frequency, hasReceipt
  - Goal: id, title, targetAmount, savedAmount, deadline?, owner (Eden|Sivan|Shared), status (Active|Completed), icon, color

THEME + DESIGN TOKENS
- Font: Manrope for UI text, IBM Plex Mono for numeric/meta values.
- Brand blue: #0073ea
- Brand blue hover: #0060c4
- Primary text: #323338
- App background: #f5f6f8
- Card background: #ffffff
- Border: #d0d4e4
- Success: #1d8a4c
- Danger/expense accent: #d92c2c
- Radii: card 12px, modal 12px, input/button 8px
- Shadows: soft and minimal, no heavy skeuomorphism

FOUNDATION DELIVERABLES
- Create reusable primitives:
  - Modal (portal, escape to close, overlay click support, scroll lock)
  - Button variants: primary, secondary, ghost, danger
  - Input + Select with consistent focus ring
  - Step indicator component with numbered circles + progress bar
- Make spacing, type scale, and colors coherent across all forms.

FOCUS DELIVERABLE 1: ADD TRANSACTION WINDOW
Build a multi-step modal form with these steps and validations:
1. Type: expense | income
2. Description: required text
3. Amount: required number > 0
4. Category: filtered by selected type
5. Date: required date
6. Owner: Shared | Eden | Sivan
7. Frequency: one-time | weekly | monthly
8. Review: summary cards + final save action

Behavior requirements:
- The active accent color changes by type:
  - expense => #d92c2c
  - income => #1d8a4c
- Continue button disabled until current step is valid.
- Back button disabled on first step.
- Final submit button label: "Save Transaction".

FOCUS DELIVERABLE 2: ADD GOAL WINDOW
Build a multi-step modal form with these steps and validations:
1. Goal Title: required text
2. Target Amount: required number > 0
3. Owner: Shared | Eden | Sivan
4. Deadline: optional date (today or future)
5. Icon: plane | gift | home
6. Review: summary cards + final save action

Behavior requirements:
- Goal flow uses blue accent #0073ea.
- Continue button disabled until current step is valid.
- Final submit button label: "Save Goal".

OUTPUT FORMAT
Return code for:
- Modal.tsx
- Button.tsx
- Input.tsx
- MultiStepTransactionForm.tsx
- MultiStepGoalForm.tsx
- AddTransactionModal.tsx
- AddGoalModal.tsx

Also include:
- Example constants for categories and icon options.
- A short integration snippet showing these modals being opened from a floating action menu with options "Transaction" and "Goal".

Do not generate backend code. Keep outputs UI-focused and ready to wire into existing hooks.
```

## 2) Follow-Up Prompt (Refine Transaction Window)

```text
Refine only the Add Transaction modal UX.

Keep all current fields and steps, but improve:
- Visual hierarchy of step header and helper text.
- Error states with inline guidance (not noisy).
- Number formatting preview (EUR) in review step.
- Better mobile ergonomics (thumb-friendly spacing, sticky action row at bottom inside modal).
- Smooth but subtle transitions between steps.

Do not change the data contract. Return only updated files:
- MultiStepTransactionForm.tsx
- AddTransactionModal.tsx
```

## 3) Follow-Up Prompt (Refine Goal Window)

```text
Refine only the Add Goal modal UX.

Keep the same step order and fields, but improve:
- Icon picker clarity (selected state should be very clear).
- Deadline helper copy (optional but recommended behavior).
- Review screen emphasis on target amount and owner.
- Empty/default state polish.
- Mobile and desktop spacing consistency.

Do not change the data contract. Return only updated files:
- MultiStepGoalForm.tsx
- AddGoalModal.tsx
```

## 4) Stitch-Friendly Example Code (Starter Contracts)

```ts
// types.ts
export type TransactionType = "income" | "expense";
export type Owner = "Shared" | "Eden" | "Sivan";
export type TxFrequency = "one-time" | "weekly" | "monthly";

export interface TransactionInput {
  name: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName?: string;
  ownerId: "shared" | "eden" | "sivan";
  ownerType: "shared" | "individual";
  date: string; // YYYY-MM-DD
  frequency: TxFrequency;
  hasReceipt: boolean;
}

export interface GoalInput {
  title: string;
  targetAmount: number;
  savedAmount: number;
  owner: Owner;
  status: "Active" | "Completed";
  icon: "plane" | "gift" | "home";
  color: "slate" | "amber" | "stone" | "red";
  deadline?: string;
}
```

```ts
// constants.ts
export const CATEGORIES = [
  { id: "salary", name: "Salary", type: "income" },
  { id: "freelance", name: "Freelance", type: "income" },
  { id: "gift", name: "Gift", type: "income" },
  { id: "refunds", name: "Refunds", type: "income" },
  { id: "other", name: "Other", type: "income" },
  { id: "housing", name: "Housing", type: "expense" },
  { id: "food", name: "Dining Out", type: "expense" },
  { id: "groceries", name: "Groceries", type: "expense" },
  { id: "insurance", name: "Insurance", type: "expense" },
  { id: "subscriptions", name: "Subscriptions", type: "expense" },
  { id: "transport", name: "Transport", type: "expense" },
  { id: "travel", name: "Travel", type: "expense" },
  { id: "shopping", name: "Shopping", type: "expense" },
  { id: "utilities", name: "Utilities", type: "expense" },
  { id: "entertainment", name: "Entertainment", type: "expense" },
  { id: "health", name: "Health", type: "expense" },
  { id: "personal-care", name: "Personal Care", type: "expense" },
  { id: "misc", name: "Misc", type: "expense" },
] as const;

export const GOAL_ICONS = ["plane", "gift", "home"] as const;
```

```tsx
// integration-example.tsx
import { useState } from "react";

export function QuickAddWindows() {
  const [showTx, setShowTx] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  return (
    <>
      <FloatingActionMenu
        options={[
          { label: "Transaction", onClick: () => setShowTx(true) },
          { label: "Goal", onClick: () => setShowGoal(true) },
        ]}
      />

      <AddTransactionModal
        isOpen={showTx}
        onClose={() => setShowTx(false)}
        onSave={async (tx) => {
          // wire to addTransaction hook
          console.log("save tx", tx);
          setShowTx(false);
        }}
      />

      <AddGoalModal
        isOpen={showGoal}
        onClose={() => setShowGoal(false)}
        onSave={async (goal) => {
          // wire to addGoal hook
          console.log("save goal", goal);
          setShowGoal(false);
        }}
      />
    </>
  );
}
```

## 5) Recommended Workflow

1. Paste section 1 into Stitch.
2. Generate all base files.
3. Apply section 2 to polish transaction flow.
4. Apply section 3 to polish goal flow.
5. Compare generated code against your existing hooks and modal wiring before merge.
