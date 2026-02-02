"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useUser } from '@/contexts/UserContext';
import { Goal } from '@/types/goals';
import { MultiStepGoalForm } from '@/components/ui/multistep-goal-form';

interface AddGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Omit<Goal, 'id'>) => Promise<void>;
}

export function AddGoalModal({ isOpen, onClose, onSave }: AddGoalModalProps) {
    const { currentUser } = useUser();
    const [loading, setLoading] = useState(false);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Goal" headerVariant="close-only">
            <MultiStepGoalForm
                loading={loading}
                onSubmit={async (goal: Omit<Goal, 'id'>) => {
                    if (!currentUser) return;
                    setLoading(true);
                    try {
                        await onSave(goal);
                        onClose();
                    } finally {
                        setLoading(false);
                    }
                }}
            />
        </Modal>
    );
}
