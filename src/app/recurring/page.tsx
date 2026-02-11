"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { RecurringTransaction } from '@/types/recurring';
import { RecurringFormInput, RecurringTransactionModal } from '@/components/modals/RecurringTransactionModal';

function ownerLabel(ownerId: string | null, ownerType: RecurringTransaction['ownerType']) {
    if (ownerType === 'shared') return 'Shared';
    if (ownerId === 'eden') return 'Eden';
    if (ownerId === 'sivan') return 'Sivan';
    return 'Individual';
}

export default function RecurringPage() {
    const {
        recurringTransactions,
        loading,
        stats,
        createRecurring,
        updateRecurring,
        pauseRecurring,
        resumeRecurring,
        deleteRecurring,
        syncAllRecurring,
    } = useRecurringTransactions();

    const [showModal, setShowModal] = useState(false);
    const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
    const [saving, setSaving] = useState(false);
    const [resumeDates, setResumeDates] = useState<Record<string, string>>({});

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (!editId || recurringTransactions.length === 0) return;
        const target = recurringTransactions.find((item) => item.id === editId);
        if (!target) return;
        setEditingRecurring(target);
        setShowModal(true);
    }, [recurringTransactions]);

    const sortedRecurring = useMemo(() => {
        return [...recurringTransactions].sort((a, b) => a.name.localeCompare(b.name));
    }, [recurringTransactions]);

    if (loading) return <div>Loading recurring transactions...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-3xl font-bold text-[#323338]">Recurring Manager</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Edit recurring series safely. Main transactions are generated from these entries.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        onClick={async () => {
                            setSaving(true);
                            try {
                                await syncAllRecurring();
                            } finally {
                                setSaving(false);
                            }
                        }}
                        disabled={saving}
                    >
                        {saving ? 'Syncing...' : 'Sync'}
                    </Button>
                    <Button
                        onClick={() => {
                            setEditingRecurring(null);
                            setShowModal(true);
                        }}
                    >
                        New Recurring
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><span className="text-sm text-gray-500">Total Series</span></CardHeader>
                    <CardContent><span className="text-2xl font-bold">{stats.total}</span></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><span className="text-sm text-gray-500">Active</span></CardHeader>
                    <CardContent><span className="text-2xl font-bold text-green-600">{stats.active}</span></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><span className="text-sm text-gray-500">Paused</span></CardHeader>
                    <CardContent><span className="text-2xl font-bold text-amber-600">{stats.paused}</span></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><span className="text-sm text-gray-500">Monthly</span></CardHeader>
                    <CardContent><span className="text-2xl font-bold text-[#0073ea]">{stats.monthly}</span></CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-sm">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Start</th>
                                    <th className="p-4">End</th>
                                    <th className="p-4">Frequency</th>
                                    <th className="p-4">Owner</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Amount</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedRecurring.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-gray-400">
                                            No recurring entries yet. Create one or run migration from Settings.
                                        </td>
                                    </tr>
                                ) : sortedRecurring.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium">{item.name}</td>
                                        <td className="p-3 capitalize">{item.type}</td>
                                        <td className="p-3 whitespace-nowrap">{item.startDate}</td>
                                        <td className="p-3 whitespace-nowrap">{item.endDate ?? '—'}</td>
                                        <td className="p-3 capitalize">{item.frequency.replace('-', ' ')}</td>
                                        <td className="p-3">{ownerLabel(item.ownerId, item.ownerType)}</td>
                                        <td className="p-3">
                                            {item.status === 'active' ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                                            ) : (
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Paused</span>
                                            )}
                                        </td>
                                        <td className={`p-3 text-right font-medium whitespace-nowrap ${item.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                                            {item.type === 'income' ? '+' : '-'}€{item.amount.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-100"
                                                    onClick={() => {
                                                        setEditingRecurring(item);
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                {item.status === 'active' ? (
                                                    <button
                                                        className="text-xs px-2 py-1 rounded-md border border-amber-200 text-amber-700 hover:bg-amber-50"
                                                        onClick={async () => {
                                                            const confirmed = window.confirm('Pause this recurring entry and remove future generated transactions?');
                                                            if (!confirmed) return;
                                                            await pauseRecurring(item.id);
                                                        }}
                                                    >
                                                        Pause
                                                    </button>
                                                ) : (
                                                    <>
                                                        <input
                                                            type="date"
                                                            className="h-7 px-2 text-xs border border-gray-300 rounded-md"
                                                            value={resumeDates[item.id] ?? new Date().toISOString().split('T')[0]}
                                                            onChange={(event) => {
                                                                const value = event.target.value;
                                                                setResumeDates((prev) => ({ ...prev, [item.id]: value }));
                                                            }}
                                                        />
                                                        <button
                                                            className="text-xs px-2 py-1 rounded-md border border-green-200 text-green-700 hover:bg-green-50"
                                                            onClick={async () => {
                                                                const resumeDate = resumeDates[item.id] ?? new Date().toISOString().split('T')[0];
                                                                await resumeRecurring(item.id, resumeDate);
                                                            }}
                                                        >
                                                            Continue
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={async () => {
                                                        const confirmed = window.confirm('Delete this recurring series and all its generated transactions?');
                                                        if (!confirmed) return;
                                                        await deleteRecurring(item.id);
                                                    }}
                                                >
                                                    Delete Series
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <RecurringTransactionModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingRecurring(null);
                }}
                initialRecurring={editingRecurring}
                onSave={async (payload: RecurringFormInput, id?: string) => {
                    if (id) {
                        await updateRecurring(id, payload);
                        return;
                    }
                    await createRecurring(payload);
                }}
            />
        </div>
    );
}
