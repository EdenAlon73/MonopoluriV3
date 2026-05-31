import { parseDelimitedCsv, normalizeHeader, toIsoDate, parseAmount } from '@/lib/csvHelpers';
import { CATEGORIES } from '@/lib/constants';
import { Transaction } from '@/types/transactions';

export const BANK_HEADERS = {
    entryDate: 'entrydate',
    valueDate: 'valuedate',
    amount: 'amounteur',
    code: 'code',
    description: 'description',
    recipient: 'recipientpayer',
    message: 'message',
} as const;

export type BankRow = {
    date: string;
    name: string;
    amount: number;
    type: 'income' | 'expense';
    rawDescription: string;
    rawRecipient: string;
    rawMessage: string;
    suggestedCategoryId: string;
    categoryId: string;
};

export type ParseBankCsvResult = {
    rows: BankRow[];
    skippedInvalid: number;
};

export type BankImportMatchKind = 'exact' | 'possible';

export type BankImportMatch = {
    id: string;
    name: string;
    date: string;
    amount: number;
    type: 'income' | 'expense';
    categoryId?: string;
    categoryName?: string;
    ownerId: string | null;
    ownerType: 'individual' | 'shared';
    kind: BankImportMatchKind;
    dayDelta: number;
};

export type BankImportReviewRow = BankRow & {
    id: string;
    matches: BankImportMatch[];
    matchKind: BankImportMatchKind | null;
};

export type BankImportResolution = 'import' | 'skip' | null;

type KeywordRule = {
    categoryId: string;
    keywords: string[];
};

const POSSIBLE_MATCH_WINDOW_DAYS = 3;

const EXPENSE_RULES: KeywordRule[] = [
    { categoryId: 'groceries', keywords: ['k-market', 'k-citymarket', 'k-supermarket', 'lidl', 'tokmanni', 'ruohonjuuri', 'happy sunshine', 'fida', 'prisma'] },
    { categoryId: 'food', keywords: ['wolt', 'espresso house', 'joe  the juice', 'joe the juice', 'green hippo', 'compass group', 'zettle_*belle', 'fuji biyori', 'woolshed', 'kiitti sulle', 'can ning'] },
    { categoryId: 'subscriptions', keywords: ['netflix', 'apple.com/bill', 'itunes', 'spotify', 'icloud', 'youtube premium', 'chatgpt', 'openai'] },
    { categoryId: 'transport', keywords: ['hsl mobiili', 'hsl', 'vr.fi', 'taksi', 'uber', 'bolt'] },
    { categoryId: 'utilities', keywords: ['elisa oyj', 'helen oy', 'dna oyj', 'telia'] },
    { categoryId: 'travel', keywords: ['radisson', 'tallink', 'airbnb', 'booking.com', 'finnair', 'fever*'] },
    { categoryId: 'entertainment', keywords: ['candlelight', 'finnkino', 'cinema'] },
    { categoryId: 'health', keywords: ['apotek', 'yliopiston apteek', 'terveystalo', 'mehilainen'] },
    { categoryId: 'shopping', keywords: ['zara', 'muji', 'kicks', 'clas ohlson', 'verkkokauppa', 'aliexpress', 'notino', 'jysk', 'synsam', 'alko', 'papershop'] },
    { categoryId: 'housing', keywords: ['kim lindholm', 'rent'] },
];

const INCOME_RULES: KeywordRule[] = [
    { categoryId: 'salary', keywords: ['salary', 'alon eden'] },
    { categoryId: 'gift', keywords: ['gift'] },
    { categoryId: 'refunds', keywords: ['refund'] },
];

function collapseWhitespace(s: string): string {
    return s.replace(/\s+/g, ' ').trim();
}

export function inferCategoryId(
    rawRecipient: string,
    rawDescription: string,
    rawMessage: string,
    type: 'income' | 'expense',
): string {
    const haystack = `${rawRecipient} ${rawDescription} ${rawMessage}`.toLowerCase();
    const rules = type === 'income' ? INCOME_RULES : EXPENSE_RULES;

    for (const rule of rules) {
        for (const keyword of rule.keywords) {
            if (haystack.includes(keyword)) {
                const match = CATEGORIES.find((c) => c.id === rule.categoryId && c.type === type);
                if (match) return match.id;
            }
        }
    }

    return type === 'income' ? 'other' : 'misc';
}

function stripMessagePrefix(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.toLowerCase().startsWith('message:')) {
        return trimmed.slice(8).trim();
    }
    return trimmed;
}

export function isBankCsv(text: string): boolean {
    const firstLine = text.split(/\r?\n/)[0] ?? '';
    const lower = firstLine.toLowerCase();
    return lower.includes('entrydate') && lower.includes('amount') && firstLine.includes(';');
}

export function parseBankCsv(text: string): ParseBankCsvResult {
    const rows = parseDelimitedCsv(text, ';');
    if (rows.length < 2) {
        return { rows: [], skippedInvalid: 0 };
    }

    const headerRow = rows[0].map(normalizeHeader);
    const findIdx = (candidates: string[]) => headerRow.findIndex((h) => candidates.includes(h));

    const dateIdx = findIdx([BANK_HEADERS.entryDate, BANK_HEADERS.valueDate]);
    const amountIdx = findIdx([BANK_HEADERS.amount, 'amount']);
    const descriptionIdx = findIdx([BANK_HEADERS.description]);
    const recipientIdx = findIdx([BANK_HEADERS.recipient, 'recipient']);
    const messageIdx = findIdx([BANK_HEADERS.message]);

    if (dateIdx === -1 || amountIdx === -1) {
        return { rows: [], skippedInvalid: 0 };
    }

    const parsed: BankRow[] = [];
    let skippedInvalid = 0;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every((cell) => !cell || !cell.trim())) continue;

        const dateRaw = row[dateIdx]?.trim() ?? '';
        const amountRaw = row[amountIdx]?.trim() ?? '';
        const descriptionRaw = descriptionIdx >= 0 ? (row[descriptionIdx]?.trim() ?? '') : '';
        const recipientRaw = recipientIdx >= 0 ? (row[recipientIdx]?.trim() ?? '') : '';
        const messageRaw = messageIdx >= 0 ? stripMessagePrefix(row[messageIdx]?.trim() ?? '') : '';

        const date = toIsoDate(dateRaw);
        const parsedAmount = parseAmount(amountRaw);

        if (!date || !parsedAmount || parsedAmount.amount <= 0) {
            skippedInvalid++;
            continue;
        }

        // Bank CSV convention: leading '-' = debit (expense); anything else (no prefix, or '+') = credit (income).
        const type: 'income' | 'expense' = amountRaw.trim().startsWith('-') ? 'expense' : 'income';

        const name = collapseWhitespace(recipientRaw || descriptionRaw || 'Transaction');
        const suggestedCategoryId = inferCategoryId(recipientRaw, descriptionRaw, messageRaw, type);

        parsed.push({
            date,
            name,
            amount: parsedAmount.amount,
            type,
            rawDescription: descriptionRaw,
            rawRecipient: recipientRaw,
            rawMessage: messageRaw,
            suggestedCategoryId,
            categoryId: suggestedCategoryId,
        });
    }

    return { rows: parsed, skippedInvalid };
}

export function categoryNameFor(categoryId: string): string {
    return CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId;
}

function amountCents(amount: number): number {
    return Math.round(amount * 100);
}

function isoDateToUtcTime(date: string): number | null {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!year || !month || !day) return null;

    return Date.UTC(year, month - 1, day);
}

function dayDistance(a: string, b: string): number | null {
    const aTime = isoDateToUtcTime(a);
    const bTime = isoDateToUtcTime(b);
    if (aTime === null || bTime === null) return null;
    return Math.abs(Math.round((aTime - bTime) / 86_400_000));
}

export function buildBankImportReviewRows(
    rows: BankRow[],
    existingTransactions: Transaction[],
): BankImportReviewRow[] {
    return rows.map((row, idx) => {
        const rowCents = amountCents(row.amount);
        const matches = existingTransactions
            .map<BankImportMatch | null>((tx) => {
                if (!tx.date || tx.type !== row.type) return null;
                if (amountCents(tx.amount) !== rowCents) return null;

                const delta = dayDistance(row.date, tx.date);
                if (delta === null || delta > POSSIBLE_MATCH_WINDOW_DAYS) return null;

                return {
                    id: tx.id,
                    name: tx.name,
                    date: tx.date,
                    amount: tx.amount,
                    type: tx.type,
                    categoryId: tx.categoryId,
                    categoryName: tx.categoryName,
                    ownerId: tx.ownerId,
                    ownerType: tx.ownerType,
                    kind: delta === 0 ? 'exact' : 'possible',
                    dayDelta: delta,
                };
            })
            .filter((match): match is BankImportMatch => Boolean(match))
            .sort((a, b) => {
                if (a.kind !== b.kind) return a.kind === 'exact' ? -1 : 1;
                if (a.dayDelta !== b.dayDelta) return a.dayDelta - b.dayDelta;
                return b.date.localeCompare(a.date);
            });

        const matchKind = matches.some((match) => match.kind === 'exact')
            ? 'exact'
            : matches.length > 0
                ? 'possible'
                : null;

        return {
            ...row,
            id: `${idx}-${row.date}-${row.type}-${rowCents}`,
            matches,
            matchKind,
        };
    });
}
