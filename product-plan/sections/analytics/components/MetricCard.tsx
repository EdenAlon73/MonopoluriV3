import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    title: string;
    value: string;
    trend?: {
        value: number;
        isPositiveGood: boolean;
        label?: string;
    };
    icon: 'wallet' | 'trend' | 'dollar';
}

const iconMap = {
    wallet: Wallet,
    trend: TrendingUp,
    dollar: DollarSign,
};

export function MetricCard({ title, value, trend, icon }: MetricCardProps) {
    const Icon = iconMap[icon];

    const isPositiveTrend = trend && trend.value > 0;
    const isGood = trend ? (isPositiveTrend === trend.isPositiveGood) : true;

    const trendColor = isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const TrendIcon = isPositiveTrend ? ArrowUpRight : ArrowDownRight;

    return (
        <div className="group p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
                        <TrendIcon className="w-4 h-4" />
                        <span>{Math.abs(trend.value)}%</span>
                        {trend.label && <span className="text-stone-400 font-normal ml-1">{trend.label}</span>}
                    </div>
                )}
            </div>

            <div className="mt-4">
                <p className="text-sm font-medium text-stone-500">{title}</p>
                <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                    {value}
                </h3>
            </div>
        </div>
    );
}
