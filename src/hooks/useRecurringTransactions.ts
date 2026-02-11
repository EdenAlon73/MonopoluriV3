import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import {
    clampAnchorDay,
    generateRecurringDates,
    getDefaultHorizonEnd,
    RECURRING_HORIZON_MONTHS,
    toTransactionFromRecurring,
} from '@/lib/recurringEngine';
import { resolveCategoryForTransaction } from '@/lib/transactionHelpers';
import {
    RecurringException,
    RecurringExceptionKind,
    RecurringFrequency,
    RecurringStatus,
    RecurringTransaction,
} from '@/types/recurring';
import { Transaction } from '@/types/transactions';

const RECURRING_COLLECTION = 'recurringTransactions';
const RECURRING_EXCEPTIONS_COLLECTION = 'recurringExceptions';
const TRANSACTIONS_COLLECTION = 'transactions';
const MAX_BATCH_OPS = 450;
const VALID_RECURRING_FREQUENCIES: RecurringFrequency[] = ['daily', 'weekly', 'bi-weekly', 'monthly'];

type RecurringUpsertInput = {
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
    status?: RecurringStatus;
    anchorDay?: number;
};

function coerceRecurringFrequency(value: unknown): RecurringFrequency {
    if (VALID_RECURRING_FREQUENCIES.includes(value as RecurringFrequency)) {
        return value as RecurringFrequency;
    }
    return 'monthly';
}

function coerceRecurringStatus(value: unknown): RecurringStatus {
    return value === 'paused' ? 'paused' : 'active';
}

function normalizeRecurringInput(input: RecurringUpsertInput): Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'> {
    const type: Transaction['type'] = input.type === 'income' ? 'income' : 'expense';
    const normalizedCategory = resolveCategoryForTransaction({
        type,
        categoryId: input.categoryId,
        categoryName: input.categoryName,
    });
    const amount = Number.isFinite(input.amount) ? input.amount : 0;
    const startDate = input.startDate;
    const startDay = Number(startDate?.split('-')[2] ?? 1);

    return {
        name: input.name.trim(),
        amount: amount > 0 ? amount : 0,
        type,
        categoryId: normalizedCategory.id,
        categoryName: normalizedCategory.name,
        ownerId: input.ownerId,
        ownerType: input.ownerType === 'individual' ? 'individual' : 'shared',
        frequency: coerceRecurringFrequency(input.frequency),
        startDate,
        endDate: input.endDate ?? null,
        status: input.status ? coerceRecurringStatus(input.status) : 'active',
        anchorDay: clampAnchorDay(input.anchorDay ?? startDay),
    };
}

function toRecurringTransaction(id: string, raw: Record<string, unknown>): RecurringTransaction {
    const type: Transaction['type'] = raw.type === 'income' ? 'income' : 'expense';
    const resolvedCategory = resolveCategoryForTransaction({
        type,
        categoryId: typeof raw.categoryId === 'string' ? raw.categoryId : undefined,
        categoryName: typeof raw.categoryName === 'string' ? raw.categoryName : undefined,
    });
    const amountValue = typeof raw.amount === 'number' ? raw.amount : Number(raw.amount ?? 0);
    const startDate = typeof raw.startDate === 'string' ? raw.startDate : '';
    const inferredAnchor = Number(startDate.split('-')[2] ?? 1);

    return {
        id,
        name: typeof raw.name === 'string' ? raw.name : '',
        amount: Number.isFinite(amountValue) ? amountValue : 0,
        type,
        categoryId: resolvedCategory.id,
        categoryName: resolvedCategory.name,
        ownerId: typeof raw.ownerId === 'string' || raw.ownerId === null ? raw.ownerId : 'shared',
        ownerType: raw.ownerType === 'individual' ? 'individual' : 'shared',
        frequency: coerceRecurringFrequency(raw.frequency),
        startDate,
        endDate: typeof raw.endDate === 'string' ? raw.endDate : null,
        anchorDay: clampAnchorDay(typeof raw.anchorDay === 'number' ? raw.anchorDay : inferredAnchor),
        status: coerceRecurringStatus(raw.status),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
    };
}

function toRecurringException(id: string, raw: Record<string, unknown>): RecurringException | null {
    const recurrenceId = typeof raw.recurrenceId === 'string' ? raw.recurrenceId : '';
    const date = typeof raw.date === 'string' ? raw.date : '';
    const kind: RecurringExceptionKind = raw.kind === 'pause-skip' ? 'pause-skip' : 'manual-delete';
    if (!recurrenceId || !date) return null;
    return {
        id,
        recurrenceId,
        date,
        kind,
        createdAt: raw.createdAt,
    };
}

function isSameTransactionContent(existing: Transaction, recurrence: RecurringTransaction): boolean {
    return (
        existing.name === recurrence.name
        && existing.amount === recurrence.amount
        && existing.type === recurrence.type
        && existing.categoryId === recurrence.categoryId
        && existing.categoryName === recurrence.categoryName
        && existing.ownerId === recurrence.ownerId
        && existing.ownerType === recurrence.ownerType
        && existing.frequency === 'one-time'
        && existing.occurrenceDate === existing.date
        && existing.recurrenceId === recurrence.id
    );
}

function toTransaction(id: string, raw: Record<string, unknown>): Transaction {
    const type: Transaction['type'] = raw.type === 'income' ? 'income' : 'expense';
    const amountValue = typeof raw.amount === 'number' ? raw.amount : Number(raw.amount ?? 0);
    const resolvedCategory = resolveCategoryForTransaction({
        type,
        categoryId: typeof raw.categoryId === 'string' ? raw.categoryId : undefined,
        categoryName: typeof raw.categoryName === 'string' ? raw.categoryName : undefined,
    });

    return {
        id,
        name: typeof raw.name === 'string' ? raw.name : '',
        amount: Number.isFinite(amountValue) ? amountValue : 0,
        type,
        categoryId: resolvedCategory.id,
        categoryName: resolvedCategory.name,
        ownerId: typeof raw.ownerId === 'string' || raw.ownerId === null ? raw.ownerId : 'shared',
        ownerType: raw.ownerType === 'individual' ? 'individual' : 'shared',
        date: typeof raw.date === 'string' ? raw.date : '',
        frequency: 'one-time',
        hasReceipt: Boolean(raw.hasReceipt),
        receiptUrl: typeof raw.receiptUrl === 'string' ? raw.receiptUrl : undefined,
        parentTransactionId: typeof raw.parentTransactionId === 'string' ? raw.parentTransactionId : undefined,
        recurrenceId: typeof raw.recurrenceId === 'string' ? raw.recurrenceId : undefined,
        occurrenceDate: typeof raw.occurrenceDate === 'string' ? raw.occurrenceDate : undefined,
        createdAt: raw.createdAt,
    };
}

async function commitInChunks(ops: Array<(batch: ReturnType<typeof writeBatch>) => void>) {
    let batch = writeBatch(db);
    let pendingOps = 0;

    for (const apply of ops) {
        apply(batch);
        pendingOps++;
        if (pendingOps >= MAX_BATCH_OPS) {
            await batch.commit();
            batch = writeBatch(db);
            pendingOps = 0;
        }
    }

    if (pendingOps > 0) {
        await batch.commit();
    }
}

async function syncRecurringSeriesOccurrences(recurrence: RecurringTransaction) {
    const today = new Date().toISOString().split('T')[0];
    const horizonEnd = getDefaultHorizonEnd(today);

    const [existingSnapshot, exceptionsSnapshot] = await Promise.all([
        getDocs(query(collection(db, TRANSACTIONS_COLLECTION), where('recurrenceId', '==', recurrence.id))),
        getDocs(query(collection(db, RECURRING_EXCEPTIONS_COLLECTION), where('recurrenceId', '==', recurrence.id))),
    ]);

    const existingTransactions = existingSnapshot.docs.map((docSnapshot) => (
        toTransaction(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
    ));
    const exceptions = exceptionsSnapshot.docs
        .map((docSnapshot) => toRecurringException(docSnapshot.id, docSnapshot.data() as Record<string, unknown>))
        .filter((item): item is RecurringException => Boolean(item));

    const excludedDates = new Set(exceptions.map((entry) => entry.date));
    const desiredDates = generateRecurringDates({
        frequency: recurrence.frequency,
        startDate: recurrence.startDate,
        endDate: recurrence.endDate ?? null,
        anchorDay: recurrence.anchorDay,
        fromDate: recurrence.startDate,
        toDate: horizonEnd,
        excludedDates,
    }).filter((date) => (
        recurrence.status === 'active' ? true : date < today
    ));

    const desiredDateSet = new Set(desiredDates);
    const existingByDate = new Map<string, Transaction[]>();
    for (const tx of existingTransactions) {
        const bucket = existingByDate.get(tx.date) ?? [];
        bucket.push(tx);
        existingByDate.set(tx.date, bucket);
    }

    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    for (const [date, sameDateTransactions] of existingByDate.entries()) {
        const [keeper, ...duplicates] = sameDateTransactions;
        for (const duplicate of duplicates) {
            const duplicateRef = doc(db, TRANSACTIONS_COLLECTION, duplicate.id);
            ops.push((batch) => batch.delete(duplicateRef));
        }

        const keeperRef = doc(db, TRANSACTIONS_COLLECTION, keeper.id);
        if (!desiredDateSet.has(date)) {
            ops.push((batch) => batch.delete(keeperRef));
            continue;
        }

        if (!isSameTransactionContent(keeper, recurrence) || keeper.date !== date) {
            const normalizedTransaction = toTransactionFromRecurring(recurrence, date);
            ops.push((batch) => batch.update(keeperRef, {
                ...normalizedTransaction,
                updatedAt: serverTimestamp(),
            }));
        }
    }

    const existingDateSet = new Set(existingByDate.keys());
    for (const date of desiredDates) {
        if (existingDateSet.has(date)) continue;
        const txRef = doc(collection(db, TRANSACTIONS_COLLECTION));
        const normalizedTransaction = toTransactionFromRecurring(recurrence, date);
        ops.push((batch) => batch.set(txRef, {
            ...normalizedTransaction,
            createdAt: serverTimestamp(),
        }));
    }

    if (ops.length > 0) {
        await commitInChunks(ops);
    }
}

async function deleteSeriesData(recurrenceId: string) {
    const [txSnapshot, exceptionsSnapshot] = await Promise.all([
        getDocs(query(collection(db, TRANSACTIONS_COLLECTION), where('recurrenceId', '==', recurrenceId))),
        getDocs(query(collection(db, RECURRING_EXCEPTIONS_COLLECTION), where('recurrenceId', '==', recurrenceId))),
    ]);

    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    for (const txDoc of txSnapshot.docs) {
        ops.push((batch) => batch.delete(txDoc.ref));
    }
    for (const exceptionDoc of exceptionsSnapshot.docs) {
        ops.push((batch) => batch.delete(exceptionDoc.ref));
    }
    ops.push((batch) => batch.delete(doc(db, RECURRING_COLLECTION, recurrenceId)));

    await commitInChunks(ops);
}

async function ensurePauseSkipExceptions(recurrence: RecurringTransaction, fromDate: string) {
    const horizonEnd = getDefaultHorizonEnd(fromDate);
    const datesToSkip = generateRecurringDates({
        frequency: recurrence.frequency,
        startDate: recurrence.startDate,
        endDate: recurrence.endDate ?? null,
        anchorDay: recurrence.anchorDay,
        fromDate,
        toDate: horizonEnd,
    });

    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    for (const date of datesToSkip) {
        const exceptionRef = doc(db, RECURRING_EXCEPTIONS_COLLECTION, `${recurrence.id}_${date}_pause`);
        ops.push((batch) => batch.set(exceptionRef, {
            recurrenceId: recurrence.id,
            date,
            kind: 'pause-skip',
            createdAt: serverTimestamp(),
        }, { merge: true }));
    }

    if (ops.length > 0) {
        await commitInChunks(ops);
    }
}

async function clearPauseSkipExceptions(recurrenceId: string, resumeFromDate: string) {
    const exceptionsSnapshot = await getDocs(query(collection(db, RECURRING_EXCEPTIONS_COLLECTION), where('recurrenceId', '==', recurrenceId)));
    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    for (const exceptionDoc of exceptionsSnapshot.docs) {
        const data = exceptionDoc.data() as Record<string, unknown>;
        const kind = data.kind === 'pause-skip' ? 'pause-skip' : 'manual-delete';
        const date = typeof data.date === 'string' ? data.date : '';
        if (kind !== 'pause-skip') continue;
        if (!date || date < resumeFromDate) continue;
        ops.push((batch) => batch.delete(exceptionDoc.ref));
    }

    if (ops.length > 0) {
        await commitInChunks(ops);
    }
}

export function useRecurringTransactions() {
    const { currentUser, loading: userLoading } = useUser();
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userLoading) return;
        if (!currentUser) {
            queueMicrotask(() => {
                setRecurringTransactions([]);
                setLoading(false);
            });
            return;
        }

        const recurringQuery = query(collection(db, RECURRING_COLLECTION), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(recurringQuery, (snapshot) => {
            const rows = snapshot.docs.map((docSnapshot) => (
                toRecurringTransaction(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
            ));
            setRecurringTransactions(rows);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching recurring transactions:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, userLoading]);

    const createRecurring = useCallback(async (input: RecurringUpsertInput) => {
        if (!currentUser) throw new Error('Must be logged in');
        const normalized = normalizeRecurringInput(input);
        const recurrenceRef = await addDoc(collection(db, RECURRING_COLLECTION), {
            ...normalized,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        await syncRecurringSeriesOccurrences({
            ...normalized,
            id: recurrenceRef.id,
        });
    }, [currentUser]);

    const updateRecurring = useCallback(async (id: string, input: RecurringUpsertInput) => {
        if (!currentUser) throw new Error('Must be logged in');
        const normalized = normalizeRecurringInput(input);
        await updateDoc(doc(db, RECURRING_COLLECTION, id), {
            ...normalized,
            updatedAt: serverTimestamp(),
        });

        await syncRecurringSeriesOccurrences({
            ...normalized,
            id,
        });
    }, [currentUser]);

    const pauseRecurring = useCallback(async (id: string, pauseFromDate?: string) => {
        if (!currentUser) throw new Error('Must be logged in');
        const recurrenceRef = doc(db, RECURRING_COLLECTION, id);
        const snapshot = await getDoc(recurrenceRef);
        if (!snapshot.exists()) return;
        const recurrence = toRecurringTransaction(id, snapshot.data() as Record<string, unknown>);
        const effectivePauseDate = pauseFromDate ?? new Date().toISOString().split('T')[0];

        await ensurePauseSkipExceptions(recurrence, effectivePauseDate);
        await updateDoc(recurrenceRef, {
            status: 'paused',
            updatedAt: serverTimestamp(),
        });

        await syncRecurringSeriesOccurrences({
            ...recurrence,
            status: 'paused',
        });
    }, [currentUser]);

    const resumeRecurring = useCallback(async (id: string, resumeFromDate?: string) => {
        if (!currentUser) throw new Error('Must be logged in');
        const recurrenceRef = doc(db, RECURRING_COLLECTION, id);
        const snapshot = await getDoc(recurrenceRef);
        if (!snapshot.exists()) return;
        const recurrence = toRecurringTransaction(id, snapshot.data() as Record<string, unknown>);
        const effectiveResumeDate = resumeFromDate ?? new Date().toISOString().split('T')[0];

        await clearPauseSkipExceptions(id, effectiveResumeDate);
        await updateDoc(recurrenceRef, {
            status: 'active',
            updatedAt: serverTimestamp(),
        });

        await syncRecurringSeriesOccurrences({
            ...recurrence,
            status: 'active',
        });
    }, [currentUser]);

    const deleteRecurring = useCallback(async (id: string) => {
        if (!currentUser) throw new Error('Must be logged in');
        await deleteSeriesData(id);
    }, [currentUser]);

    const syncAllRecurring = useCallback(async () => {
        if (!currentUser) throw new Error('Must be logged in');
        const snapshot = await getDocs(query(collection(db, RECURRING_COLLECTION)));
        const rows = snapshot.docs.map((docSnapshot) => (
            toRecurringTransaction(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
        ));

        for (const recurrence of rows) {
            await syncRecurringSeriesOccurrences(recurrence);
        }
    }, [currentUser]);

    const stats = useMemo(() => {
        const active = recurringTransactions.filter((item) => item.status === 'active').length;
        const paused = recurringTransactions.length - active;
        const monthly = recurringTransactions.filter((item) => item.frequency === 'monthly').length;
        return {
            active,
            paused,
            monthly,
            total: recurringTransactions.length,
            horizonMonths: RECURRING_HORIZON_MONTHS,
        };
    }, [recurringTransactions]);

    return {
        recurringTransactions,
        loading,
        stats,
        createRecurring,
        updateRecurring,
        pauseRecurring,
        resumeRecurring,
        deleteRecurring,
        syncAllRecurring,
    };
}
