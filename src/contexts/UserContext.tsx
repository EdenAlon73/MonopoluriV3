"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export type UserType = 'eden' | 'sivan';

export interface User {
    id: string; // Firebase UID
    name: string;
    email: string | null;
    photoURL: string | null;
    color: string;
}

interface UserContextType {
    currentUser: User | null;
    loading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Dev-only auth bypass. Active only when NEXT_PUBLIC_DEV_AUTH_BYPASS=1 and NODE_ENV is not production.
// Lets us preview the app without hitting Google sign-in. Firestore writes will still fail without real auth.
const DEV_AUTH_BYPASS =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === '1';

const DEV_MOCK_USER: User = {
    id: 'dev-bypass-user',
    name: 'Dev User',
    email: 'dev@local',
    photoURL: null,
    color: '#0073ea',
};

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(DEV_AUTH_BYPASS ? DEV_MOCK_USER : null);
    const [loading, setLoading] = useState(!DEV_AUTH_BYPASS);

    useEffect(() => {
        if (DEV_AUTH_BYPASS) {
            console.warn('[UserContext] DEV_AUTH_BYPASS is ON — using a mock user. Do not ship with this flag enabled.');
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const isSivan = firebaseUser.email?.includes('sivan') || false;
                setCurrentUser({
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email,
                    photoURL: firebaseUser.photoURL,
                    color: isSivan ? '#ffcc00' : '#0073ea'
                });
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async () => {
        if (DEV_AUTH_BYPASS) {
            setCurrentUser(DEV_MOCK_USER);
            return;
        }
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const logout = async () => {
        if (DEV_AUTH_BYPASS) {
            setCurrentUser(null);
            return;
        }
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <UserContext.Provider value={{ currentUser, loading, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
