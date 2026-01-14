import type { InsightCardData } from '@/../product/sections/ai-insights/types';
import { AlertTriangle, TrendingUp, Lightbulb, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
    data: InsightCardData;
}

const iconMap = {
    Anomaly: AlertTriangle,
    Forecast: TrendingUp,
    Suggestion: Lightbulb,
};

const colorMap = {
    Anomaly: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/50',
    Forecast: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    Suggestion: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
};

export function InsightCard({ data }: InsightCardProps) {
    const Icon = iconMap[data.type];
    const colorStyles = colorMap[data.type];

    return (
        <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start gap-4">
                <div className={cn("p-2.5 rounded-lg border", colorStyles)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                            {data.type}
                        </span>
                        <span className="text-xs text-stone-400">{data.date}</span>
                    </div>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 leading-tight">
                        {data.title}
                    </h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                        {data.message}
                    </p>
                </div>
            </div>
        </div>
    );
}
