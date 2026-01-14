import type { Goal } from '@/../product/sections/goals/types';
import { Shield, Laptop, Plane, Dumbbell, Gift, Monitor, CheckCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';


interface GoalCardProps {
    goal: Goal;
    onAddFunds?: (id: string) => void;
    onEdit?: (id: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
    shield: <Shield className="w-5 h-5" />,
    laptop: <Laptop className="w-5 h-5" />,
    plane: <Plane className="w-5 h-5" />,
    dumbbell: <Dumbbell className="w-5 h-5" />,
    gift: <Gift className="w-5 h-5" />,
    desktop: <Monitor className="w-5 h-5" />,
};

const colorMap = {
    slate: {
        bg: 'bg-slate-50 dark:bg-slate-900',
        border: 'border-slate-200 dark:border-slate-800',
        iconBg: 'bg-slate-100 dark:bg-slate-800',
        iconColor: 'text-slate-600 dark:text-slate-400',
        progress: 'bg-slate-600 dark:bg-slate-400',
        owner: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    amber: {
        bg: 'bg-amber-50/50 dark:bg-amber-950/20',
        border: 'border-amber-200 dark:border-amber-900',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50',
        iconColor: 'text-amber-600 dark:text-amber-400',
        progress: 'bg-amber-500',
        owner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    },
    stone: {
        bg: 'bg-stone-50 dark:bg-stone-900',
        border: 'border-stone-200 dark:border-stone-800',
        iconBg: 'bg-stone-100 dark:bg-stone-800',
        iconColor: 'text-stone-600 dark:text-stone-400',
        progress: 'bg-stone-600 dark:bg-stone-400',
        owner: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    },
    red: {
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-200 dark:border-red-900',
        iconBg: 'bg-red-100 dark:bg-red-900/50',
        iconColor: 'text-red-600 dark:text-red-400',
        progress: 'bg-red-600 dark:bg-red-400',
        owner: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    },
};

export function GoalCard({ goal, onAddFunds, onEdit }: GoalCardProps) {
    const isCompleted = goal.status === 'Completed';
    const progress = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);

    // Completed styling overrides
    const styles = isCompleted
        ? {
            bg: 'bg-green-50/50 dark:bg-green-950/20',
            border: 'border-green-200 dark:border-green-900',
            iconBg: 'bg-green-100 dark:bg-green-900/50',
            iconColor: 'text-green-600 dark:text-green-400',
            progress: 'bg-green-600 dark:bg-green-500',
            owner: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        }
        : colorMap[goal.color] || colorMap.slate;

    const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <div
            onClick={() => onEdit?.(goal.id)}
            className={cn(
                "group relative flex flex-col gap-4 rounded-xl border p-5 transition-all duration-300 hover:shadow-md cursor-pointer",
                styles.bg,
                styles.border
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", styles.iconBg, styles.iconColor)}>
                        {iconMap[goal.icon] || <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-stone-900 dark:text-stone-100">{goal.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", styles.owner)}>
                                {goal.owner}
                            </span>
                            {daysLeft !== null && !isCompleted && (
                                <span className="text-xs text-stone-500 font-medium">
                                    {daysLeft > 0 ? `${daysLeft} days left` : 'Due today'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {isCompleted ? (
                    <div className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Done
                    </div>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddFunds?.(goal.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full p-2 hover:scale-105 active:scale-95 shadow-sm"
                        title="Add Funds"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Progress Section */}
            <div className="space-y-2">
                <div className="flex items-end justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm text-stone-500 mb-0.5">Saved</span>
                        <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100">
                            ${goal.savedAmount.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-stone-400 mb-1">Target</span>
                        <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                            ${goal.targetAmount.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="h-2.5 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-500", styles.progress)}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
