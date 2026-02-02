"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";
import { Transaction } from "@/types/transactions";

type Timeframe = 'This Month' | 'Last 3 Months' | 'YTD' | 'All Time' | 'Custom Month';

const CATEGORY_COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Turquoise
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#F8B739', // Orange
    '#5DADE2', // Sky Blue
    '#F1948A', // Pink
    '#82E0AA', // Green
    '#D7BDE2', // Lavender
];

const TIMEFRAMES: Timeframe[] = ['This Month', 'Last 3 Months', 'YTD', 'All Time'];

interface AnalyticsReport {
    netWorth: number;
    savingsRate: number;
    totalSpend: number;
    spendDiff: number;
    trends: { month: string; income: number; expense: number }[];
    spending: { category: string; amount: number; color: string }[];
    drilldown: { id: string; name: string; amount: number; date: string }[];
}

function parseDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function formatMonth(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getRange(timeframe: Timeframe, today: Date, customMonth?: number, customYear?: number) {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    if (timeframe === 'This Month') {
        return { start: startOfMonth, end: endOfMonth, months: 1 };
    }
    if (timeframe === 'Custom Month' && customMonth !== undefined && customYear !== undefined) {
        return {
            start: new Date(customYear, customMonth, 1),
            end: new Date(customYear, customMonth + 1, 0),
            months: 1,
        };
    }
    if (timeframe === 'Last 3 Months') {
        return {
            start: new Date(today.getFullYear(), today.getMonth() - 2, 1),
            end: endOfMonth,
            months: 3,
        };
    }
    if (timeframe === 'YTD') {
        return {
            start: new Date(today.getFullYear(), 0, 1),
            end: endOfMonth,
            months: today.getMonth() + 1,
        };
    }
    return { start: null, end: null, months: 0 };
}

function isWithinRange(date: Date, start: Date | null, end: Date | null) {
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
}

function buildReport(transactions: Transaction[], timeframe: Timeframe, today: Date, customMonth?: number, customYear?: number): AnalyticsReport {
    // Filter out future transactions (only include up to today)
    const currentDateStr = today.toISOString().split('T')[0];
    const pastTransactions = transactions.filter(t => t.date <= currentDateStr);
    
    if (pastTransactions.length === 0) {
        return {
            netWorth: 0,
            savingsRate: 0,
            totalSpend: 0,
            spendDiff: 0,
            trends: [],
            spending: [],
            drilldown: [],
        };
    }

    const range = getRange(timeframe, today, customMonth, customYear);
    const filtered = pastTransactions.filter((t) => isWithinRange(parseDate(t.date), range.start, range.end));

    // If timeframe is All Time, use all past transactions; otherwise use filtered (but handle empty)
    const slice = timeframe === 'All Time' ? pastTransactions : filtered;
    if (slice.length === 0) {
        return {
            netWorth: 0,
            savingsRate: 0,
            totalSpend: 0,
            spendDiff: 0,
            trends: [],
            spending: [],
            drilldown: [],
        };
    }

    const incomeTotal = slice.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenseTotal = slice.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const netWorth = incomeTotal - expenseTotal;
    const savingsRate = incomeTotal > 0 ? Math.max(0, Math.round(((incomeTotal - expenseTotal) / incomeTotal) * 100)) : 0;
    const totalSpend = expenseTotal;

    // Spend diff vs previous equivalent period
    let spendDiff = 0;
    if (range.start && range.months > 0) {
        const prevStart = new Date(range.start.getFullYear(), range.start.getMonth() - range.months, 1);
        const prevEnd = new Date(range.start.getFullYear(), range.start.getMonth(), 0);
        const prevExpense = pastTransactions
            .filter(t => t.type === 'expense' && isWithinRange(parseDate(t.date), prevStart, prevEnd))
            .reduce((sum, t) => sum + t.amount, 0);
        spendDiff = totalSpend - prevExpense;
    }

    // Trend data (month buckets inside selected range)
    const earliest = pastTransactions.reduce<Date>((min, t) => {
        const d = parseDate(t.date);
        return d < min ? d : min;
    }, parseDate(pastTransactions[0].date));

    const trendStart = range.start ?? earliest;
    const trendEnd = range.end ?? today;
    const months: { [label: string]: { income: number; expense: number } } = {};

    const cursor = new Date(trendStart.getFullYear(), trendStart.getMonth(), 1);
    while (cursor <= trendEnd) {
        months[formatMonth(cursor)] = { income: 0, expense: 0 };
        cursor.setMonth(cursor.getMonth() + 1);
    }

    slice.forEach(tx => {
        const key = formatMonth(parseDate(tx.date));
        if (!months[key]) {
            months[key] = { income: 0, expense: 0 };
        }
        if (tx.type === 'income') {
            months[key].income += tx.amount;
        } else {
            months[key].expense += tx.amount;
        }
    });

    const trends = Object.entries(months).map(([month, vals]) => ({
        month,
        income: vals.income,
        expense: vals.expense,
    }));

    // Spending by category (expenses only)
    const expenseByCategory: Record<string, number> = {};
    slice.filter(t => t.type === 'expense').forEach(tx => {
        const key = tx.categoryName || tx.categoryId || 'Uncategorized';
        expenseByCategory[key] = (expenseByCategory[key] || 0) + tx.amount;
    });

    const spending = Object.entries(expenseByCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount], idx) => ({
            category,
            amount,
            color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        }));

    // Drilldown: top expenses
    const drilldown = slice
        .filter(t => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)
        .map(t => ({
            id: t.id,
            name: t.name,
            amount: t.amount,
            date: t.date,
        }));

    return {
        netWorth,
        savingsRate,
        totalSpend,
        spendDiff,
        trends,
        spending,
        drilldown,
    };
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

export default function AnalyticsPage() {
    const { transactions, loading } = useTransactions();
    const [timeframe, setTimeframe] = useState<Timeframe>('This Month');
    const today = useMemo(() => new Date(), []);
    const [customMonth, setCustomMonth] = useState(today.getMonth());
    const [customYear, setCustomYear] = useState(today.getFullYear());

    // Generate month options (last 12 months + next 12 months)
    const monthOptions = useMemo(() => {
        const options = [];
        for (let i = -12; i <= 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            options.push({
                month: date.getMonth(),
                year: date.getFullYear(),
                label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            });
        }
        return options;
    }, [today]);

    const report = useMemo(
        () => buildReport(transactions, timeframe, today, customMonth, customYear),
        [transactions, timeframe, today, customMonth, customYear]
    );

    const hasData = transactions.length > 0 && report.trends.length > 0;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-[#323338]">Analytics</h2>
                <div className="flex items-center bg-white rounded-lg p-1 border gap-1">
                    {TIMEFRAMES.filter(t => t !== 'Custom Month').map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={cn(
                                "px-4 py-1.5 text-sm rounded-md transition-all whitespace-nowrap",
                                timeframe === t ? "bg-[#0073ea] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                    <div className="h-6 w-px bg-gray-300 mx-1" />
                    <select
                        className={cn(
                            "px-3 py-1.5 text-sm rounded-md transition-all cursor-pointer focus:outline-none appearance-none bg-transparent",
                            timeframe === 'Custom Month' ? "bg-[#0073ea] text-white" : "text-gray-600 hover:bg-gray-100"
                        )}
                        value={timeframe === 'Custom Month' ? `${customYear}-${customMonth}` : ''}
                        onChange={(e) => {
                            if (e.target.value) {
                                const [year, month] = e.target.value.split('-').map(Number);
                                setCustomYear(year);
                                setCustomMonth(month);
                                setTimeframe('Custom Month');
                            }
                        }}
                    >
                        <option value="">Select Month</option>
                        {monthOptions.map(opt => (
                            <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-gray-500">Loading analytics...</div>
            ) : !hasData ? (
                <Card>
                    <CardContent className="py-10 text-center text-gray-500">
                        No financial data yet for this timeframe. Add transactions to see analytics.
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-2"><span className="text-sm text-gray-500">Net Balance</span></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(report.netWorth)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><span className="text-sm text-gray-500">Savings Rate</span></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{report.savingsRate}%</div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                    <div className="bg-[#0073ea] h-1.5 rounded-full" style={{ width: `${Math.min(report.savingsRate, 100)}%` }}></div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><span className="text-sm text-gray-500">Total Spend</span></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(report.totalSpend)}</div>
                                <div className={cn("flex items-center text-xs mt-1", report.spendDiff > 0 ? "text-red-500" : "text-green-600")}>
                                    {report.spendDiff > 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                                    <span>{formatCurrency(Math.abs(report.spendDiff))} vs previous period</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Income vs Expense Chart */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Income vs Expenses</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={report.trends} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `€${val}`} />
                                        <Tooltip
                                            cursor={{ fill: '#f3f4f6' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                                        <Bar dataKey="expense" fill="#e2445c" radius={[4, 4, 0, 0]} name="Expense" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Spending Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Spending by Category</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center">
                                {report.spending.length === 0 ? (
                                    <div className="text-gray-500 text-sm py-8">No expenses in this timeframe.</div>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={report.spending}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="amount"
                                                >
                                                    {report.spending.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(val?: number) => formatCurrency(val ?? 0)} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-4 text-xs max-h-[200px] overflow-y-auto px-2">
                                            {report.spending.map((item) => (
                                                <div key={item.category} className="flex items-center gap-1.5 min-w-0">
                                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                                    <span className="text-gray-600 truncate flex-shrink min-w-0">{item.category}</span>
                                                    <span className="font-medium whitespace-nowrap ml-auto">{formatCurrency(item.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Drilldown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {report.drilldown.length === 0 ? (
                                <div className="text-sm text-gray-500">No expenses to show.</div>
                            ) : (
                                <div className="space-y-3">
                                    {report.drilldown.map(item => (
                                        <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.date}</p>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
