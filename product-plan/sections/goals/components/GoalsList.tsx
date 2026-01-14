import { useState } from 'react';
import type { GoalsListProps } from '@/../product/sections/goals/types';
import { GoalCard } from './GoalCard';
import { Plus, Trophy, Target } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function GoalsList({ goals, onAddFunds, onCreate, onEdit, onDelete }: GoalsListProps) {
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');

    const activeGoals = goals.filter(g => g.status === 'Active');
    const completedGoals = goals.filter(g => g.status === 'Completed');

    const handleAddFundsClick = (id: string) => {
        setSelectedGoalId(id);
        setAmount('');
        setIsAddFundsOpen(true);
    };

    const handleConfirmAddFunds = () => {
        if (selectedGoalId && amount) {
            onAddFunds?.(selectedGoalId, Number(amount));
            setIsAddFundsOpen(false);
        }
    };

    const selectedGoal = goals.find(g => g.id === selectedGoalId);

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">

            {/* Active Goals Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-stone-900 to-stone-600 dark:from-white dark:to-stone-400">
                                Active Goals
                            </h2>
                            <p className="text-stone-500">Keep your eyes on the prize.</p>
                        </div>
                    </div>
                    <Button onClick={onCreate} className="gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-900">
                        <Plus className="w-4 h-4" />
                        New Goal
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeGoals.map(goal => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            onAddFunds={handleAddFundsClick}
                            onEdit={onEdit}
                        />
                    ))}
                    {activeGoals.length === 0 && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-50/50 dark:bg-stone-900/50">
                            <p className="text-stone-500 mb-4">No active goals yet.</p>
                            <Button variant="outline" onClick={onCreate}>Create one now</Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Completed Goals Section */}
            {completedGoals.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-3 border-t border-stone-200 dark:border-stone-800 pt-10">
                        <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-200">
                                Completed
                            </h2>
                            <p className="text-sm text-stone-500">Victories worth celebrating.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                        {completedGoals.map(goal => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                onEdit={onEdit}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Add Funds Modal */}
            <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Funds</DialogTitle>
                        <DialogDescription>
                            Adding money to <span className="font-semibold text-stone-900 dark:text-stone-100">{selectedGoal?.title}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-8 font-mono text-lg"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[50, 100, 200, 500].map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setAmount(val.toString())}
                                    className="py-2 px-1 text-sm bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-md transition-colors font-medium text-stone-600 dark:text-stone-400"
                                >
                                    +${val}
                                </button>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddFundsOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmAddFunds} disabled={!amount}>Confirm Transfer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
