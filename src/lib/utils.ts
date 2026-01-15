import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Transaction } from '@/types/transactions';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Calculate the next date for a recurring transaction
 */
export function getNextRecurringDate(currentDate: string, frequency: Transaction['frequency']): string {
    const date = new Date(currentDate);
    
    switch (frequency) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'bi-weekly':
            date.setDate(date.getDate() + 14);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'one-time':
        default:
            return currentDate;
    }
    
    return date.toISOString().split('T')[0];
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

    const instances: Omit<Transaction, 'id'>[] = [];
    let currentDate = baseTransaction.date;
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + (weeksAhead * 7));

    while (new Date(currentDate) <= endDate) {
        currentDate = getNextRecurringDate(currentDate, baseTransaction.frequency);
        
        if (new Date(currentDate) <= endDate) {
            instances.push({
                ...baseTransaction,
                date: currentDate,
            });
        }
    }

    return instances;
}
