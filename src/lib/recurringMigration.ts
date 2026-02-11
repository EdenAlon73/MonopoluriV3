import {
    collection,
    deleteField,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RecurringFrequency } from '@/types/recurring';
import { Transaction } from '@/types/transactions';
import { clampAnchorDay } from '@/lib/recurringEngine';
import { resolveCategoryForTransaction } from '@/lib/transactionHelpers';

const TRANSACTIONS_COLLECTION = 'transactions';
const RECURRING_COLLECTION = 'recurringTransactions';
const MIGRATION_RUNS_COLLECTION = 'migrationRuns';
const MAX_BATCH_OPS = 450;
const MIGRATION_NAME = 'legacy-recurring-v1';
const VALID_RECURRING_FREQUENCIES: RecurringFrequency[] = ['daily', 'weekly', 'bi-weekly', 'monthly'];

type LegacyTransaction = {
    id: string;
    name: string;
    amount: number;
    type: Transaction['type'];
    categoryId: string;
    categoryName?: string;
    ownerId: string | null;
    ownerType: Transaction['ownerType'];
    date: string;
    frequency: Transaction['frequency'];
    parentTransactionId?: string;
    recurrenceId?: string;
    occurrenceDate?: string;
};

type LegacySeries = {
    root: LegacyTransaction;
    occurrences: LegacyTransaction[];
};

export type RecurringMigrationPreview = {
    migrationName: string;
    legacyRootSeriesCount: number;
    legacyOccurrenceCount: number;
    existingRecurringSeriesCount: number;
    seriesToCreateCount: number;
    occurrencesToUpdateCount: number;
};

export type RecurringMigrationResult = RecurringMigrationPreview & {
    createdOrUpdatedSeriesCount: number;
    updatedOccurrencesCount: number;
    runId: string;
};

function coerceFrequency(value: unknown): Transaction['frequency'] {
    if (value === 'daily' || value === 'weekly' || value === 'bi-weekly' || value === 'monthly' || value === 'one-time') {
        return value;
    }
    return 'one-time';
}

function coerceRecurringFrequency(value: unknown): RecurringFrequency {
    if (VALID_RECURRING_FREQUENCIES.includes(value as RecurringFrequency)) {
        return value as RecurringFrequency;
    }
    return 'monthly';
}

function toLegacyTransaction(id: string, raw: Record<string, unknown>): LegacyTransaction {
    const type: Transaction['type'] = raw.type === 'income' ? 'income' : 'expense';
    const resolvedCategory = resolveCategoryForTransaction({
        type,
        categoryId: typeof raw.categoryId === 'string' ? raw.categoryId : undefined,
        categoryName: typeof raw.categoryName === 'string' ? raw.categoryName : undefined,
    });

    return {
        id,
        name: typeof raw.name === 'string' ? raw.name : '',
        amount: typeof raw.amount === 'number' ? raw.amount : Number(raw.amount ?? 0),
        type,
        categoryId: resolvedCategory.id,
        categoryName: resolvedCategory.name,
        ownerId: typeof raw.ownerId === 'string' || raw.ownerId === null ? raw.ownerId : 'shared',
        ownerType: raw.ownerType === 'individual' ? 'individual' : 'shared',
        date: typeof raw.date === 'string' ? raw.date : '',
        frequency: coerceFrequency(raw.frequency),
        parentTransactionId: typeof raw.parentTransactionId === 'string' ? raw.parentTransactionId : undefined,
        recurrenceId: typeof raw.recurrenceId === 'string' ? raw.recurrenceId : undefined,
        occurrenceDate: typeof raw.occurrenceDate === 'string' ? raw.occurrenceDate : undefined,
    };
}

async function buildLegacySeries() {
    const [transactionsSnapshot, recurringSnapshot] = await Promise.all([
        getDocs(query(collection(db, TRANSACTIONS_COLLECTION))),
        getDocs(query(collection(db, RECURRING_COLLECTION))),
    ]);

    const allTransactions = transactionsSnapshot.docs.map((docSnapshot) => (
        toLegacyTransaction(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
    ));
    const recurringIds = new Set(recurringSnapshot.docs.map((docSnapshot) => docSnapshot.id));

    const childrenByParent = new Map<string, LegacyTransaction[]>();
    for (const tx of allTransactions) {
        if (!tx.parentTransactionId) continue;
        const bucket = childrenByParent.get(tx.parentTransactionId) ?? [];
        bucket.push(tx);
        childrenByParent.set(tx.parentTransactionId, bucket);
    }

    const legacyRoots = allTransactions.filter((tx) => !tx.parentTransactionId && tx.frequency !== 'one-time');
    const series: LegacySeries[] = legacyRoots.map((root) => ({
        root,
        occurrences: [root, ...(childrenByParent.get(root.id) ?? [])],
    }));

    return {
        series,
        recurringIds,
    };
}

function countOccurrencesToUpdate(series: LegacySeries[]) {
    let updates = 0;
    for (const item of series) {
        const recurrenceId = item.root.id;
        for (const occurrence of item.occurrences) {
            const needsUpdate = (
                occurrence.recurrenceId !== recurrenceId
                || occurrence.frequency !== 'one-time'
                || occurrence.parentTransactionId !== undefined
                || occurrence.occurrenceDate !== occurrence.date
            );
            if (needsUpdate) {
                updates++;
            }
        }
    }
    return updates;
}

export async function previewLegacyRecurringMigration(): Promise<RecurringMigrationPreview> {
    const { series, recurringIds } = await buildLegacySeries();

    return {
        migrationName: MIGRATION_NAME,
        legacyRootSeriesCount: series.length,
        legacyOccurrenceCount: series.reduce((sum, item) => sum + item.occurrences.length, 0),
        existingRecurringSeriesCount: series.filter((item) => recurringIds.has(item.root.id)).length,
        seriesToCreateCount: series.filter((item) => !recurringIds.has(item.root.id)).length,
        occurrencesToUpdateCount: countOccurrencesToUpdate(series),
    };
}

export async function runLegacyRecurringMigration(runByUserId: string | null): Promise<RecurringMigrationResult> {
    const { series, recurringIds } = await buildLegacySeries();
    const now = Date.now();
    const runId = `${MIGRATION_NAME}-${now}`;

    let createdOrUpdatedSeriesCount = 0;
    let updatedOccurrencesCount = 0;

    for (const item of series) {
        const recurrenceId = item.root.id;
        const frequency = coerceRecurringFrequency(item.root.frequency);
        const anchorDay = clampAnchorDay(Number(item.root.date.split('-')[2] ?? 1));
        const recurrenceRef = doc(db, RECURRING_COLLECTION, recurrenceId);

        await setDoc(recurrenceRef, {
            name: item.root.name,
            amount: item.root.amount,
            type: item.root.type,
            categoryId: item.root.categoryId,
            categoryName: item.root.categoryName,
            ownerId: item.root.ownerId,
            ownerType: item.root.ownerType,
            frequency,
            startDate: item.root.date,
            endDate: null,
            anchorDay,
            status: 'active',
            migratedFromLegacy: true,
            legacyRootTransactionId: item.root.id,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        }, { merge: true });

        createdOrUpdatedSeriesCount++;

        let batch = writeBatch(db);
        let ops = 0;
        for (const occurrence of item.occurrences) {
            const occurrenceRef = doc(db, TRANSACTIONS_COLLECTION, occurrence.id);
            const needsUpdate = (
                occurrence.recurrenceId !== recurrenceId
                || occurrence.frequency !== 'one-time'
                || occurrence.parentTransactionId !== undefined
                || occurrence.occurrenceDate !== occurrence.date
            );
            if (!needsUpdate) continue;

            batch.update(occurrenceRef, {
                recurrenceId,
                occurrenceDate: occurrence.date,
                frequency: 'one-time',
                parentTransactionId: deleteField(),
                updatedAt: serverTimestamp(),
            });
            ops++;
            updatedOccurrencesCount++;

            if (ops >= MAX_BATCH_OPS) {
                await batch.commit();
                batch = writeBatch(db);
                ops = 0;
            }
        }
        if (ops > 0) {
            await batch.commit();
        }
    }

    const result: RecurringMigrationResult = {
        migrationName: MIGRATION_NAME,
        legacyRootSeriesCount: series.length,
        legacyOccurrenceCount: series.reduce((sum, item) => sum + item.occurrences.length, 0),
        existingRecurringSeriesCount: series.filter((item) => recurringIds.has(item.root.id)).length,
        seriesToCreateCount: series.filter((item) => !recurringIds.has(item.root.id)).length,
        occurrencesToUpdateCount: countOccurrencesToUpdate(series),
        createdOrUpdatedSeriesCount,
        updatedOccurrencesCount,
        runId,
    };

    await setDoc(doc(db, MIGRATION_RUNS_COLLECTION, runId), {
        runByUserId,
        createdAt: serverTimestamp(),
        ...result,
    });

    return result;
}
