import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query } from 'firebase/firestore';
import { Goal } from '@/types/goals';
import { useUser } from '@/contexts/UserContext';
import { DEV_AUTH_BYPASS, makeMockId, mockGoalsStore } from '@/lib/devMock';

const COLLECTION_NAME = 'goals';

export function useGoals() {
    const [goals, setGoals] = useState<Goal[]>(() =>
        DEV_AUTH_BYPASS ? mockGoalsStore.get() : [],
    );
    const [loading, setLoading] = useState(!DEV_AUTH_BYPASS);
    const { currentUser, loading: userLoading } = useUser();

    useEffect(() => {
        if (DEV_AUTH_BYPASS) {
            return mockGoalsStore.subscribe(() => {
                setGoals([...mockGoalsStore.get()]);
            });
        }
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
        if (DEV_AUTH_BYPASS) {
            const newGoal: Goal = { ...goal, id: makeMockId('goal'), savedAmount: 0, status: 'Active' };
            mockGoalsStore.update((list) => [...list, newGoal]);
            return;
        }

        if (!currentUser) throw new Error("Must be logged in");

        await addDoc(collection(db, COLLECTION_NAME), {
            ...goal,
            savedAmount: 0,
            status: 'Active',
            createdAt: serverTimestamp()
        });
    };

    const addFunds = async (goalId: string, currentSaved: number, target: number, amount: number) => {
        const newSaved = Math.min(target, currentSaved + amount);
        const status: Goal['status'] = newSaved >= target ? 'Completed' : 'Active';

        if (DEV_AUTH_BYPASS) {
            mockGoalsStore.update((list) =>
                list.map((g) => (g.id === goalId ? { ...g, savedAmount: newSaved, status } : g)),
            );
            return { newSaved, status };
        }

        if (!currentUser) throw new Error("Must be logged in");
        await updateDoc(doc(db, COLLECTION_NAME, goalId), {
            savedAmount: newSaved,
            status
        });

        return { newSaved, status };
    };

    return { goals, loading, addGoal, addFunds };
}
