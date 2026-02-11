import { RecurringFrequency, RecurringTransaction } from '@/types/recurring';
import { Transaction } from '@/types/transactions';

export const RECURRING_HORIZON_MONTHS = 24;

type DateParts = {
    year: number;
    month: number; // 1-12
    day: number;
};

function parseIsoDate(value: string): DateParts | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { year, month, day };
}

function toIsoDate(parts: DateParts): string {
    return `${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addDays(value: string, days: number): string {
    const parsed = parseIsoDate(value);
    if (!parsed) return value;
    const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
    date.setUTCDate(date.getUTCDate() + days);
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    return toIsoDate({ year: y, month: m, day: d });
}

function addMonths(value: string, months: number): string {
    const parsed = parseIsoDate(value);
    if (!parsed) return value;
    const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
    date.setUTCMonth(date.getUTCMonth() + months);
    return toIsoDate({
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
    });
}

function compareIsoDate(a: string, b: string): number {
    if (a === b) return 0;
    return a < b ? -1 : 1;
}

export function clampAnchorDay(anchorDay: number): number {
    if (!Number.isInteger(anchorDay)) return 1;
    if (anchorDay < 1) return 1;
    if (anchorDay > 31) return 31;
    return anchorDay;
}

export function resolveMonthlyDateForMonth(year: number, month: number, anchorDay: number): string {
    const normalizedAnchor = clampAnchorDay(anchorDay);
    const monthMax = daysInMonth(year, month);
    const day = normalizedAnchor <= monthMax ? normalizedAnchor : 1;
    return toIsoDate({ year, month, day });
}

export function getNextRecurringDate(currentDate: string, frequency: RecurringFrequency, anchorDay?: number): string {
    switch (frequency) {
        case 'daily':
            return addDays(currentDate, 1);
        case 'weekly':
            return addDays(currentDate, 7);
        case 'bi-weekly':
            return addDays(currentDate, 14);
        case 'monthly': {
            const nextMonth = addMonths(currentDate, 1);
            const parts = parseIsoDate(nextMonth);
            if (!parts) return currentDate;
            const anchor = typeof anchorDay === 'number' ? anchorDay : parts.day;
            return resolveMonthlyDateForMonth(parts.year, parts.month, anchor);
        }
        default:
            return currentDate;
    }
}

export function getDefaultHorizonEnd(todayIsoDate: string): string {
    const parsed = parseIsoDate(todayIsoDate);
    if (!parsed) return todayIsoDate;
    const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
    date.setUTCMonth(date.getUTCMonth() + RECURRING_HORIZON_MONTHS);
    return toIsoDate({
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
    });
}

type GenerateRecurringDateInput = {
    frequency: RecurringFrequency;
    startDate: string;
    endDate?: string | null;
    anchorDay: number;
    fromDate: string;
    toDate: string;
    excludedDates?: Set<string>;
};

export function generateRecurringDates(input: GenerateRecurringDateInput): string[] {
    const start = input.startDate;
    if (!start) return [];

    const maxEnd = input.endDate && compareIsoDate(input.endDate, input.toDate) < 0 ? input.endDate : input.toDate;
    const rangeStart = compareIsoDate(input.fromDate, start) > 0 ? input.fromDate : start;
    if (compareIsoDate(rangeStart, maxEnd) > 0) return [];

    const excluded = input.excludedDates ?? new Set<string>();
    const dates: string[] = [];

    if (input.frequency === 'monthly') {
        const startParts = parseIsoDate(start);
        if (!startParts) return [];

        let year = startParts.year;
        let month = startParts.month;

        while (true) {
            const currentMonthDate = year === startParts.year && month === startParts.month
                ? start
                : resolveMonthlyDateForMonth(year, month, input.anchorDay);

            if (compareIsoDate(currentMonthDate, maxEnd) > 0) break;

            if (compareIsoDate(currentMonthDate, rangeStart) >= 0 && !excluded.has(currentMonthDate)) {
                dates.push(currentMonthDate);
            }

            month += 1;
            if (month > 12) {
                month = 1;
                year += 1;
            }
        }
        return dates;
    }

    let cursor = start;
    while (compareIsoDate(cursor, maxEnd) <= 0) {
        if (compareIsoDate(cursor, rangeStart) >= 0 && !excluded.has(cursor)) {
            dates.push(cursor);
        }
        const next = getNextRecurringDate(cursor, input.frequency, input.anchorDay);
        if (next === cursor) break;
        cursor = next;
    }

    return dates;
}

export function toTransactionFromRecurring(recurrence: RecurringTransaction, date: string): Omit<Transaction, 'id'> {
    return {
        name: recurrence.name,
        amount: recurrence.amount,
        type: recurrence.type,
        categoryId: recurrence.categoryId,
        categoryName: recurrence.categoryName,
        ownerId: recurrence.ownerId,
        ownerType: recurrence.ownerType,
        date,
        occurrenceDate: date,
        recurrenceId: recurrence.id,
        frequency: 'one-time',
        hasReceipt: false,
    };
}

