"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { MultiStepTransactionForm } from "@/components/ui/multistep-form";
import { Transaction } from "@/types/transactions";
import { useUser } from "@/contexts/UserContext";

interface EditTransactionModalProps {
    isOpen: boolean;
    transaction: Transaction | null;
    onClose: () => void;
    onSave: (id: string, tx: Omit<Transaction, "id">) => Promise<void>;
}

export function EditTransactionModal({ isOpen, transaction, onClose, onSave }: EditTransactionModalProps) {
    const { currentUser } = useUser();
    const [loading, setLoading] = useState(false);

    if (!transaction) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaction" headerVariant="close-only">
            <MultiStepTransactionForm
                initialTransaction={transaction}
                loading={loading}
                onSubmit={async (tx: Omit<Transaction, "id">) => {
                    if (!currentUser) return;
                    setLoading(true);
                    try {
                        await onSave(transaction.id, tx);
                        onClose();
                    } finally {
                        setLoading(false);
                    }
                }}
                initialType={transaction.type}
            />
        </Modal>
    );
}
