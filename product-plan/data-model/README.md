# Data Model

This directory contains TypeScript type definitions and sample data for all entities in Monopoluri.

## Type Files

- **transactions-types.ts** — User, Transaction, Category, Receipt interfaces
- **goals-types.ts** — Goal interface and related types
- **analytics-types.ts** — Metrics, TrendData, SpendingData, AnalyticsReport
- **ai-insights-types.ts** — InsightCard, ChatMessage, and related types

## Sample Data Files

- **transactions-data.json** — Sample users, categories, and transactions
- **goals-data.json** — Sample active and completed goals
- **analytics-data.json** — Sample analytics report data
- **ai-insights-data.json** — Sample insight cards and chat history

## Core Entities

### User
Represents Eden or Sivan with their profile color identity.

### Transaction
Income or expense entry with category, owner, frequency, and optional receipt.

### Category
Groups transactions into logical types (Groceries, Salary, Rent, etc.).

### Goal
Financial target with progress tracking, owner, optional deadline.

### Receipt
Optional photo attachment for transactions.

### Report
Aggregated financial data for analytics (metrics, trends, spending breakdown).

### InsightCard
Proactive AI-generated financial insights (Anomaly, Forecast, Suggestion).

### ChatMessage
Messages in the AI advisor chat interface.

## Relationships

- User has many Transactions
- User has many Goals
- Transaction belongs to a Category
- Transaction may have one Receipt
- Category has many Transactions
- Goal belongs to a User or is Shared

## Usage

Import types in your code:

```typescript
import { Transaction, Category, User } from './data-model/transactions-types';
import { Goal } from './data-model/goals-types';
import { AnalyticsReport } from './data-model/analytics-types';
import { InsightCardData } from './data-model/ai-insights-types';
```

Use sample data for testing:

```typescript
import transactionsData from './data-model/transactions-data.json';
import goalsData from './data-model/goals-data.json';
```
