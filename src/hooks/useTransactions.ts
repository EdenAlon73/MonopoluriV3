import { useCallback, useEffect, useRef, useState } from 'react';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction } from '@/types/transactions';
import { useUser } from '@/contexts/UserContext';
import { isTransactionOnOrAfterCutoff, normalizeTransactionCategoryFields, TRANSACTION_CUTOFF_DATE } from '@/lib/transactionHelpers';

const COLLECTION_NAME = 'transactions';
const RECURRING_EXCEPTIONS_COLLECTION = 'recurringExceptions';
const MAX_BATCH_OPS = 450;
const VALID_FREQUENCIES: Transaction['frequency'][] = ['one-time', 'daily', 'weekly', 'bi-weekly', 'monthly'];

function coerceFrequency(value: unknown): Transaction['frequency'] {
    return VALID_FREQUENCIES.includes(value as Transaction['frequency']) ? (value as Transaction['frequency']) : 'one-time';
}

function normalizeTransactionInput(tx: Omit<Transaction, 'id'>): Omit<Transaction, 'id'> {
    const type: Transaction['type'] = tx.type === 'income' ? 'income' : 'expense';
    const normalizedCategory = normalizeTransactionCategoryFields({
        type,
        categoryId: tx.categoryId,
        categoryName: tx.categoryName,
    });
    return {
        ...tx,
        amount: Number.isFinite(tx.amount) ? tx.amount : 0,
        type,
        categoryId: normalizedCategory.categoryId,
        categoryName: normalizedCategory.categoryName,
        frequency: coerceFrequency(tx.frequency),
        hasReceipt: Boolean(tx.hasReceipt),
    };
}

function toWritableTransaction(tx: Omit<Transaction, 'id'>) {
    const payload: Record<string, unknown> = {
        name: tx.name,
        amount: tx.amount,
        type: tx.type,
        categoryId: tx.categoryId,
        categoryName: tx.categoryName,
        ownerId: tx.ownerId,
        ownerType: tx.ownerType,
        date: tx.date,
        frequency: tx.frequency,
        hasReceipt: tx.hasReceipt,
    };

    if (tx.receiptUrl) {
        payload.receiptUrl = tx.receiptUrl;
    }
    if (tx.parentTransactionId) {
        payload.parentTransactionId = tx.parentTransactionId;
    }
    if (tx.recurrenceId) {
        payload.recurrenceId = tx.recurrenceId;
    }
    if (tx.occurrenceDate) {
        payload.occurrenceDate = tx.occurrenceDate;
    }

    return payload;
}

function toTransaction(id: string, raw: Record<string, unknown>): Transaction {
    const type: Transaction['type'] = raw.type === 'income' ? 'income' : 'expense';
    const amountValue = typeof raw.amount === 'number' ? raw.amount : Number(raw.amount ?? 0);
    const normalizedCategory = normalizeTransactionCategoryFields({
        type,
        categoryId: typeof raw.categoryId === 'string' ? raw.categoryId : undefined,
        categoryName: typeof raw.categoryName === 'string' ? raw.categoryName : undefined,
    });

    return {
        id,
        name: typeof raw.name === 'string' ? raw.name : '',
        amount: Number.isFinite(amountValue) ? amountValue : 0,
        type,
        categoryId: normalizedCategory.categoryId,
        categoryName: normalizedCategory.categoryName,
        ownerId: typeof raw.ownerId === 'string' || raw.ownerId === null ? raw.ownerId : 'shared',
        ownerType: raw.ownerType === 'individual' ? 'individual' : 'shared',
        date: typeof raw.date === 'string' ? raw.date : '',
        frequency: coerceFrequency(raw.frequency),
        hasReceipt: Boolean(raw.hasReceipt),
        receiptUrl: typeof raw.receiptUrl === 'string' ? raw.receiptUrl : undefined,
        parentTransactionId: typeof raw.parentTransactionId === 'string' ? raw.parentTransactionId : undefined,
        recurrenceId: typeof raw.recurrenceId === 'string' ? raw.recurrenceId : undefined,
        occurrenceDate: typeof raw.occurrenceDate === 'string' ? raw.occurrenceDate : undefined,
        createdAt: raw.createdAt,
    };
}

function stripTransactionId(tx: Transaction): Omit<Transaction, 'id'> {
    const { id, ...rest } = tx;
    void id;
    return rest;
}

async function commitDeletes(ids: string[]) {
    if (ids.length === 0) return;
    let batch = writeBatch(db);
    let ops = 0;
    for (const id of ids) {
        batch.delete(doc(db, COLLECTION_NAME, id));
        ops++;
        if (ops >= MAX_BATCH_OPS) {
            await batch.commit();
            batch = writeBatch(db);
            ops = 0;
        }
    }
    if (ops > 0) {
        await batch.commit();
    }
}

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser, loading: userLoading } = useUser();
    const maintenanceDoneForUser = useRef<string | null>(null);

    const pruneLegacyTransactions = useCallback(async () => {
        const snapshot = await getDocs(query(collection(db, COLLECTION_NAME)));
        const idsToDelete = snapshot.docs
            .filter((docSnapshot) => {
                const txDate = docSnapshot.data().date;
                return typeof txDate === 'string' && txDate < TRANSACTION_CUTOFF_DATE;
            })
            .map((docSnapshot) => docSnapshot.id);

        await commitDeletes(idsToDelete);
    }, []);

    useEffect(() => {
        if (userLoading) return;

        if (!currentUser) {
            queueMicrotask(() => {
                setTransactions([]);
                setLoading(false);
            });
            return;
        }

        const transactionsQuery = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
            const data = snapshot.docs
                .map((docSnapshot) => toTransaction(docSnapshot.id, docSnapshot.data() as Record<string, unknown>))
                .filter((tx) => isTransactionOnOrAfterCutoff(tx.date));
            setTransactions(data);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching transactions:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, userLoading]);

    useEffect(() => {
        if (userLoading) return;
        if (!currentUser) {
            maintenanceDoneForUser.current = null;
            return;
        }
        if (maintenanceDoneForUser.current === currentUser.id) {
            return;
        }
        maintenanceDoneForUser.current = currentUser.id;

        void (async () => {
            try {
                await pruneLegacyTransactions();
            } catch (error) {
                console.error('Error running transaction maintenance:', error);
            }
        })();
    }, [currentUser, userLoading, pruneLegacyTransactions]);

    const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
        if (!currentUser) throw new Error('Must be logged in');
        const normalizedTx = normalizeTransactionInput({
            ...tx,
            frequency: 'one-time',
            recurrenceId: undefined,
            occurrenceDate: undefined,
            parentTransactionId: undefined,
        });

        await addDoc(collection(db, COLLECTION_NAME), {
            ...toWritableTransaction(normalizedTx),
            createdAt: serverTimestamp(),
        });
    };

    const deleteAllTransactions = async () => {
        if (!currentUser) throw new Error('Must be logged in');

        const snapshot = await getDocs(query(collection(db, COLLECTION_NAME)));
        await commitDeletes(snapshot.docs.map((docSnapshot) => docSnapshot.id));
    };

    const updateTransaction = async (id: string, tx: Partial<Omit<Transaction, 'id'>>) => {
        if (!currentUser) throw new Error('Must be logged in');
        const txRef = doc(db, COLLECTION_NAME, id);
        const existingSnapshot = await getDoc(txRef);
        if (!existingSnapshot.exists()) return;

        const existingTx = toTransaction(id, existingSnapshot.data() as Record<string, unknown>);
        if (existingTx.recurrenceId) {
            throw new Error('Recurring transactions can only be edited from the recurring manager.');
        }

        const mergedTx = normalizeTransactionInput({
            ...stripTransactionId(existingTx),
            ...tx,
            type: tx.type ?? existingTx.type,
            frequency: 'one-time',
            recurrenceId: undefined,
            occurrenceDate: undefined,
            parentTransactionId: undefined,
        });

        await updateDoc(txRef, {
            ...toWritableTransaction(mergedTx),
            updatedAt: serverTimestamp(),
        });
    };

    const deleteTransaction = async (id: string) => {
        if (!currentUser) throw new Error('Must be logged in');
        const txRef = doc(db, COLLECTION_NAME, id);
        const existingSnapshot = await getDoc(txRef);
        if (!existingSnapshot.exists()) return;

        const existingTx = toTransaction(id, existingSnapshot.data() as Record<string, unknown>);
        if (existingTx.recurrenceId) {
            const exceptionRef = doc(db, RECURRING_EXCEPTIONS_COLLECTION, `${existingTx.recurrenceId}_${existingTx.date}_manual`);
            await setDoc(exceptionRef, {
                recurrenceId: existingTx.recurrenceId,
                date: existingTx.date,
                kind: 'manual-delete',
                createdAt: serverTimestamp(),
            }, { merge: true });
            await deleteDoc(txRef);
            return;
        }

        await deleteDoc(txRef);
    };

    return {
        transactions,
        loading,
        addTransaction,
        deleteAllTransactions,
        updateTransaction,
        deleteTransaction,
    };
}
