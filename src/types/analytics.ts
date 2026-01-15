export interface Metrics {
    netWorth: number;
    savingsRate: number;
    totalSpend: number;
    spendDiff: number;
}

export interface TrendData {
    month: string;
    income: number;
    expense: number;
}

export interface SpendingData {
    category: string;
    amount: number;
    color: 'slate' | 'amber' | 'stone' | 'red';
    [key: string]: string | number; // Index signature for Recharts
}

