import data from '@/../product/sections/goals/data.json';
import { GoalsList } from './components/GoalsList';
import type { Goal } from '@/../product/sections/goals/types';
import { useState } from 'react';
import confetti from 'canvas-confetti';

export default function GoalsListPreview() {
    const [goals, setGoals] = useState<Goal[]>(data.goals as Goal[]);

    const handleAddFunds = (id: string, amount: number) => {
        setGoals(prev => prev.map(goal => {
            if (goal.id === id) {
                const newSaved = goal.savedAmount + amount;
                const newProgress = (newSaved / goal.targetAmount);

                // Trigger confetti if goal just completed
                if (newProgress >= 1 && goal.status !== 'Completed') {
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#22c55e', '#16a34a', '#fbbf24', '#f59e0b']
                    });

                    return {
                        ...goal,
                        savedAmount: newSaved,
                        status: 'Completed'
                    };
                }

                return {
                    ...goal,
                    savedAmount: newSaved
                };
            }
            return goal;
        }));

        console.log('Added funds:', { id, amount });
    };

    return (
        <GoalsList
            goals={goals}
            onCreate={() => console.log('Create new goal')}
            onEdit={(id) => console.log('Edit goal:', id)}
            onDelete={(id) => console.log('Delete goal:', id)}
            onAddFunds={handleAddFunds}
        />
    );
}
