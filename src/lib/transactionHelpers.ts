import { CATEGORIES } from '@/lib/constants';
import { Transaction } from '@/types/transactions';

type TxType = Transaction['type'];

const categoriesById = new Map(CATEGORIES.map((category) => [category.id, category]));
const categoriesByType: Record<TxType, Array<(typeof CATEGORIES)[number]>> = {
    income: CATEGORIES.filter((category) => category.type === 'income'),
    expense: CATEGORIES.filter((category) => category.type === 'expense'),
};

const fallbackCategories: Record<TxType, (typeof CATEGORIES)[number]> = {
    income: categoriesByType.income.find((category) => category.id === 'other') ?? categoriesByType.income[0],
    expense: categoriesByType.expense.find((category) => category.id === 'misc') ?? categoriesByType.expense[0],
};

export const TRANSACTION_CUTOFF_DATE = '2025-12-01';

export function resolveCategoryForTransaction(input: {
    type: TxType;
    categoryId?: string;
    categoryName?: string | null;
}) {
    const byId = input.categoryId ? categoriesById.get(input.categoryId) : undefined;
    if (byId && byId.type === input.type) {
        return byId;
    }

    if (input.categoryName) {
        const normalizedName = input.categoryName.trim().toLowerCase();
        const byName = categoriesByType[input.type].find(
            (category) => category.name.toLowerCase() === normalizedName || category.id.toLowerCase() === normalizedName,
        );
        if (byName) {
            return byName;
        }
    }

    return fallbackCategories[input.type];
}

export function normalizeTransactionCategoryFields<T extends { type: TxType; categoryId?: string; categoryName?: string | null }>(tx: T) {
    const resolvedCategory = resolveCategoryForTransaction(tx);
    return {
        ...tx,
        categoryId: resolvedCategory.id,
        categoryName: resolvedCategory.name,
    };
}

export function isTransactionOnOrAfterCutoff(date?: string) {
    return typeof date === 'string' && date >= TRANSACTION_CUTOFF_DATE;
}
