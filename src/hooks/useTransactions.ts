import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, writeBatch, doc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { Transaction } from '@/types/transactions';
import { useUser } from '@/contexts/UserContext';
import { generateRecurringInstances } from '@/lib/utils';

const COLLECTION_NAME = 'transactions';

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser, loading: userLoading } = useUser();

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
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Transaction[];
            setTransactions(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setLoading(false);
            // Optional: Handle permission denined specifically
        });

        return () => unsubscribe();
    }, [currentUser, userLoading]);

    const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
        if (!currentUser) throw new Error("Must be logged in");

        // Add the base transaction
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...tx,
            createdAt: serverTimestamp()
        });

        // If it's a recurring transaction, generate future instances
        if (tx.frequency !== 'one-time') {
            const instances = generateRecurringInstances(tx, 52); // Generate 1 year ahead
            
            if (instances.length > 0) {
                const batch = writeBatch(db);
                
                instances.forEach(instance => {
                    const instanceRef = doc(collection(db, COLLECTION_NAME));
                    batch.set(instanceRef, {
                        ...instance,
                        parentTransactionId: docRef.id, // Link to parent for future updates
                        createdAt: serverTimestamp()
                    });
                });
                
                await batch.commit();
            }
        }
    };

    const deleteAllTransactions = async () => {
        if (!currentUser) throw new Error("Must be logged in");
        
        const q = query(collection(db, COLLECTION_NAME));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
    };

    const updateTransaction = async (id: string, tx: Partial<Omit<Transaction, 'id'>>) => {
        if (!currentUser) throw new Error("Must be logged in");
        await updateDoc(doc(db, COLLECTION_NAME, id), {
            ...tx,
            updatedAt: serverTimestamp(),
        });
    };

    const deleteTransaction = async (id: string) => {
        if (!currentUser) throw new Error("Must be logged in");
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    };

    return { transactions, loading, addTransaction, deleteAllTransactions, updateTransaction, deleteTransaction };
}
