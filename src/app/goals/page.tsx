"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/Card";
import { Shield, Smartphone, Plane, Dumbbell, Gift, Monitor, Car, Home, Plus } from "lucide-react";
import confetti from 'canvas-confetti';
import { useUser } from '@/contexts/UserContext';
import { useGoals } from '@/hooks/useGoals';
import { Goal } from '@/types/goals';
import { AddFundsModal } from '@/components/modals/AddFundsModal';

const ICON_MAP: Record<string, React.ElementType> = {
    shield: Shield, laptop: Smartphone, plane: Plane, dumbbell: Dumbbell,
    gift: Gift, desktop: Monitor, car: Car, home: Home
};

const COLOR_MAP: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-700',
    stone: 'bg-stone-100 text-stone-700',
    red: 'bg-red-100 text-red-700',
};

export default function GoalsPage() {
    const { currentUser } = useUser();
    const { goals, loading, addFunds } = useGoals();

    // Modal State
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

    const handleGoalComplete = () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#0073ea', '#ffffff']
        });
    };

    const handleAddFundsClick = (goal: Goal) => {
        setSelectedGoal(goal);
        setIsAddFundsOpen(true);
    };

    const handleConfirmFunds = async (amount: number) => {
        if (!selectedGoal) return;
        const { status } = await addFunds(selectedGoal.id, selectedGoal.savedAmount, selectedGoal.targetAmount, amount);
        if (status === 'Completed') {
            handleGoalComplete();
        }
    };

    if (loading) return <div className="p-8">Loading goals...</div>;

    const activeGoals = goals.filter(g => g.status === 'Active');
    const completedGoals = goals.filter(g => g.status === 'Completed');

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-[#323338]">Goals</h2>
                    <p className="text-gray-500">Track your savings targets</p>
                </div>
            </div>

            {/* Active Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeGoals.map(goal => {
                    const Icon = ICON_MAP[goal.icon] || Gift;
                    const percent = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));

                    return (
                        <Card key={goal.id} className="p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${COLOR_MAP[goal.color] || 'bg-gray-100'}`}>
                                    <Icon size={24} />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900">€{goal.savedAmount.toLocaleString()}</div>
                                    <div className="text-sm text-gray-500">of €{goal.targetAmount.toLocaleString()}</div>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{goal.title}</h3>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-xs font-medium text-gray-500">
                                    <span>{percent}% Saved</span>
                                    {goal.deadline && <span>Due {goal.deadline}</span>}
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-[#0073ea] h-full transition-all duration-500"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleAddFundsClick(goal)}
                                disabled={!currentUser}
                                className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-200 text-gray-500 hover:border-[#0073ea] hover:text-[#0073ea] hover:bg-blue-50 font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} />
                                Add Funds
                            </button>
                        </Card>
                    );
                })}

                {activeGoals.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Gift className="mx-auto mb-3 opacity-20" size={48} />
                        <p>No active goals yet. Create one to start saving!</p>
                    </div>
                )}
            </div>

            {/* Completed Goals Section */}
            {completedGoals.length > 0 && (
                <div className="pt-8 border-t border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Gift className="text-green-500" />
                        Completed Goals
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {completedGoals.map(goal => {
                            const Icon = ICON_MAP[goal.icon] || Gift;
                            return (
                                <Card key={goal.id} className="p-6 bg-green-50/50 border-green-100 opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="p-3 rounded-xl bg-green-100 text-green-700">
                                            <Icon size={24} />
                                        </div>
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                            Completed
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">{goal.title}</h3>
                                    <p className="text-green-700 mt-1 font-medium">
                                        Saved €{goal.savedAmount.toLocaleString()}
                                    </p>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Modals */}
            <AddFundsModal
                isOpen={isAddFundsOpen}
                onClose={() => setIsAddFundsOpen(false)}
                goal={selectedGoal}
                onConfirm={handleConfirmFunds}
            />
        </div>
    );
}
