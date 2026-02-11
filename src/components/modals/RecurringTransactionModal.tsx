"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CATEGORIES } from '@/lib/constants';
import { RecurringFrequency, RecurringTransaction } from '@/types/recurring';
import { resolveCategoryForTransaction } from '@/lib/transactionHelpers';
import { Transaction } from '@/types/transactions';

type RecurringFormInput = {
    name: string;
    amount: number;
    type: Transaction['type'];
    categoryId: string;
    categoryName?: string;
    ownerId: string | null;
    ownerType: Transaction['ownerType'];
    frequency: RecurringFrequency;
    startDate: string;
    endDate?: string | null;
};

interface RecurringTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: RecurringFormInput, id?: string) => Promise<void>;
    initialRecurring?: RecurringTransaction | null;
}

const OWNER_OPTIONS = [
    { label: 'Shared', ownerId: 'shared', ownerType: 'shared' as const },
    { label: 'Eden', ownerId: 'eden', ownerType: 'individual' as const },
    { label: 'Sivan', ownerId: 'sivan', ownerType: 'individual' as const },
];

const FREQUENCY_OPTIONS: RecurringFrequency[] = ['daily', 'weekly', 'bi-weekly', 'monthly'];

export function RecurringTransactionModal({
    isOpen,
    onClose,
    onSave,
    initialRecurring,
}: RecurringTransactionModalProps) {
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(() => {
        const type = initialRecurring?.type ?? 'expense';
        const category = resolveCategoryForTransaction({
            type,
            categoryId: initialRecurring?.categoryId,
            categoryName: initialRecurring?.categoryName,
        });

        return {
            name: initialRecurring?.name ?? '',
            amount: initialRecurring ? String(initialRecurring.amount) : '',
            type,
            categoryId: category.id,
            ownerId: initialRecurring?.ownerId ?? 'shared',
            ownerType: initialRecurring?.ownerType ?? 'shared',
            frequency: initialRecurring?.frequency ?? 'monthly',
            startDate: initialRecurring?.startDate ?? today,
            endDate: initialRecurring?.endDate ?? '',
        };
    });

    useEffect(() => {
        if (!isOpen) return;
        const type = initialRecurring?.type ?? 'expense';
        const category = resolveCategoryForTransaction({
            type,
            categoryId: initialRecurring?.categoryId,
            categoryName: initialRecurring?.categoryName,
        });
        setForm({
            name: initialRecurring?.name ?? '',
            amount: initialRecurring ? String(initialRecurring.amount) : '',
            type,
            categoryId: category.id,
            ownerId: initialRecurring?.ownerId ?? 'shared',
            ownerType: initialRecurring?.ownerType ?? 'shared',
            frequency: initialRecurring?.frequency ?? 'monthly',
            startDate: initialRecurring?.startDate ?? today,
            endDate: initialRecurring?.endDate ?? '',
        });
    }, [initialRecurring, isOpen, today]);

    const filteredCategories = useMemo(
        () => CATEGORIES.filter((category) => category.type === form.type),
        [form.type],
    );

    useEffect(() => {
        const category = CATEGORIES.find((item) => item.id === form.categoryId);
        if (category?.type === form.type) return;
        const fallback = resolveCategoryForTransaction({ type: form.type, categoryId: form.categoryId });
        setForm((prev) => ({ ...prev, categoryId: fallback.id }));
    }, [form.categoryId, form.type]);

    const selectedOwner = useMemo(() => {
        return OWNER_OPTIONS.find((owner) => owner.ownerId === form.ownerId && owner.ownerType === form.ownerType) ?? OWNER_OPTIONS[0];
    }, [form.ownerId, form.ownerType]);

    const hasInvalidAmount = Number(form.amount) <= 0;
    const hasInvalidName = form.name.trim().length === 0;
    const hasInvalidDate = !form.startDate;
    const hasInvalidEndDate = Boolean(form.endDate && form.endDate < form.startDate);
    const disableSave = hasInvalidAmount || hasInvalidName || hasInvalidDate || hasInvalidEndDate || submitting;

    const handleSave = async () => {
        if (disableSave) return;
        setSubmitting(true);
        try {
            const category = resolveCategoryForTransaction({
                type: form.type,
                categoryId: form.categoryId,
            });

            await onSave({
                name: form.name.trim(),
                amount: Number(form.amount),
                type: form.type,
                categoryId: category.id,
                categoryName: category.name,
                ownerId: form.ownerId,
                ownerType: form.ownerType,
                frequency: form.frequency,
                startDate: form.startDate,
                endDate: form.endDate ? form.endDate : null,
            }, initialRecurring?.id);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialRecurring ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}
            headerVariant="close-only"
        >
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <Input
                        value={form.name}
                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Netflix"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Type</label>
                        <select
                            className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
                            value={form.type}
                            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Transaction['type'] }))}
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Amount</label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={form.amount}
                            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <select
                            className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
                            value={form.categoryId}
                            onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                        >
                            {filteredCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Owner</label>
                        <select
                            className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
                            value={`${selectedOwner.ownerId}:${selectedOwner.ownerType}`}
                            onChange={(event) => {
                                const [ownerId, ownerType] = event.target.value.split(':');
                                setForm((prev) => ({
                                    ...prev,
                                    ownerId,
                                    ownerType: ownerType as Transaction['ownerType'],
                                }));
                            }}
                        >
                            {OWNER_OPTIONS.map((owner) => (
                                <option key={`${owner.ownerId}:${owner.ownerType}`} value={`${owner.ownerId}:${owner.ownerType}`}>
                                    {owner.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Frequency</label>
                        <select
                            className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
                            value={form.frequency}
                            onChange={(event) => setForm((prev) => ({ ...prev, frequency: event.target.value as RecurringFrequency }))}
                        >
                            {FREQUENCY_OPTIONS.map((frequency) => (
                                <option key={frequency} value={frequency}>
                                    {frequency.replace('-', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <Input
                            type="date"
                            value={form.startDate}
                            onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">End Date (optional)</label>
                        <Input
                            type="date"
                            value={form.endDate}
                            onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                        />
                    </div>
                </div>

                {hasInvalidEndDate && (
                    <p className="text-xs text-red-600">End date must be on or after start date.</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={disableSave}>
                        {submitting ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export type { RecurringFormInput };
