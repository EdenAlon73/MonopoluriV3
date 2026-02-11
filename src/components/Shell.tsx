"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Wallet, Target, BarChart3, Sparkles, Settings, AlertTriangle, CheckCircle2, X, Download } from 'lucide-react'; // Icons
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useGoals } from '@/hooks/useGoals';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/Button';
import { Dock } from '@/components/ui/dock-two';
import FloatingActionMenu from '@/components/ui/floating-action-menu';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { AddGoalModal } from '@/components/modals/AddGoalModal';
import { Modal } from '@/components/ui/Modal';
import { User } from '@/contexts/UserContext';
import { Transaction } from '@/types/transactions';

type DockItem = {
    icon: typeof Wallet;
    label: string;
    onClick?: () => void;
    className?: string;
    active?: boolean;
};

type ExportMode = 'month' | 'range';
type ExportScope = 'transactions' | 'expenses';

function toOwnerLabel(tx: Transaction) {
    return tx.ownerType === 'shared' ? 'Shared' : 'Individual';
}

function escapeCsvValue(value: string | number) {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function ProfileMenu({ currentUser, onLogout }: { currentUser: User; onLogout: () => Promise<void> }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-center sm:justify-start gap-0 sm:gap-2 bg-white border border-[#e3e6f0] rounded-full px-2 sm:pl-1 sm:pr-3 py-1 shadow-sm hover:shadow transition min-h-[42px]"
            >
                {currentUser.photoURL ? (
                    <Image
                        src={currentUser.photoURL}
                        alt="User"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                ) : (
                    <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: currentUser.color }}
                    ></div>
                )}
                <span className="text-sm font-medium truncate max-w-[80px] hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
            </button>
            {open && (
                <div className="absolute right-0 mt-2 bg-white border border-[#e3e6f0] rounded-lg shadow-lg py-2 w-36 z-50">
                    <button
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}

export function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, login, logout, loading: userLoading } = useUser();
    const { transactions, loading: transactionsLoading, addTransaction } = useTransactions();
    const { addGoal } = useGoals();
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);
    const [navMounted, setNavMounted] = useState(false);
    const [includeGoals, setIncludeGoals] = useState(false);
    const [exportScope, setExportScope] = useState<ExportScope>('transactions');
    const [exportMode, setExportMode] = useState<ExportMode>('month');
    const [selectedExportMonth, setSelectedExportMonth] = useState('');
    const [rangeStartDate, setRangeStartDate] = useState('');
    const [rangeEndDate, setRangeEndDate] = useState('');
    const [showTxModal, setShowTxModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const isAuthPage = pathname.startsWith('/auth');
    const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
    const defaultStartISO = useMemo(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        // Avoid hydration mismatches for the floating dock
        setNavMounted(true);
    }, []);

    useEffect(() => {
        if (userLoading) return;

        // Send unauthenticated users to the auth page
        if (!currentUser && !isAuthPage) {
            router.replace('/auth');
        }

        // If already signed in and on the auth page, go to transactions
        if (currentUser && isAuthPage) {
            router.replace('/transactions');
        }
    }, [currentUser, isAuthPage, router, userLoading]);

    const exportableTransactions = useMemo(() => {
        const scoped = exportScope === 'expenses'
            ? transactions.filter((tx) => tx.type === 'expense')
            : transactions;
        return scoped.filter((tx) => Boolean(tx.date));
    }, [transactions, exportScope]);

    const exportMonthOptions = useMemo(() => {
        const months = new Map<string, { value: string; label: string; count: number }>();
        exportableTransactions.forEach((tx) => {
            const [year, month] = tx.date.split('-');
            if (!year || !month) return;
            const value = `${year}-${month}`;
            if (!months.has(value)) {
                const monthDate = new Date(Number(year), Number(month) - 1, 1);
                months.set(value, {
                    value,
                    label: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    count: 0,
                });
            }
            const entry = months.get(value);
            if (entry) entry.count += 1;
        });

        return Array.from(months.values()).sort((a, b) => b.value.localeCompare(a.value));
    }, [exportableTransactions]);

    useEffect(() => {
        if (!showSettingsModal) return;

        if (exportMonthOptions.length === 0) {
            setSelectedExportMonth('');
        } else if (!exportMonthOptions.some((month) => month.value === selectedExportMonth)) {
            setSelectedExportMonth(exportMonthOptions[0].value);
        }

        if (!rangeStartDate) setRangeStartDate(defaultStartISO);
        if (!rangeEndDate) setRangeEndDate(todayISO);
    }, [showSettingsModal, exportMonthOptions, selectedExportMonth, rangeStartDate, rangeEndDate, defaultStartISO, todayISO]);

    useEffect(() => {
        if (rangeStartDate && rangeEndDate && rangeEndDate < rangeStartDate) {
            setRangeEndDate(rangeStartDate);
        }
    }, [rangeStartDate, rangeEndDate]);

    const exportRows = useMemo(() => {
        let filtered = exportableTransactions;

        if (exportMode === 'month') {
            if (!selectedExportMonth) return [];
            filtered = filtered.filter((tx) => tx.date.startsWith(`${selectedExportMonth}-`));
        } else {
            if (!rangeStartDate || !rangeEndDate) return [];
            filtered = filtered.filter((tx) => tx.date >= rangeStartDate && tx.date <= rangeEndDate);
        }

        return [...filtered].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            const aCreated = a.createdAt?.seconds ?? 0;
            const bCreated = b.createdAt?.seconds ?? 0;
            return aCreated - bCreated;
        });
    }, [exportableTransactions, exportMode, selectedExportMonth, rangeStartDate, rangeEndDate]);

    const runDeleteAll = async () => {
        if (!currentUser) return;
        setDeleting(true);
        try {
            // Dynamic import to avoid SSR issues
            const { db } = await import('@/lib/firebase');
            const { collection, query, getDocs, writeBatch } = await import('firebase/firestore');
            
            const q = query(collection(db, 'transactions'));
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            if (includeGoals) {
                const goalsSnapshot = await getDocs(query(collection(db, 'goals')));
                goalsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            }
            
            await batch.commit();
            setToast({ variant: 'success', message: includeGoals ? 'Transactions and goals deleted successfully' : 'All transactions deleted successfully' });
        } catch (err) {
            console.error(err);
            setToast({ variant: 'error', message: 'Error deleting transactions' });
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!currentUser) {
            setToast({ variant: 'error', message: 'Please sign in first' });
            return;
        }

        const confirmText = includeGoals
            ? 'Delete all transactions and goals? This cannot be undone.'
            : 'Delete all transactions? This cannot be undone.';

        if (!window.confirm(confirmText)) return;
        await runDeleteAll();
    };

    const handleExportCsv = () => {
        if (!currentUser) {
            setToast({ variant: 'error', message: 'Please sign in first' });
            return;
        }
        if (exportRows.length === 0) {
            setToast({ variant: 'error', message: 'No data found for this export selection' });
            return;
        }

        const headers = ['Date', 'Name', 'Category', 'Owner', 'Amount'];
        const rows = exportRows.map((tx) => {
            const amount = `${tx.type === 'income' ? '+' : '-'}€${tx.amount.toLocaleString()}`;
            return [
                tx.date,
                tx.name,
                tx.categoryName || tx.categoryId || 'Uncategorized',
                toOwnerLabel(tx),
                amount,
            ];
        });

        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => escapeCsvValue(cell)).join(','))
            .join('\n');

        const rangeLabel = exportMode === 'month'
            ? selectedExportMonth
            : `${rangeStartDate}_to_${rangeEndDate}`;
        const scopeLabel = exportScope === 'expenses' ? 'expenses' : 'transactions';
        const fileName = `monopoluri-${scopeLabel}-${rangeLabel || 'export'}.csv`;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setToast({ variant: 'success', message: `Exported ${exportRows.length} row${exportRows.length === 1 ? '' : 's'} to CSV` });
    };

    const navItems = useMemo(() => [
        { icon: Wallet, label: 'Transactions', href: '/transactions' },
        { icon: Target, label: 'Goals', href: '/goals' },
        { icon: BarChart3, label: 'Analytics', href: '/analytics' },
        { icon: Sparkles, label: 'AI Insights', href: '/ai-insights' },
    ], []);

    const isFabRoute = pathname.startsWith('/transactions') || pathname.startsWith('/goals');

    const dockItems: DockItem[] = [
        ...navItems.map(item => ({
            icon: item.icon,
            label: item.label,
            active: pathname === item.href,
            onClick: () => router.push(item.href),
        })),
        {
            icon: Settings,
            label: 'Settings',
            onClick: () => setShowSettingsModal(true),
            active: false,
            className: cn(!currentUser && "opacity-60 cursor-not-allowed"),
        }
    ];

    if (isAuthPage) {
        return (
            <div className="min-h-screen bg-[#f5f6f8] text-[#323338] flex flex-col">
                <main className="flex-1 flex items-center justify-center px-4 py-10">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-[#f5f6f8] text-[#323338] flex flex-col">
                <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-20 bg-[#f5f6f8]/80 backdrop-blur">
                    <div
                        className="flex items-center gap-2 cursor-pointer select-none"
                        onClick={() => router.push('/transactions')}
                    >
                        <span className="text-xl font-bold font-sans">Monopoluri<span className="text-[#0073ea]">V3</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        {currentUser ? (
                            <ProfileMenu currentUser={currentUser} onLogout={logout} />
                        ) : (
                            <Button size="sm" onClick={login}>Sign In</Button>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-auto px-4 sm:px-6 pb-28 pt-2 font-sans">
                    {children}
                </main>

                {navMounted && (
                    <Dock
                        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] sm:w-auto"
                        items={dockItems}
                    />
                )}

                {isFabRoute && (
                    <FloatingActionMenu
                        options={[
                            {
                                label: 'Transaction',
                                onClick: () => setShowTxModal(true),
                            },
                            {
                                label: 'Goal',
                                onClick: () => setShowGoalModal(true),
                            },
                        ]}
                    />
                )}
            </div>

            <Modal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                title="Settings"
            >
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900">Export</h4>
                            <p className="text-xs text-gray-500">Download a CSV with Date, Name, Category, Owner, and Amount.</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-600">Data</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setExportScope('transactions')}
                                    className={cn(
                                        "h-9 rounded-md border text-sm font-medium transition-colors",
                                        exportScope === 'transactions'
                                            ? "border-[#0073ea] bg-[#e6f0ff] text-[#0073ea]"
                                            : "border-gray-300 hover:bg-gray-50"
                                    )}
                                >
                                    Transactions
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExportScope('expenses')}
                                    className={cn(
                                        "h-9 rounded-md border text-sm font-medium transition-colors",
                                        exportScope === 'expenses'
                                            ? "border-[#0073ea] bg-[#e6f0ff] text-[#0073ea]"
                                            : "border-gray-300 hover:bg-gray-50"
                                    )}
                                >
                                    Expenses
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-600">Range Type</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setExportMode('month')}
                                    className={cn(
                                        "h-9 rounded-md border text-sm font-medium transition-colors",
                                        exportMode === 'month'
                                            ? "border-[#0073ea] bg-[#e6f0ff] text-[#0073ea]"
                                            : "border-gray-300 hover:bg-gray-50"
                                    )}
                                >
                                    Month
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExportMode('range')}
                                    className={cn(
                                        "h-9 rounded-md border text-sm font-medium transition-colors",
                                        exportMode === 'range'
                                            ? "border-[#0073ea] bg-[#e6f0ff] text-[#0073ea]"
                                            : "border-gray-300 hover:bg-gray-50"
                                    )}
                                >
                                    Date Range
                                </button>
                            </div>
                        </div>

                        {transactionsLoading ? (
                            <div className="text-sm text-gray-500">Loading data…</div>
                        ) : exportScope === 'expenses' && exportableTransactions.length === 0 ? (
                            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                No expense data available yet.
                            </div>
                        ) : exportMode === 'month' ? (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">Month</label>
                                <select
                                    className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea]"
                                    value={selectedExportMonth}
                                    onChange={(e) => setSelectedExportMonth(e.target.value)}
                                    disabled={exportMonthOptions.length === 0}
                                >
                                    {exportMonthOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label} ({option.count})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-600">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea]"
                                        value={rangeStartDate}
                                        onChange={(e) => setRangeStartDate(e.target.value)}
                                        max={rangeEndDate || undefined}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-600">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea]"
                                        value={rangeEndDate}
                                        onChange={(e) => setRangeEndDate(e.target.value)}
                                        min={rangeStartDate || undefined}
                                    />
                                </div>
                            </div>
                        )}

                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={handleExportCsv}
                            disabled={transactionsLoading || (exportMode === 'month' ? !selectedExportMonth : !rangeStartDate || !rangeEndDate)}
                        >
                            <Download size={16} className="mr-2" />
                            Export CSV
                        </Button>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                        <div>
                            <h4 className="text-sm font-semibold text-red-700">Danger Zone</h4>
                            <p className="text-xs text-gray-500">Delete all transactions, optionally including goals.</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={includeGoals}
                                onChange={(e) => setIncludeGoals(e.target.checked)}
                                className="h-4 w-4 accent-[#0073ea]"
                            />
                            Also delete goals
                        </label>
                        <Button
                            variant="danger"
                            className="w-full"
                            onClick={handleDeleteAll}
                            disabled={deleting || !currentUser}
                        >
                            {deleting ? 'Deleting…' : 'Delete all data'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {toast && (
                <div className="fixed bottom-6 right-6 z-[200] space-y-3 w-[400px] max-w-[calc(100%-2rem)]" aria-live="polite">
                    <Alert
                        variant={toast.variant === 'success' ? 'success' : 'error'}
                        isNotification
                        size="lg"
                        layout="row"
                        icon={toast.variant === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                        action={
                            <button onClick={() => setToast(null)} className="text-gray-500 hover:text-gray-800">
                                <X size={16} />
                            </button>
                        }
                    >
                        <div>
                            <AlertTitle className="mb-1">{toast.variant === 'success' ? 'Done' : 'Something went wrong'}</AlertTitle>
                            <AlertDescription>{toast.message}</AlertDescription>
                        </div>
                    </Alert>
                </div>
            )}

            <AddTransactionModal
                isOpen={showTxModal}
                onClose={() => setShowTxModal(false)}
                onSave={async (tx) => {
                    await addTransaction(tx);
                    setShowTxModal(false);
                    router.push('/transactions');
                }}
            />
            <AddGoalModal
                isOpen={showGoalModal}
                onClose={() => setShowGoalModal(false)}
                onSave={async (goal) => {
                    await addGoal(goal);
                    setShowGoalModal(false);
                    router.push('/goals');
                }}
            />
        </>
    );
}
