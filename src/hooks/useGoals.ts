import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query } from 'firebase/firestore';
import { Goal } from '@/types/goals';
import { useUser } from '@/contexts/UserContext';

const COLLECTION_NAME = 'goals';

export function useGoals() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser, loading: userLoading } = useUser();

    useEffect(() => {
        if (userLoading) return;
        if (!currentUser) {
            queueMicrotask(() => {
                setGoals([]);
                setLoading(false);
            });
            return;
        }

        const q = query(collection(db, COLLECTION_NAME)); // Could order by createdAt

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Goal[];
            setGoals(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching goals:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, userLoading]);

    const addGoal = async (goal: Omit<Goal, 'id'>) => {
        if (!currentUser) throw new Error("Must be logged in");

        await addDoc(collection(db, COLLECTION_NAME), {
            ...goal,
            savedAmount: 0,
            status: 'Active',
            createdAt: serverTimestamp()
        });
    };

    const addFunds = async (goalId: string, currentSaved: number, target: number, amount: number) => {
        if (!currentUser) throw new Error("Must be logged in");

        const newSaved = Math.min(target, currentSaved + amount);
        const status = newSaved >= target ? 'Completed' : 'Active';

        await updateDoc(doc(db, COLLECTION_NAME, goalId), {
            savedAmount: newSaved,
            status
        });

        return { newSaved, status };
    };

    return { goals, loading, addGoal, addFunds };
}
