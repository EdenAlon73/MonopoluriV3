import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Transaction } from '@/types/transactions';
import { clampAnchorDay, generateRecurringDates, getNextRecurringDate as getNextRecurringDateForSeries } from '@/lib/recurringEngine';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Calculate the next date for a recurring transaction
 */
export function getNextRecurringDate(currentDate: string, frequency: Transaction['frequency']): string {
    if (frequency === 'one-time') return currentDate;
    const anchorDay = clampAnchorDay(Number(currentDate.split('-')[2] ?? 1));
    return getNextRecurringDateForSeries(currentDate, frequency, anchorDay);
}

/**
 * Generate future recurring transaction instances
 * @param baseTransaction - The base transaction to generate instances from
 * @param weeksAhead - Number of weeks to generate ahead (default: 52 for 1 year)
 */
export function generateRecurringInstances(
    baseTransaction: Omit<Transaction, 'id'>,
    weeksAhead: number = 52
): Omit<Transaction, 'id'>[] {
    if (baseTransaction.frequency === 'one-time') {
        return [];
    }

    const endDate = new Date(baseTransaction.date);
    endDate.setDate(endDate.getDate() + (weeksAhead * 7));
    const horizon = endDate.toISOString().split('T')[0];
    const anchorDay = clampAnchorDay(Number(baseTransaction.date.split('-')[2] ?? 1));
    const dates = generateRecurringDates({
        frequency: baseTransaction.frequency,
        startDate: baseTransaction.date,
        anchorDay,
        fromDate: baseTransaction.date,
        toDate: horizon,
    }).filter((date) => date !== baseTransaction.date);

    return dates.map((date) => ({
        ...baseTransaction,
        date,
    }));
}
