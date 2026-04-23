"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Transaction } from "@/types/transactions";
import { EditTransactionModal } from "@/components/modals/EditTransactionModal";
import { resolveCategoryForTransaction } from "@/lib/transactionHelpers";
import { getCategoryColor, getCategoryIcon } from "@/lib/categoryIcons";
import { TransactionCardMobile } from "@/components/transactions/TransactionCardMobile";
import { useRouter } from "next/navigation";

type SortField = 'date' | 'name' | 'categoryName' | 'ownerType' | 'amount';
type SortDirection = 'asc' | 'desc';

interface SortIconProps {
    field: SortField;
    activeField: SortField;
    direction: SortDirection;
}

function SortIcon({ field, activeField, direction }: SortIconProps) {
    if (activeField !== field) return null;
    return direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
}

function getCreatedAtSeconds(value: unknown): number {
    if (value && typeof value === 'object' && 'seconds' in value) {
        const seconds = (value as { seconds?: unknown }).seconds;
        if (typeof seconds === 'number') return seconds;
    }
    return 0;
}

export default function TransactionsPage() {
    const router = useRouter();
    const { transactions, loading, updateTransaction, deleteTransaction } = useTransactions();
    const today = useMemo(() => new Date(), []);
    
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    const getResolvedCategory = (tx: Transaction) => resolveCategoryForTransaction({
        type: tx.type,
        categoryId: tx.categoryId,
        categoryName: tx.categoryName,
    });
    const getCategoryLabel = (tx: Transaction) => getResolvedCategory(tx).name;

    const handleDelete = (tx: Transaction) => {
        const confirmDelete = window.confirm(
            tx.recurrenceId
                ? "Delete this recurring occurrence for this month only?"
                : "Delete this transaction?",
        );
        if (confirmDelete) deleteTransaction(tx.id);
    };

    const handleEditInManager = (recurrenceId: string) =>
        router.push(`/recurring?edit=${recurrenceId}`);

    // Filter transactions up to current date only (for balance calculation)
    const currentDateStr = today.toISOString().split('T')[0];
    const pastTransactions = transactions.filter(t => t.date <= currentDateStr);
    
    const totalIncome = pastTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = pastTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const net = totalIncome - totalExpense;
    
    // Filter by selected month
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
        });
    }, [transactions, selectedMonth, selectedYear]);
    
    // Sort transactions
    const sortedTransactions = useMemo(() => {
        const getValue = (tx: Transaction, field: SortField): string | number => {
            switch (field) {
                case 'amount':
                    return tx.amount;
                case 'categoryName':
                    return getCategoryLabel(tx);
                default:
                    return tx[field] ?? '';
            }
        };

        return [...filteredTransactions].sort((a, b) => {
            if (sortField === 'date') {
                if (a.date === b.date) {
                    const aCreated = getCreatedAtSeconds(a.createdAt);
                    const bCreated = getCreatedAtSeconds(b.createdAt);
                    return sortDirection === 'asc' ? aCreated - bCreated : bCreated - aCreated;
                }
            }
            const aVal = getValue(a, sortField);
            const bVal = getValue(b, sortField);

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredTransactions, sortField, sortDirection]);
    
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const groupByDate = sortField === 'date';

    const groupedTransactions = useMemo(() => {
        if (!groupByDate) return [] as Array<{ date: string; items: Transaction[] }>;
        const groups = new Map<string, Transaction[]>();
        for (const tx of sortedTransactions) {
            const key = tx.date;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(tx);
        }
        return Array.from(groups.entries()).map(([date, items]) => ({ date, items }));
    }, [groupByDate, sortedTransactions]);

    const renderDesktopRow = (tx: Transaction) => {
        const resolved = getResolvedCategory(tx);
        const Icon = getCategoryIcon(resolved.id);
        const color = getCategoryColor(resolved.id);
        return (
            <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 text-gray-600 whitespace-nowrap">{tx.date}</td>
                <td className="p-3 font-medium break-words">{tx.name}</td>
                <td className="p-3">
                    <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: `${color}1A`, color }}
                    >
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                        {resolved.name}
                    </span>
                </td>
                <td className="p-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {tx.ownerType === 'shared' ? 'Shared' : 'Individual'}
                    </span>
                </td>
                <td className={cn("p-3 text-right font-medium text-sm sm:text-base whitespace-nowrap", tx.type === 'income' ? "text-green-600" : "text-gray-900")}>
                    {tx.type === 'income' ? '+' : '-'}€{tx.amount.toLocaleString()}
                </td>
                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    {tx.recurrenceId ? (
                        <button
                            className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-100"
                            onClick={() => handleEditInManager(tx.recurrenceId!)}
                        >
                            Edit in Manager
                        </button>
                    ) : (
                        <button
                            className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-100"
                            onClick={() => setEditingTx(tx)}
                        >
                            Edit
                        </button>
                    )}
                    <button
                        className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(tx)}
                    >
                        Delete
                    </button>
                </td>
            </tr>
        );
    };

    const formatDateHeader = (iso: string) => {
        const d = new Date(iso + 'T00:00:00');
        if (Number.isNaN(d.getTime())) return iso;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);
        const dateLabel = d.toLocaleDateString('en-IE', { weekday: 'short', month: 'short', day: 'numeric' });
        if (diffDays === 0) return `TODAY, ${dateLabel.toUpperCase()}`;
        if (diffDays === 1) return `YESTERDAY, ${dateLabel.toUpperCase()}`;
        return dateLabel.toUpperCase();
    };
    
    // Generate month options (last 12 months + next 12 months)
    const monthOptions = useMemo(() => {
        const options = [];
        for (let i = -12; i <= 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            options.push({
                month: date.getMonth(),
                year: date.getFullYear(),
                label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            });
        }
        return options;
    }, [today]);

    if (loading) return <div>Loading transactions...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-[#323338]">Transactions</h2>
            </div>
            
            {/* Month Selector */}
            <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Viewing:</label>
                <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={`${selectedYear}-${selectedMonth}`}
                    onChange={(e) => {
                        const [year, month] = e.target.value.split('-').map(Number);
                        setSelectedYear(year);
                        setSelectedMonth(month);
                    }}
                >
                    {monthOptions.map(opt => (
                        <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <span className="text-sm text-gray-500">
                    ({sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''})
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2"><span className="text-sm text-gray-500">Total Expenses</span></CardHeader>
                    <CardContent><span className="text-2xl font-bold">€{totalExpense.toLocaleString()}</span></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><span className="text-sm text-gray-500">Total Income</span></CardHeader>
                    <CardContent><span className="text-2xl font-bold text-green-600">€{totalIncome.toLocaleString()}</span></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><span className="text-sm text-gray-500">Net Balance</span></CardHeader>
                    <CardContent><span className="text-2xl font-bold text-[#0073ea]">€{net.toLocaleString()}</span></CardContent>
                </Card>
            </div>

            <Card className="hidden md:block">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="p-4 rounded-tl-xl cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date')}>
                                    <div className="flex items-center gap-1">
                                        Date <SortIcon field="date" activeField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">
                                        Name <SortIcon field="name" activeField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('categoryName')}>
                                    <div className="flex items-center gap-1">
                                        Category <SortIcon field="categoryName" activeField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('ownerType')}>
                                    <div className="flex items-center gap-1">
                                        Owner <SortIcon field="ownerType" activeField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="p-4 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>
                                    <div className="flex items-center justify-end gap-1">
                                        Amount <SortIcon field="amount" activeField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="p-4 text-right rounded-tr-xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedTransactions.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No transactions this month. Add one!</td></tr>
                            ) : groupByDate ? (
                                groupedTransactions.flatMap((group) => [
                                    <tr key={`h-${group.date}`} className="bg-gray-50">
                                        <td colSpan={6} className="px-4 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                            {formatDateHeader(group.date)}
                                        </td>
                                    </tr>,
                                    ...group.items.map(tx => renderDesktopRow(tx)),
                                ])
                            ) : (
                                sortedTransactions.map(tx => renderDesktopRow(tx))
                            )}
                        </tbody>
                    </table>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile view: sort control + card list */}
            <div className="md:hidden space-y-3">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
                    <select
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as SortField)}
                    >
                        <option value="date">Date</option>
                        <option value="name">Name</option>
                        <option value="categoryName">Category</option>
                        <option value="ownerType">Owner</option>
                        <option value="amount">Amount</option>
                    </select>
                    <button
                        type="button"
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                        aria-label={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}
                    >
                        {sortDirection === 'asc' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>

                {sortedTransactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 bg-white border border-gray-200 rounded-xl">
                        No transactions this month. Add one!
                    </div>
                ) : groupByDate ? (
                    <div className="space-y-5">
                        {groupedTransactions.map((group) => (
                            <div key={group.date} className="space-y-1.5">
                                <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase px-1">
                                    {formatDateHeader(group.date)}
                                </h3>
                                {group.items.map((tx) => (
                                    <TransactionCardMobile
                                        key={tx.id}
                                        transaction={tx}
                                        onEdit={setEditingTx}
                                        onDelete={handleDelete}
                                        onEditInManager={handleEditInManager}
                                        hideDate
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedTransactions.map((tx) => (
                            <TransactionCardMobile
                                key={tx.id}
                                transaction={tx}
                                onEdit={setEditingTx}
                                onDelete={handleDelete}
                                onEditInManager={handleEditInManager}
                            />
                        ))}
                    </div>
                )}
            </div>

            <EditTransactionModal
                isOpen={!!editingTx}
                transaction={editingTx}
                onClose={() => setEditingTx(null)}
                onSave={async (id, tx) => {
                    await updateTransaction(id, tx);
                }}
            />
        </div>
    );
}
