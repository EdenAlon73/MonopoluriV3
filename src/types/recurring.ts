import { Transaction } from '@/types/transactions';

export type RecurringFrequency = Exclude<Transaction['frequency'], 'one-time'>;

export type RecurringStatus = 'active' | 'paused';

export interface RecurringTransaction {
    id: string;
    name: string;
    amount: number;
    type: Transaction['type'];
    categoryId: string;
    categoryName?: string;
    ownerId: string | null;
    ownerType: Transaction['ownerType'];
    frequency: RecurringFrequency;
    startDate: string;
    endDate?: string | null;
    anchorDay: number;
    status: RecurringStatus;
    createdAt?: unknown;
    updatedAt?: unknown;
}

export type RecurringExceptionKind = 'manual-delete' | 'pause-skip';

export interface RecurringException {
    id: string;
    recurrenceId: string;
    date: string;
    kind: RecurringExceptionKind;
    createdAt?: unknown;
}
