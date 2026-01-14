import { useState } from 'react';
import type { AnalyticsDashboardProps, Timeframe } from '@/../product/sections/analytics/types';
import { MetricCard } from './MetricCard';
import { TrendChart } from './charts/TrendChart';
import { CategoryChart } from './charts/CategoryChart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Download, Calendar } from 'lucide-react';

export function AnalyticsDashboard({
    data,
    timeframe,
    onTimeframeChange,
    onCategoryClick
}: AnalyticsDashboardProps) {

    const timeframes: Timeframe[] = ['This Month', 'Last 3 Months', 'YTD', 'All Time'];

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">Financial Report</h1>
                    <p className="text-stone-500 mt-1">Overview of your estate's health.</p>
                </div>

                <div className="flex items-center gap-3 bg-stone-100 dark:bg-stone-900/50 p-1.5 rounded-xl">
                    {timeframes.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => onTimeframeChange(tf)}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                                timeframe === tf
                                    ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm"
                                    : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                            )}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Net Worth"
                    value={`$${data.metrics.netWorth.toLocaleString()}`}
                    icon="wallet"
                    trend={{ value: 5.2, isPositiveGood: true, label: "vs last month" }}
                />
                <MetricCard
                    title="Monthly Savings Rate"
                    value={`${data.metrics.savingsRate}%`}
                    icon="trend"
                    trend={{ value: 2.1, isPositiveGood: true }}
                />
                <MetricCard
                    title="Total Spend"
                    value={`$${data.metrics.totalSpend.toLocaleString()}`}
                    icon="dollar"
                    trend={{ value: -4.5, isPositiveGood: false, label: "vs avg" }}
                />
            </div>

            {/* Trend Section */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Income vs. Expense</h2>
                        <p className="text-sm text-stone-500 flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            Viewing trends for {timeframe}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                </div>
                <TrendChart data={data.trends} />
            </div>

            {/* Categories Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-8">
                    <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">Spending by Category</h2>
                    <p className="text-sm text-stone-500 mb-8">Breakdown of expenses. Click a slice to view details.</p>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-1/2">
                            <CategoryChart data={data.spending} onCategoryClick={onCategoryClick} />
                        </div>
                        <div className="w-full md:w-1/2 space-y-3">
                            {data.spending.map((cat, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer" onClick={() => onCategoryClick?.(cat.category)}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-3 h-3 rounded-full", {
                                            'bg-slate-500': cat.color === 'slate',
                                            'bg-stone-400': cat.color === 'stone',
                                            'bg-amber-500': cat.color === 'amber',
                                            'bg-red-500': cat.color === 'red',
                                        })} />
                                        <span className="font-medium text-stone-700 dark:text-stone-300">{cat.category}</span>
                                    </div>
                                    <span className="text-stone-900 dark:text-stone-100 font-mono font-medium">${cat.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mini Drilldown Panel (Placeholder for interactivity) */}
                <div className="bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-100 dark:border-stone-800 p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold text-stone-900 dark:text-stone-100">Top Transactions</h3>
                        <p className="text-xs text-stone-500 mb-4">Recent large expenses</p>
                        <div className="space-y-4">
                            {data.drilldown.map(t => (
                                <div key={t.id} className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800/50 pb-2 last:border-0 last:pb-0">
                                    <div>
                                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t.name}</p>
                                        <p className="text-xs text-stone-500">{t.date}</p>
                                    </div>
                                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100">-${t.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-stone-200 dark:border-stone-800">
                        <p className="text-xs text-stone-400 text-center">
                            Select a category in the chart to filter these results.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
