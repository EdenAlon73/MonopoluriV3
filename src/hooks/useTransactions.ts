import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, writeBatch, doc, getDocs, updateDoc, deleteDoc, getDoc, where } from 'firebase/firestore';
import { Transaction } from '@/types/transactions';
import { useUser } from '@/contexts/UserContext';
import { generateRecurringInstances } from '@/lib/utils';
import { isTransactionOnOrAfterCutoff, normalizeTransactionCategoryFields, TRANSACTION_CUTOFF_DATE } from '@/lib/transactionHelpers';

const COLLECTION_NAME = 'transactions';
const MAX_BATCH_OPS = 450;
const RECURRING_WEEKS_AHEAD = 52;

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

function stripTransactionId(tx: Transaction): Omit<Transaction, 'id'> {
    const rest = { ...tx };
    delete (rest as Partial<Transaction>).id;
    return rest;
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
        createdAt: raw.createdAt,
    };
}

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser, loading: userLoading } = useUser();
    const maintenanceDoneForUser = useRef<string | null>(null);

    const syncRecurringSeries = useCallback(async (parentTransactionId: string, baseTx: Omit<Transaction, 'id'>) => {
        const normalizedBase = normalizeTransactionInput(baseTx);
        const childrenSnapshot = await getDocs(query(collection(db, COLLECTION_NAME), where('parentTransactionId', '==', parentTransactionId)));

        let batch = writeBatch(db);
        let ops = 0;
        for (const childDoc of childrenSnapshot.docs) {
            batch.delete(childDoc.ref);
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

        if (normalizedBase.frequency === 'one-time') {
            return;
        }

        const instances = generateRecurringInstances(normalizedBase, RECURRING_WEEKS_AHEAD);
        if (instances.length === 0) {
            return;
        }

        batch = writeBatch(db);
        ops = 0;
        for (const instance of instances) {
            const instanceRef = doc(collection(db, COLLECTION_NAME));
            batch.set(instanceRef, {
                ...toWritableTransaction(normalizeTransactionInput(instance)),
                parentTransactionId,
                createdAt: serverTimestamp(),
            });
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
    }, []);

    const pruneLegacyTransactions = useCallback(async () => {
        const snapshot = await getDocs(query(collection(db, COLLECTION_NAME)));
        const docsToDelete = snapshot.docs.filter((docSnapshot) => {
            const txDate = docSnapshot.data().date;
            return typeof txDate === 'string' && txDate < TRANSACTION_CUTOFF_DATE;
        });

        if (docsToDelete.length === 0) {
            return;
        }

        let batch = writeBatch(db);
        let ops = 0;
        for (const txDoc of docsToDelete) {
            batch.delete(txDoc.ref);
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
    }, []);

    const reconcileRecurringTransactions = useCallback(async () => {
        const snapshot = await getDocs(query(collection(db, COLLECTION_NAME), orderBy('date', 'desc')));
        const allTransactions = snapshot.docs.map((docSnapshot) => (
            toTransaction(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
        ));

        const childrenByParent = new Map<string, Transaction[]>();
        allTransactions.forEach((tx) => {
            if (!tx.parentTransactionId) return;
            const bucket = childrenByParent.get(tx.parentTransactionId) ?? [];
            bucket.push(tx);
            childrenByParent.set(tx.parentTransactionId, bucket);
        });

        const recurringRoots = allTransactions.filter((tx) => !tx.parentTransactionId && tx.frequency !== 'one-time');
        for (const rootTx of recurringRoots) {
            const children = childrenByParent.get(rootTx.id) ?? [];
            const baseTransaction = normalizeTransactionInput(stripTransactionId(rootTx));
            const requiresResync = children.length === 0 || children.some((childTx) => {
                const normalizedChild = normalizeTransactionInput(stripTransactionId(childTx));
                return (
                    normalizedChild.frequency !== baseTransaction.frequency
                    || normalizedChild.type !== baseTransaction.type
                    || normalizedChild.amount !== baseTransaction.amount
                    || normalizedChild.categoryId !== baseTransaction.categoryId
                    || normalizedChild.categoryName !== baseTransaction.categoryName
                    || normalizedChild.ownerId !== baseTransaction.ownerId
                    || normalizedChild.ownerType !== baseTransaction.ownerType
                    || normalizedChild.name !== baseTransaction.name
                );
            });

            if (requiresResync) {
                await syncRecurringSeries(rootTx.id, baseTransaction);
            }
        }
    }, [syncRecurringSeries]);

    useEffect(() => {
        // If auth is still loading, do nothing yet (keep loading true)
        if (userLoading) return;

        // If no user, we can't fetch personalized transactions yet. 
        // Stop loading and return empty (or handle public data if that was the plan).
        if (!currentUser) {
            queueMicrotask(() => {
                setTransactions([]);
                setLoading(false);
            });
            return;
        }

        const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs
                .map((docSnapshot) => toTransaction(docSnapshot.id, docSnapshot.data() as Record<string, unknown>))
                .filter((tx) => isTransactionOnOrAfterCutoff(tx.date));
            setTransactions(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setLoading(false);
            // Optional: Handle permission denined specifically
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
                await reconcileRecurringTransactions();
            } catch (error) {
                console.error('Error running transaction maintenance:', error);
            }
        })();
    }, [currentUser, userLoading, pruneLegacyTransactions, reconcileRecurringTransactions]);

    const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
        if (!currentUser) throw new Error("Must be logged in");
        const normalizedTx = normalizeTransactionInput(tx);

        // Add the base transaction
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...toWritableTransaction(normalizedTx),
            createdAt: serverTimestamp()
        });

        // If it's a recurring transaction, generate future instances
        if (normalizedTx.frequency !== 'one-time') {
            await syncRecurringSeries(docRef.id, normalizedTx);
        }
    };

    const deleteAllTransactions = async () => {
        if (!currentUser) throw new Error("Must be logged in");
        
        const q = query(collection(db, COLLECTION_NAME));
        const snapshot = await getDocs(q);
        let batch = writeBatch(db);
        let ops = 0;

        for (const docSnapshot of snapshot.docs) {
            batch.delete(docSnapshot.ref);
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
    };

    const updateTransaction = async (id: string, tx: Partial<Omit<Transaction, 'id'>>) => {
        if (!currentUser) throw new Error("Must be logged in");
        const txRef = doc(db, COLLECTION_NAME, id);
        const existingSnapshot = await getDoc(txRef);
        if (!existingSnapshot.exists()) return;

        const existingTx = toTransaction(id, existingSnapshot.data() as Record<string, unknown>);
        const mergedTx = normalizeTransactionInput({
            ...stripTransactionId(existingTx),
            ...tx,
            type: tx.type ?? existingTx.type,
        });

        await updateDoc(txRef, {
            ...toWritableTransaction(mergedTx),
            updatedAt: serverTimestamp(),
        });

        if (!existingTx.parentTransactionId) {
            await syncRecurringSeries(id, mergedTx);
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!currentUser) throw new Error("Must be logged in");
        const txRef = doc(db, COLLECTION_NAME, id);
        const existingSnapshot = await getDoc(txRef);
        if (!existingSnapshot.exists()) return;

        const existingTx = toTransaction(id, existingSnapshot.data() as Record<string, unknown>);
        if (existingTx.parentTransactionId) {
            await deleteDoc(txRef);
            return;
        }

        const childrenSnapshot = await getDocs(query(collection(db, COLLECTION_NAME), where('parentTransactionId', '==', id)));
        let batch = writeBatch(db);
        let ops = 0;

        batch.delete(txRef);
        ops++;
        for (const childDoc of childrenSnapshot.docs) {
            batch.delete(childDoc.ref);
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
    };

    return { transactions, loading, addTransaction, deleteAllTransactions, updateTransaction, deleteTransaction };
}
