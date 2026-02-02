"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Goal } from '@/types/goals';

interface AddFundsModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal | null;
    onConfirm: (amount: number) => Promise<void>;
}

export function AddFundsModal({ isOpen, onClose, goal, onConfirm }: AddFundsModalProps) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const maxAdd = goal ? Math.max(0, goal.targetAmount - goal.savedAmount) : 0;
    const amountNumber = parseFloat(amount || '0');
    const isInvalid = amount !== '' && (amountNumber <= 0 || amountNumber > maxAdd);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isInvalid) return;
            await onConfirm(parseFloat(amount));
            onClose();
            setAmount('');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!goal) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Add Funds to ${goal.title}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-1 text-gray-600">
                        <span>Current: €{goal.savedAmount}</span>
                        <span>Target: €{goal.targetAmount}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-4">
                        <div
                            className="bg-blue-500 h-full transition-all"
                            style={{ width: `${(goal.savedAmount / goal.targetAmount) * 100}%` }}
                        />
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Add (€)</label>
                    <Input
                        type="number"
                        required
                        autoFocus
                        min={0}
                        max={maxAdd}
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                    />
                    {isInvalid && (
                        <p className="text-xs text-red-600 mt-1">Enter an amount between 0 and €{maxAdd.toLocaleString()}.</p>
                    )}
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" disabled={loading || isInvalid}>{loading ? 'Adding...' : 'Add Funds'}</Button>
                </div>
            </form>
        </Modal>
    );
}
