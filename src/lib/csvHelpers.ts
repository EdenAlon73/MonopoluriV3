export function parseDelimitedCsv(text: string, delimiter: string = ','): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (insideQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    currentField += '"';
                    i++;
                } else {
                    insideQuotes = false;
                }
            } else {
                currentField += ch;
            }
            continue;
        }

        if (ch === '"') {
            insideQuotes = true;
            continue;
        }

        if (ch === delimiter) {
            currentRow.push(currentField.trim());
            currentField = '';
            continue;
        }

        if (ch === '\n') {
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
            continue;
        }

        if (ch !== '\r') {
            currentField += ch;
        }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    return rows.filter((row) => row.some((cell) => cell.trim().length > 0));
}

export function normalizeHeader(header: string): string {
    return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function toIsoDate(dateValue: string): string | null {
    const value = dateValue.trim();
    if (!value) return null;

    const yyyyMmDdMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyyMmDdMatch) {
        const year = Number(yyyyMmDdMatch[1]);
        const month = Number(yyyyMmDdMatch[2]);
        const day = Number(yyyyMmDdMatch[3]);
        const candidate = new Date(year, month - 1, day);
        if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null;
        return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
        const month = Number(slashMatch[1]);
        const day = Number(slashMatch[2]);
        const year = Number(slashMatch[3]);
        const candidate = new Date(year, month - 1, day);
        if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null;
        return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    const year = parsed.getFullYear();
    const month = parsed.getMonth() + 1;
    const day = parsed.getDate();
    return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export type ParsedAmount = {
    amount: number;
    hasSign: boolean;
    typeFromSign: 'income' | 'expense' | null;
};

export function parseAmount(rawAmount: string): ParsedAmount | null {
    const value = rawAmount.trim();
    if (!value) return null;

    const isNegative = /^\s*-/.test(value) || /^\s*\(.*\)\s*$/.test(value);
    const isPositive = /^\s*\+/.test(value);

    let numeric = value
        .replace(/[€$£₪]/g, '')
        .replace(/[()]/g, '')
        .replace(/\s+/g, '');

    const dotCount = (numeric.match(/\./g) || []).length;
    const commaCount = (numeric.match(/,/g) || []).length;
    if (commaCount > 0 && dotCount === 0) {
        const decimalCommaMatch = numeric.match(/^-?\d+,\d{1,2}$/);
        numeric = decimalCommaMatch ? numeric.replace(',', '.') : numeric.replace(/,/g, '');
    } else {
        numeric = numeric.replace(/,/g, '');
    }

    const parsed = Number.parseFloat(numeric);
    if (Number.isNaN(parsed)) return null;

    return {
        amount: Math.abs(parsed),
        hasSign: isNegative || isPositive,
        typeFromSign: isNegative ? 'expense' : isPositive ? 'income' : null,
    };
}

export function dateAmountSignature(date: string, amount: number): string {
    return `${date}::${Math.round(amount * 100)}`;
}
