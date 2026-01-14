// =============================================================================
// Data Types
// =============================================================================

export interface Metrics {
    netWorth: number;
    /** Percentage value (0-100) */
    savingsRate: number;
    totalSpend: number;
    /** Difference from previous month (positive = increased spend, negative = decreased) */
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
}

export interface DrilldownItem {
    id: string;
    name: string;
    amount: number;
    date: string;
}

export interface AnalyticsReport {
    metrics: Metrics;
    trends: TrendData[];
    spending: SpendingData[];
    drilldown: DrilldownItem[];
}

// =============================================================================
// Component Props
// =============================================================================

export type Timeframe = 'This Month' | 'Last 3 Months' | 'YTD' | 'All Time';

export interface AnalyticsDashboardProps {
    /** The full report data */
    data: AnalyticsReport;
    /** Currently selected timeframe */
    timeframe: Timeframe;
    /** Called when user changes timeframe */
    onTimeframeChange: (timeframe: Timeframe) => void;
    /** Called when user clicks a category slice to drill down */
    onCategoryClick?: (category: string) => void;
}
