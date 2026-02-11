import { Metrics, TrendData, SpendingData } from "@/types/analytics";

export const MOCK_METRICS: Metrics = {
    netWorth: 142500,
    savingsRate: 18.5,
    totalSpend: 4250,
    spendDiff: -120
};

export const MOCK_TRENDS: TrendData[] = [
    { month: "Aug", income: 5800, expense: 4100 },
    { month: "Sep", income: 5900, expense: 4300 },
    { month: "Oct", income: 5800, expense: 4000 },
    { month: "Nov", income: 6200, expense: 5500 },
    { month: "Dec", income: 6000, expense: 4800 },
    { month: "Jan", income: 6100, expense: 4250 }
];

export const MOCK_SPENDING: SpendingData[] = [
    { category: "Housing", amount: 1800, color: "slate" },
    { category: "Dining Out", amount: 850, color: "stone" },
    { category: "Shopping", amount: 600, color: "amber" },
    { category: "Transport", amount: 400, color: "red" },
    { category: "Utilities", amount: 350, color: "stone" },
    { category: "Entertainment", amount: 250, color: "slate" }
];
