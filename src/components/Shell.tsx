"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Wallet, Target, BarChart3, Sparkles, Settings, AlertTriangle, CheckCircle2, X, Download, Upload } from 'lucide-react'; // Icons
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
import { CATEGORIES } from '@/lib/constants';
import { User } from '@/contexts/UserContext';
import { Transaction } from '@/types/transactions';
import { previewLegacyRecurringMigration, RecurringMigrationPreview, runLegacyRecurringMigration } from '@/lib/recurringMigration';

type DockItem = {
    icon: typeof Wallet;
    label: string;
    onClick?: () => void;
    className?: string;
    active?: boolean;
};

type ExportMode = 'month' | 'range';
type ExportScope = 'transactions' | 'expenses';
type DeleteMode = 'all' | 'month' | 'range';

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

function parseCsv(text: string) {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (insideQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    currentField += '"';
                    i++;
                } else {
                    insideQuotes = false;
                }
            } else {
                currentField += ch;
            }
            continue;
        }

        if (ch === '"') {
            insideQuotes = true;
            continue;
        }

        if (ch === ',') {
            currentRow.push(currentField.trim());
            currentField = '';
            continue;
        }

        if (ch === '\n') {
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
            continue;
        }

        if (ch !== '\r') {
            currentField += ch;
        }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    return rows.filter((row) => row.some((cell) => cell.trim().length > 0));
}

function normalizeHeader(header: string) {
    return header.toLowerCase().replace(/[\s_\-]/g, '');
}

function toIsoDate(dateValue: string) {
    const value = dateValue.trim();
    if (!value) return null;

    const yyyyMmDdMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyyMmDdMatch) {
        const year = Number(yyyyMmDdMatch[1]);
        const month = Number(yyyyMmDdMatch[2]);
        const day = Number(yyyyMmDdMatch[3]);
        const candidate = new Date(year, month - 1, day);
        if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null;
        return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
        const month = Number(slashMatch[1]);
        const day = Number(slashMatch[2]);
        const year = Number(slashMatch[3]);
        const candidate = new Date(year, month - 1, day);
        if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null;
        return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    const year = parsed.getFullYear();
    const month = parsed.getMonth() + 1;
    const day = parsed.getDate();
    return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function parseAmount(rawAmount: string) {
    const value = rawAmount.trim();
    if (!value) return null;

    const isNegative = /^\s*-/.test(value) || /^\s*\(.*\)\s*$/.test(value);
    const isPositive = /^\s*\+/.test(value);

    let numeric = value
        .replace(/[€$£₪]/g, '')
        .replace(/[()]/g, '')
        .replace(/\s+/g, '');

    const dotCount = (numeric.match(/\./g) || []).length;
    const commaCount = (numeric.match(/,/g) || []).length;
    if (commaCount > 0 && dotCount === 0) {
        const decimalCommaMatch = numeric.match(/^-?\d+,\d{1,2}$/);
        numeric = decimalCommaMatch ? numeric.replace(',', '.') : numeric.replace(/,/g, '');
    } else {
        numeric = numeric.replace(/,/g, '');
    }

    const parsed = Number.parseFloat(numeric);
    if (Number.isNaN(parsed)) return null;

    return {
        amount: Math.abs(parsed),
        hasSign: isNegative || isPositive,
        typeFromSign: isNegative ? 'expense' as const : isPositive ? 'income' as const : null,
    };
}

function getCreatedAtSeconds(value: unknown): number {
    if (value && typeof value === 'object' && 'seconds' in value) {
        const seconds = (value as { seconds?: unknown }).seconds;
        if (typeof seconds === 'number') return seconds;
    }
    return 0;
}

function parseOwner(ownerRaw: string) {
    const owner = ownerRaw.trim().toLowerCase();
    if (!owner || owner === 'shared' || owner === 'joint' || owner === 'both') {
        return { ownerType: 'shared' as const, ownerId: 'shared' };
    }
    if (owner.includes('eden')) {
        return { ownerType: 'individual' as const, ownerId: 'eden' };
    }
    if (owner.includes('sivan')) {
        return { ownerType: 'individual' as const, ownerId: 'sivan' };
    }
    return { ownerType: 'individual' as const, ownerId: 'individual' };
}

function dateAmountSignature(date: string, amount: number) {
    return `${date}::${Math.round(amount * 100)}`;
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
    const [importing, setImporting] = useState(false);
    const [toast, setToast] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);
    const [navMounted, setNavMounted] = useState(false);
    const [includeGoals, setIncludeGoals] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [skipDuplicateImports, setSkipDuplicateImports] = useState(true);
    const [importInputKey, setImportInputKey] = useState(0);
    const [deleteMode, setDeleteMode] = useState<DeleteMode>('all');
    const [selectedDeleteMonth, setSelectedDeleteMonth] = useState('');
    const [deleteRangeStart, setDeleteRangeStart] = useState('');
    const [deleteRangeEnd, setDeleteRangeEnd] = useState('');
    const [exportScope, setExportScope] = useState<ExportScope>('transactions');
    const [exportMode, setExportMode] = useState<ExportMode>('month');
    const [selectedExportMonth, setSelectedExportMonth] = useState('');
    const [rangeStartDate, setRangeStartDate] = useState('');
    const [rangeEndDate, setRangeEndDate] = useState('');
    const [showTxModal, setShowTxModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [migrationPreview, setMigrationPreview] = useState<RecurringMigrationPreview | null>(null);
    const [migrationPreviewLoading, setMigrationPreviewLoading] = useState(false);
    const [migrationRunning, setMigrationRunning] = useState(false);
    const [migrationConfirmText, setMigrationConfirmText] = useState('');
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

    const transactionMonthOptions = useMemo(() => {
        const months = new Map<string, { value: string; label: string; count: number }>();
        transactions.forEach((tx) => {
            if (!tx.date) return;
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
    }, [transactions]);

    const categoriesByName = useMemo(() => {
        const map = new Map<string, { id: string; name: string; type: 'income' | 'expense' }>();
        CATEGORIES.forEach((category) => {
            const normalizedCategory = {
                id: category.id,
                name: category.name,
                type: category.type === 'income' ? 'income' as const : 'expense' as const,
            };
            map.set(category.name.toLowerCase(), normalizedCategory);
            map.set(category.id.toLowerCase(), normalizedCategory);
        });
        return map;
    }, []);

    useEffect(() => {
        if (!showSettingsModal) return;

        if (exportMonthOptions.length === 0) {
            setSelectedExportMonth('');
        } else if (!exportMonthOptions.some((month) => month.value === selectedExportMonth)) {
            setSelectedExportMonth(exportMonthOptions[0].value);
        }

        if (transactionMonthOptions.length === 0) {
            setSelectedDeleteMonth('');
        } else if (!transactionMonthOptions.some((month) => month.value === selectedDeleteMonth)) {
            setSelectedDeleteMonth(transactionMonthOptions[0].value);
        }

        if (!rangeStartDate) setRangeStartDate(defaultStartISO);
        if (!rangeEndDate) setRangeEndDate(todayISO);
        if (!deleteRangeStart) setDeleteRangeStart(defaultStartISO);
        if (!deleteRangeEnd) setDeleteRangeEnd(todayISO);
    }, [
        showSettingsModal,
        exportMonthOptions,
        selectedExportMonth,
        rangeStartDate,
        rangeEndDate,
        deleteRangeStart,
        deleteRangeEnd,
        transactionMonthOptions,
        selectedDeleteMonth,
        defaultStartISO,
        todayISO,
    ]);

    useEffect(() => {
        if (rangeStartDate && rangeEndDate && rangeEndDate < rangeStartDate) {
            setRangeEndDate(rangeStartDate);
        }
    }, [rangeStartDate, rangeEndDate]);

    useEffect(() => {
        if (deleteRangeStart && deleteRangeEnd && deleteRangeEnd < deleteRangeStart) {
            setDeleteRangeEnd(deleteRangeStart);
        }
    }, [deleteRangeStart, deleteRangeEnd]);

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
            const aCreated = getCreatedAtSeconds(a.createdAt);
            const bCreated = getCreatedAtSeconds(b.createdAt);
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

            const [transactionsSnapshot, recurringSnapshot, recurringExceptionsSnapshot, goalsSnapshot] = await Promise.all([
                getDocs(query(collection(db, 'transactions'))),
                getDocs(query(collection(db, 'recurringTransactions'))),
                getDocs(query(collection(db, 'recurringExceptions'))),
                includeGoals ? getDocs(query(collection(db, 'goals'))) : Promise.resolve(null),
            ]);

            const refsToDelete = [
                ...transactionsSnapshot.docs.map((docSnapshot) => docSnapshot.ref),
                ...recurringSnapshot.docs.map((docSnapshot) => docSnapshot.ref),
                ...recurringExceptionsSnapshot.docs.map((docSnapshot) => docSnapshot.ref),
                ...(goalsSnapshot ? goalsSnapshot.docs.map((docSnapshot) => docSnapshot.ref) : []),
            ];

            let batch = writeBatch(db);
            let ops = 0;
            for (const ref of refsToDelete) {
                batch.delete(ref);
                ops++;
                if (ops >= 450) {
                    await batch.commit();
                    batch = writeBatch(db);
                    ops = 0;
                }
            }
            if (ops > 0) {
                await batch.commit();
            }

            setToast({
                variant: 'success',
                message: includeGoals
                    ? 'Transactions, recurring data, and goals deleted successfully'
                    : 'Transactions and recurring data deleted successfully',
            });
        } catch (err) {
            console.error(err);
            setToast({ variant: 'error', message: 'Error deleting transactions' });
        } finally {
            setDeleting(false);
        }
    };

    const runDeleteTransactionsInRange = async (startDate: string, endDate: string, rangeLabel: string) => {
        if (!currentUser) return;
        setDeleting(true);
        try {
            const { db } = await import('@/lib/firebase');
            const { collection, query, doc, getDocs, writeBatch, serverTimestamp } = await import('firebase/firestore');

            const snapshot = await getDocs(query(collection(db, 'transactions')));
            const docsToDelete = snapshot.docs.filter((docSnapshot) => {
                const txDate = docSnapshot.data().date;
                return typeof txDate === 'string' && txDate >= startDate && txDate <= endDate;
            });

            if (docsToDelete.length === 0) {
                setToast({ variant: 'error', message: `No transactions found in ${rangeLabel}` });
                return;
            }

            let batch = writeBatch(db);
            let ops = 0;

            for (const txDoc of docsToDelete) {
                const txData = txDoc.data() as Record<string, unknown>;
                const recurrenceId = typeof txData.recurrenceId === 'string' ? txData.recurrenceId : '';
                const txDate = typeof txData.date === 'string' ? txData.date : '';
                if (recurrenceId && txDate) {
                    const exceptionRef = doc(db, 'recurringExceptions', `${recurrenceId}_${txDate}_manual`);
                    batch.set(exceptionRef, {
                        recurrenceId,
                        date: txDate,
                        kind: 'manual-delete',
                        createdAt: serverTimestamp(),
                    }, { merge: true });
                    ops++;
                }

                batch.delete(txDoc.ref);
                ops++;

                if (ops >= 450) {
                    await batch.commit();
                    batch = writeBatch(db);
                    ops = 0;
                }
            }

            if (ops > 0) {
                await batch.commit();
            }

            setToast({
                variant: 'success',
                message: `Deleted ${docsToDelete.length} transaction${docsToDelete.length === 1 ? '' : 's'} in ${rangeLabel}`,
            });
        } catch (err) {
            console.error(err);
            setToast({ variant: 'error', message: 'Error deleting transactions in selected range' });
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteData = async () => {
        if (!currentUser) {
            setToast({ variant: 'error', message: 'Please sign in first' });
            return;
        }

        if (deleteMode === 'all') {
            const confirmText = includeGoals
                ? 'Delete all transactions and goals? This cannot be undone.'
                : 'Delete all transactions? This cannot be undone.';
            if (!window.confirm(confirmText)) return;
            await runDeleteAll();
            return;
        }

        if (deleteMode === 'month') {
            if (!selectedDeleteMonth) {
                setToast({ variant: 'error', message: 'Please select a month to delete' });
                return;
            }
            const [yearStr, monthStr] = selectedDeleteMonth.split('-');
            const year = Number(yearStr);
            const month = Number(monthStr);
            if (!yearStr || !monthStr || Number.isNaN(year) || Number.isNaN(month)) {
                setToast({ variant: 'error', message: 'Invalid month selected' });
                return;
            }

            const paddedMonth = monthStr.padStart(2, '0');
            const lastDay = new Date(year, month, 0).getDate();
            const startDate = `${yearStr}-${paddedMonth}-01`;
            const endDate = `${yearStr}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;
            const monthLabel = transactionMonthOptions.find((option) => option.value === selectedDeleteMonth)?.label ?? selectedDeleteMonth;

            if (!window.confirm(`Delete all transactions in ${monthLabel}? This cannot be undone.`)) return;
            await runDeleteTransactionsInRange(startDate, endDate, monthLabel);
            return;
        }

        if (!deleteRangeStart || !deleteRangeEnd) {
            setToast({ variant: 'error', message: 'Please select a valid date range' });
            return;
        }
        if (!window.confirm(`Delete all transactions from ${deleteRangeStart} to ${deleteRangeEnd}? This cannot be undone.`)) return;
        await runDeleteTransactionsInRange(deleteRangeStart, deleteRangeEnd, `${deleteRangeStart} to ${deleteRangeEnd}`);
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

    const handleImportCsv = async () => {
        if (!currentUser) {
            setToast({ variant: 'error', message: 'Please sign in first' });
            return;
        }
        if (!importFile) {
            setToast({ variant: 'error', message: 'Please choose a CSV file first' });
            return;
        }

        setImporting(true);

        try {
            const csvText = await importFile.text();
            const rows = parseCsv(csvText);
            if (rows.length < 2) {
                setToast({ variant: 'error', message: 'CSV is empty or missing data rows' });
                return;
            }

            const headerRow = rows[0].map(normalizeHeader);
            const findHeaderIndex = (candidates: string[]) => headerRow.findIndex((header) => candidates.includes(header));

            const dateIdx = findHeaderIndex(['date']);
            const nameIdx = findHeaderIndex(['name', 'description']);
            const categoryIdx = findHeaderIndex(['category', 'catagory', 'catgory']);
            const ownerIdx = findHeaderIndex(['owner']);
            const amountIdx = findHeaderIndex(['amount', 'value']);

            if (dateIdx === -1 || nameIdx === -1 || categoryIdx === -1 || ownerIdx === -1 || amountIdx === -1) {
                setToast({
                    variant: 'error',
                    message: 'CSV must include headers: Date, Name, Category, Owner, Amount',
                });
                return;
            }

            const { db } = await import('@/lib/firebase');
            const { collection, doc, writeBatch, serverTimestamp } = await import('firebase/firestore');

            let importedCount = 0;
            let skippedCount = 0;
            let skippedDuplicateCount = 0;
            let batch = writeBatch(db);
            let pendingOps = 0;
            const existingDateAmountSignatures = new Set<string>();

            if (skipDuplicateImports) {
                transactions.forEach((tx) => {
                    if (!tx.date || typeof tx.amount !== 'number') return;
                    existingDateAmountSignatures.add(dateAmountSignature(tx.date, tx.amount));
                });
            }

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.every((cell) => !cell || !cell.trim())) continue;

                const dateRaw = row[dateIdx]?.trim() ?? '';
                const nameRaw = row[nameIdx]?.trim() ?? '';
                const categoryRaw = row[categoryIdx]?.trim() ?? '';
                const ownerRaw = row[ownerIdx]?.trim() ?? '';
                const amountRaw = row[amountIdx]?.trim() ?? '';

                if (!dateRaw || !nameRaw || !categoryRaw || !ownerRaw || !amountRaw) {
                    skippedCount++;
                    continue;
                }

                const date = toIsoDate(dateRaw);
                const parsedAmount = parseAmount(amountRaw);
                if (!date || !parsedAmount || parsedAmount.amount <= 0) {
                    skippedCount++;
                    continue;
                }

                const signature = dateAmountSignature(date, parsedAmount.amount);
                if (skipDuplicateImports && existingDateAmountSignatures.has(signature)) {
                    skippedDuplicateCount++;
                    continue;
                }

                const normalizedCategory = categoryRaw.toLowerCase();
                const matchedCategory = categoriesByName.get(normalizedCategory) ?? null;

                const inferredTypeFromCategory = matchedCategory?.type ?? null;
                const type: 'income' | 'expense' = parsedAmount.typeFromSign
                    ?? inferredTypeFromCategory
                    ?? 'expense';

                const resolvedCategory =
                    CATEGORIES.find((category) => (
                        (category.name.toLowerCase() === normalizedCategory || category.id.toLowerCase() === normalizedCategory)
                        && category.type === type
                    ))
                    ?? CATEGORIES.find((category) => category.id === (type === 'income' ? 'other' : 'misc'))
                    ?? CATEGORIES.find((category) => category.type === type)
                    ?? null;

                if (!resolvedCategory) {
                    skippedCount++;
                    continue;
                }

                const owner = parseOwner(ownerRaw);

                const txRef = doc(collection(db, 'transactions'));
                batch.set(txRef, {
                    name: nameRaw,
                    amount: parsedAmount.amount,
                    type,
                    categoryId: resolvedCategory.id,
                    categoryName: resolvedCategory.name,
                    ownerId: owner.ownerId,
                    ownerType: owner.ownerType,
                    date,
                    frequency: 'one-time',
                    hasReceipt: false,
                    createdAt: serverTimestamp(),
                });

                importedCount++;
                pendingOps++;

                if (skipDuplicateImports) {
                    existingDateAmountSignatures.add(signature);
                }

                if (pendingOps >= 450) {
                    await batch.commit();
                    batch = writeBatch(db);
                    pendingOps = 0;
                }
            }

            if (pendingOps > 0) {
                await batch.commit();
            }

            if (importedCount === 0) {
                if (skipDuplicateImports && skippedDuplicateCount > 0) {
                    setToast({
                        variant: 'error',
                        message: `No new rows imported. Skipped ${skippedDuplicateCount} duplicate row${skippedDuplicateCount === 1 ? '' : 's'}${skippedCount > 0 ? ` and ${skippedCount} invalid row${skippedCount === 1 ? '' : 's'}` : ''}.`,
                    });
                } else {
                    setToast({ variant: 'error', message: 'No valid rows to import from this CSV' });
                }
                return;
            }

            const summaryParts = [`Imported ${importedCount} row${importedCount === 1 ? '' : 's'}.`];
            if (skipDuplicateImports && skippedDuplicateCount > 0) {
                summaryParts.push(`Skipped ${skippedDuplicateCount} duplicate row${skippedDuplicateCount === 1 ? '' : 's'}.`);
            }
            if (skippedCount > 0) {
                summaryParts.push(`Skipped ${skippedCount} invalid row${skippedCount === 1 ? '' : 's'}.`);
            }

            setToast({
                variant: 'success',
                message: summaryParts.join(' '),
            });
            setImportFile(null);
            setImportInputKey((prev) => prev + 1);
        } catch (error) {
            console.error(error);
            setToast({ variant: 'error', message: 'Failed to import CSV file' });
        } finally {
            setImporting(false);
        }
    };

    const isDeleteSelectionInvalid = deleteMode === 'month'
        ? !selectedDeleteMonth
        : deleteMode === 'range'
            ? !deleteRangeStart || !deleteRangeEnd
            : false;

    const deleteActionLabel = deleteMode === 'all'
        ? 'Delete all data'
        : deleteMode === 'month'
            ? 'Delete selected month'
            : 'Delete selected range';

    const navItems = useMemo(() => [
        { icon: Wallet, label: 'Transactions', href: '/transactions' },
        { icon: Target, label: 'Goals', href: '/goals' },
        { icon: BarChart3, label: 'Analytics', href: '/analytics' },
        { icon: Sparkles, label: 'AI Insights', href: '/ai-insights' },
    ], []);

    const isFabRoute = pathname.startsWith('/transactions') || pathname.startsWith('/goals') || pathname.startsWith('/recurring');
    const canRunRecurringMigration = (currentUser?.email?.toLowerCase() ?? '').includes('eden');

    const handlePreviewRecurringMigration = async () => {
        setMigrationPreviewLoading(true);
        try {
            const preview = await previewLegacyRecurringMigration();
            setMigrationPreview(preview);
            setToast({
                variant: 'success',
                message: `Preview ready: ${preview.legacyRootSeriesCount} legacy recurring series found.`,
            });
        } catch (error) {
            console.error(error);
            setToast({ variant: 'error', message: 'Failed to preview recurring migration' });
        } finally {
            setMigrationPreviewLoading(false);
        }
    };

    const handleRunRecurringMigration = async () => {
        if (!canRunRecurringMigration) {
            setToast({ variant: 'error', message: 'You are not allowed to run recurring migration.' });
            return;
        }
        if (migrationConfirmText.trim() !== 'MIGRATE RECURRING') {
            setToast({ variant: 'error', message: 'Type MIGRATE RECURRING to confirm migration.' });
            return;
        }

        setMigrationRunning(true);
        try {
            const result = await runLegacyRecurringMigration(currentUser?.id ?? null);
            setToast({
                variant: 'success',
                message: `Migration completed: ${result.createdOrUpdatedSeriesCount} series and ${result.updatedOccurrencesCount} occurrences updated.`,
            });
            setMigrationConfirmText('');
            const preview = await previewLegacyRecurringMigration();
            setMigrationPreview(preview);
        } catch (error) {
            console.error(error);
            setToast({ variant: 'error', message: 'Recurring migration failed.' });
        } finally {
            setMigrationRunning(false);
        }
    };

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
                                label: 'Recurring',
                                onClick: () => router.push('/recurring'),
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
                            <h4 className="text-sm font-semibold text-gray-900">Import</h4>
                            <p className="text-xs text-gray-500">Upload CSV with columns: Date, Name, Category, Owner, Amount.</p>
                        </div>
                        <input
                            key={importInputKey}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                            className="file-input file-input-bordered w-full"
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={skipDuplicateImports}
                                onChange={(e) => setSkipDuplicateImports(e.target.checked)}
                                className="h-4 w-4 accent-[#0073ea]"
                            />
                            Skip existing entries (same date and amount)
                        </label>
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={handleImportCsv}
                            disabled={importing || !importFile}
                        >
                            <Upload size={16} className="mr-2" />
                            {importing ? 'Importing…' : 'Import CSV'}
                        </Button>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900">Recurring Migration</h4>
                            <p className="text-xs text-gray-500">
                                Convert legacy frequency-based recurring transactions into the new recurring manager format.
                            </p>
                        </div>

                        {!canRunRecurringMigration ? (
                            <p className="text-xs text-gray-500">Only an admin account can run this migration.</p>
                        ) : (
                            <>
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={handlePreviewRecurringMigration}
                                    disabled={migrationPreviewLoading || migrationRunning}
                                >
                                    {migrationPreviewLoading ? 'Generating preview…' : 'Preview migration'}
                                </Button>

                                {migrationPreview && (
                                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 space-y-1">
                                        <p>Legacy recurring series: {migrationPreview.legacyRootSeriesCount}</p>
                                        <p>Legacy occurrences linked to series: {migrationPreview.legacyOccurrenceCount}</p>
                                        <p>Existing migrated series: {migrationPreview.existingRecurringSeriesCount}</p>
                                        <p>Series that will be created: {migrationPreview.seriesToCreateCount}</p>
                                        <p>Occurrences that will be normalized: {migrationPreview.occurrencesToUpdateCount}</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-600">Type MIGRATE RECURRING to confirm</label>
                                    <input
                                        type="text"
                                        value={migrationConfirmText}
                                        onChange={(e) => setMigrationConfirmText(e.target.value)}
                                        placeholder="MIGRATE RECURRING"
                                        className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea]"
                                    />
                                </div>

                                <Button
                                    variant="danger"
                                    className="w-full"
                                    onClick={handleRunRecurringMigration}
                                    disabled={migrationRunning || migrationPreviewLoading}
                                >
                                    {migrationRunning ? 'Running migration…' : 'Run recurring migration'}
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="border-t pt-4 space-y-3">
                        <div>
                            <h4 className="text-sm font-semibold text-red-700">Danger Zone</h4>
                            <p className="text-xs text-gray-500">Delete all data or only transactions from a selected month/date range.</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-600">Delete Mode</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeleteMode('all')}
                                    className={cn(
                                        "h-9 rounded-md border text-sm font-medium transition-colors",
                                        deleteMode === 'all'
                                            ? "border-[#0073ea] bg-[#e6f0ff] text-[#0073ea]"
                                            : "border-gray-300 hover:bg-gray-50"
                                    )}
                                >
                                    All Data
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeleteMode('month')}
                                    className={cn(
                                        "h-9 rounded-md border text-sm font-medium transition-colors",
                                        deleteMode === 'month'
                                            ? "border-[#0073ea] bg-[#e6f0ff] text-[#0073ea]"
                                            : "border-gray-300 hover:bg-gray-50"
                                    )}
                                >
                                    Month
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeleteMode('range')}
                                    className={cn(
                                        "h-9 rounded-md border text-sm font-medium transition-colors",
                                        deleteMode === 'range'
                                            ? "border-[#0073ea] bg-[#e6f0ff] text-[#0073ea]"
                                            : "border-gray-300 hover:bg-gray-50"
                                    )}
                                >
                                    Date Range
                                </button>
                            </div>
                        </div>

                        {deleteMode === 'month' && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">Month</label>
                                <select
                                    className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea]"
                                    value={selectedDeleteMonth}
                                    onChange={(e) => setSelectedDeleteMonth(e.target.value)}
                                    disabled={transactionMonthOptions.length === 0}
                                >
                                    {transactionMonthOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label} ({option.count})
                                        </option>
                                    ))}
                                </select>
                                {transactionMonthOptions.length === 0 && (
                                    <p className="text-xs text-gray-500">No transaction months available to delete.</p>
                                )}
                            </div>
                        )}

                        {deleteMode === 'range' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-600">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea]"
                                        value={deleteRangeStart}
                                        onChange={(e) => setDeleteRangeStart(e.target.value)}
                                        max={deleteRangeEnd || undefined}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-600">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea]"
                                        value={deleteRangeEnd}
                                        onChange={(e) => setDeleteRangeEnd(e.target.value)}
                                        min={deleteRangeStart || undefined}
                                    />
                                </div>
                            </div>
                        )}

                        {deleteMode === 'all' ? (
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={includeGoals}
                                    onChange={(e) => setIncludeGoals(e.target.checked)}
                                    className="h-4 w-4 accent-[#0073ea]"
                                />
                                Also delete goals
                            </label>
                        ) : (
                            <p className="text-xs text-gray-500">Goal deletion is only available in All Data mode.</p>
                        )}

                        <Button
                            variant="danger"
                            className="w-full"
                            onClick={handleDeleteData}
                            disabled={deleting || !currentUser || isDeleteSelectionInvalid}
                        >
                            {deleting ? 'Deleting…' : deleteActionLabel}
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
