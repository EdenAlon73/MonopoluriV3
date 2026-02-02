/**
 * Test script for recurring transactions
 * This can be run manually to verify recurring transaction logic
 */

import { generateRecurringInstances, getNextRecurringDate } from './utils';
import { Transaction } from '@/types/transactions';

// Test weekly recurring transactions
export function testWeeklyRecurring() {
    const baseTransaction: Omit<Transaction, 'id'> = {
        name: 'Weekly Groceries',
        amount: 150,
        type: 'expense',
        categoryId: 'groceries',
        categoryName: 'Groceries',
        ownerId: 'shared',
        ownerType: 'shared',
        date: '2026-01-14', // Today
        frequency: 'weekly',
        hasReceipt: false
    };

    console.log('=== Testing Weekly Recurring Transaction ===');
    console.log('Base Transaction:', baseTransaction);
    console.log('\nGenerating instances for next 4 weeks...\n');

    // Generate instances for the next 4 weeks
    const instances = generateRecurringInstances(baseTransaction, 4);

    console.log(`Generated ${instances.length} future instances:\n`);
    instances.forEach((instance, index) => {
        console.log(`${index + 1}. ${instance.date} - ${instance.name} - €${instance.amount}`);
    });

    // Verify dates are correct
    console.log('\n=== Verifying Weekly Increment ===');
    let currentDate = baseTransaction.date;
    for (let i = 0; i < 4; i++) {
        const nextDate = getNextRecurringDate(currentDate, 'weekly');
        console.log(`Week ${i + 1}: ${currentDate} -> ${nextDate}`);
        currentDate = nextDate;
    }

    return instances;
}

// Test all frequencies
export function testAllFrequencies() {
    console.log('\n=== Testing All Frequencies ===\n');
    
    const startDate = '2026-01-14';
    const frequencies: Transaction['frequency'][] = ['daily', 'weekly', 'bi-weekly', 'monthly', 'one-time'];
    
    frequencies.forEach(freq => {
        const nextDate = getNextRecurringDate(startDate, freq);
        console.log(`${freq.padEnd(12)} : ${startDate} -> ${nextDate}`);
    });
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
    console.log('Recurring Transaction Tests\n');
    testWeeklyRecurring();
    testAllFrequencies();
}
