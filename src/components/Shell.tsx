"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Wallet, Target, BarChart3, Sparkles, Trash2, AlertTriangle, CheckCircle2, X } from 'lucide-react'; // Icons
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useGoals } from '@/hooks/useGoals';
import { Alert, AlertContent, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/Button';
import { Dock } from '@/components/ui/dock-two';
import FloatingActionMenu from '@/components/ui/floating-action-menu';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { AddGoalModal } from '@/components/modals/AddGoalModal';
import { User } from '@/contexts/UserContext';

type DockItem = {
    icon: typeof Wallet;
    label: string;
    onClick?: () => void;
    className?: string;
    active?: boolean;
};

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
    const { addTransaction } = useTransactions();
    const { addGoal } = useGoals();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);
    const [navMounted, setNavMounted] = useState(false);
    const [includeGoals, setIncludeGoals] = useState(false);
    const [showTxModal, setShowTxModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const isAuthPage = pathname.startsWith('/auth');

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
    
    const handleDeleteAll = async () => {
        if (!currentUser) {
            setToast({ variant: 'error', message: 'Please sign in first' });
            return;
        }
        setIncludeGoals(false);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteAll = async () => {
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
            setShowDeleteConfirm(false);
            setDeleting(false);
        }
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
            icon: Trash2,
            label: 'Delete Data',
            onClick: handleDeleteAll,
            active: false,
            className: cn("text-red-600", !currentUser && "opacity-60 cursor-not-allowed"),
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

            {(showDeleteConfirm || toast) && (
                <div className="fixed bottom-6 right-6 z-[200] space-y-3 w-[400px] max-w-[calc(100%-2rem)]" aria-live="polite">
                    {showDeleteConfirm && (
                        <Alert
                            variant="warning"
                            isNotification
                            size="lg"
                            layout="complex"
                            icon={<AlertTriangle className="text-amber-600" size={18} />}
                        >
                            <AlertContent className="space-y-2">
                                <AlertTitle>Delete all data?</AlertTitle>
                                <AlertDescription>
                                    This will permanently remove every transaction. This action cannot be undone.
                                </AlertDescription>
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={includeGoals}
                                        onChange={(e) => setIncludeGoals(e.target.checked)}
                                        className="h-4 w-4 accent-[#0073ea]"
                                    />
                                    Also delete goals
                                </label>
                                <div className="flex flex-wrap justify-end gap-2 pt-1">
                                    <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                                        Cancel
                                    </Button>
                                    <Button variant="danger" size="sm" onClick={confirmDeleteAll} disabled={deleting || !currentUser}>
                                        {deleting ? 'Deleting…' : 'Delete everything'}
                                    </Button>
                                </div>
                            </AlertContent>
                        </Alert>
                    )}

                    {toast && (
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
                    )}
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
