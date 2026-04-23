// In-memory mock data store for local dev without Firestore.
// Active only when NEXT_PUBLIC_DEV_AUTH_BYPASS=1 and NODE_ENV !== 'production'.
// Backed by localStorage so edits persist across page reloads within a dev session.

import { Transaction } from "@/types/transactions";
import { Goal } from "@/types/goals";

export const DEV_AUTH_BYPASS =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "1";

const STORAGE_KEY_TX = "dev-mock-transactions-v2";
const STORAGE_KEY_GOALS = "dev-mock-goals-v2";

function isoDaysAgo(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
}

// Realistic sample set covering multiple categories, owners, amounts, and dates.
// Dates are relative to "today" so data always lines up with the current month
// regardless of when the dev session starts.
function buildSeedTransactions(): Transaction[] {
    const mk = (
        partial: Omit<Transaction, "id" | "hasReceipt" | "frequency" | "createdAt">,
    ): Transaction => ({
        frequency: "one-time",
        hasReceipt: false,
        ...partial,
        id: `mock-${Math.random().toString(36).slice(2, 10)}`,
    });

    return [
        // Today
        mk({ name: "Eden - Salary", amount: 3400, type: "income", categoryId: "salary", categoryName: "Salary", ownerId: "Eden", ownerType: "individual", date: isoDaysAgo(0) }),
        mk({ name: "Morning coffee at Fazer", amount: 4.5, type: "expense", categoryId: "food", categoryName: "Dining Out", ownerId: "Eden", ownerType: "individual", date: isoDaysAgo(0) }),
        // Yesterday
        mk({ name: "Money From Tamar + Bicycle", amount: 3130, type: "income", categoryId: "gift", categoryName: "Gift", ownerId: null, ownerType: "shared", date: isoDaysAgo(1) }),
        mk({ name: "UNIQLO EUROPE LTD LONDON", amount: 189.7, type: "expense", categoryId: "shopping", categoryName: "Shopping", ownerId: null, ownerType: "shared", date: isoDaysAgo(1) }),
        mk({ name: "Netflix", amount: 13.99, type: "expense", categoryId: "subscriptions", categoryName: "Subscriptions", ownerId: null, ownerType: "shared", date: isoDaysAgo(1) }),
        // 3 days ago
        mk({ name: "Lidl weekly shop", amount: 64.2, type: "expense", categoryId: "groceries", categoryName: "Groceries", ownerId: null, ownerType: "shared", date: isoDaysAgo(3) }),
        mk({ name: "Gym membership", amount: 49.0, type: "expense", categoryId: "health", categoryName: "Health", ownerId: "Sivan", ownerType: "individual", date: isoDaysAgo(3) }),
        // 5 days ago
        mk({ name: "Rent", amount: 1858, type: "expense", categoryId: "housing", categoryName: "Housing", ownerId: null, ownerType: "shared", date: isoDaysAgo(5) }),
        mk({ name: "Electricity bill", amount: 82.5, type: "expense", categoryId: "utilities", categoryName: "Utilities", ownerId: null, ownerType: "shared", date: isoDaysAgo(5) }),
        // 7 days ago
        mk({ name: "Ekron - Sivan Salary", amount: 2900, type: "income", categoryId: "salary", categoryName: "Salary", ownerId: "Sivan", ownerType: "individual", date: isoDaysAgo(7) }),
        mk({ name: "Dublin bus top-up", amount: 20, type: "expense", categoryId: "transport", categoryName: "Transport", ownerId: "Eden", ownerType: "individual", date: isoDaysAgo(7) }),
        // 10 days ago
        mk({ name: "Cinema tickets", amount: 24, type: "expense", categoryId: "entertainment", categoryName: "Entertainment", ownerId: null, ownerType: "shared", date: isoDaysAgo(10) }),
        mk({ name: "Pharmacy", amount: 15.3, type: "expense", categoryId: "personal-care", categoryName: "Personal Care", ownerId: "Sivan", ownerType: "individual", date: isoDaysAgo(10) }),
        // 14 days ago
        mk({ name: "Weekend in Galway", amount: 212, type: "expense", categoryId: "travel", categoryName: "Travel", ownerId: null, ownerType: "shared", date: isoDaysAgo(14) }),
        mk({ name: "Freelance — logo design", amount: 450, type: "income", categoryId: "freelance", categoryName: "Freelance", ownerId: "Eden", ownerType: "individual", date: isoDaysAgo(14) }),
        // 18 days ago
        mk({ name: "Health insurance", amount: 95, type: "expense", categoryId: "insurance", categoryName: "Insurance", ownerId: null, ownerType: "shared", date: isoDaysAgo(18) }),
        mk({ name: "Stuff from Søstrene Grene", amount: 28.9, type: "expense", categoryId: "misc", categoryName: "Misc", ownerId: "Eden", ownerType: "individual", date: isoDaysAgo(18) }),
        // 25 days ago (still within the current month for typical dates)
        mk({ name: "Zara return refund", amount: 39, type: "income", categoryId: "refunds", categoryName: "Refunds", ownerId: "Sivan", ownerType: "individual", date: isoDaysAgo(25) }),
    ];
}

function buildSeedGoals(): Goal[] {
    return [
        { id: "mock-g-1", title: "Trip to Japan", targetAmount: 6000, savedAmount: 2450, deadline: isoDaysAgo(-180), owner: "Shared", status: "Active", icon: "plane", color: "slate" },
        { id: "mock-g-2", title: "New laptop", targetAmount: 2200, savedAmount: 900, deadline: isoDaysAgo(-90), owner: "Eden", status: "Active", icon: "home", color: "amber" },
        { id: "mock-g-3", title: "Emergency fund", targetAmount: 5000, savedAmount: 5000, owner: "Shared", status: "Completed", icon: "gift", color: "stone" },
    ];
}

function loadJSON<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function saveJSON(key: string, value: unknown) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // quota / disabled storage — ignore
    }
}

class Store<T> {
    private data: T;
    private listeners = new Set<() => void>();
    constructor(initial: T) {
        this.data = initial;
    }
    get(): T {
        return this.data;
    }
    set(next: T) {
        this.data = next;
        this.listeners.forEach((l) => l());
    }
    update(fn: (current: T) => T) {
        this.set(fn(this.data));
    }
    subscribe(fn: () => void): () => void {
        this.listeners.add(fn);
        return () => {
            this.listeners.delete(fn);
        };
    }
}

export const mockTransactionsStore = new Store<Transaction[]>(
    loadJSON(STORAGE_KEY_TX, buildSeedTransactions()),
);
mockTransactionsStore.subscribe(() => saveJSON(STORAGE_KEY_TX, mockTransactionsStore.get()));

export const mockGoalsStore = new Store<Goal[]>(
    loadJSON(STORAGE_KEY_GOALS, buildSeedGoals()),
);
mockGoalsStore.subscribe(() => saveJSON(STORAGE_KEY_GOALS, mockGoalsStore.get()));

export function resetMockData() {
    mockTransactionsStore.set(buildSeedTransactions());
    mockGoalsStore.set(buildSeedGoals());
}

// Expose a global resetter in dev so you can re-seed from the browser console.
if (typeof window !== "undefined" && DEV_AUTH_BYPASS) {
    (window as unknown as { __resetMockData?: () => void }).__resetMockData = resetMockData;
}

export function makeMockId(prefix = "mock"): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
