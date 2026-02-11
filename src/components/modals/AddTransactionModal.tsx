"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useUser } from '@/contexts/UserContext';
import { Transaction } from '@/types/transactions';
import { MultiStepTransactionForm } from '@/components/ui/multistep-form';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tx: Omit<Transaction, 'id'>) => Promise<void>;
}

export function AddTransactionModal({ isOpen, onClose, onSave }: AddTransactionModalProps) {
    const { currentUser } = useUser();
    const [loading, setLoading] = useState(false);
    const [initialType] = useState<'income' | 'expense'>('expense');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Transaction" headerVariant="close-only">
            <MultiStepTransactionForm
                initialType={initialType}
                loading={loading}
                onSubmit={async (tx: Omit<Transaction, 'id'>) => {
                    if (!currentUser) return;
                    setLoading(true);
                    try {
                        await onSave(tx);
                        onClose();
                    } finally {
                        setLoading(false);
                    }
                }}
            />
        </Modal>
    );
}
