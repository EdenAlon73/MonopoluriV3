"use client";

import React, { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CATEGORIES } from '@/lib/constants';
import {
    BankImportResolution,
    BankImportReviewRow,
    BankRow,
    buildBankImportReviewRows,
    categoryNameFor,
} from '@/lib/bankCsvImport';
import { Transaction } from '@/types/transactions';

interface BankImportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    rows: BankRow[];
    existingTransactions: Transaction[];
    skippedInvalid: number;
    onConfirm: (rowsToImport: BankRow[]) => Promise<void>;
    importing: boolean;
}

type EditableRow = BankImportReviewRow & {
    included: boolean;
    resolution: BankImportResolution;
};

function buildInitialRows(rows: BankRow[], existingTransactions: Transaction[]): EditableRow[] {
    return buildBankImportReviewRows(rows, existingTransactions).map((row) => ({
        ...row,
        included: row.matches.length === 0,
        resolution: null,
    }));
}

function toBankRow(row: EditableRow): BankRow {
    return {
        date: row.date,
        name: row.name,
        amount: row.amount,
        type: row.type,
        rawDescription: row.rawDescription,
        rawRecipient: row.rawRecipient,
        rawMessage: row.rawMessage,
        suggestedCategoryId: row.suggestedCategoryId,
        categoryId: row.categoryId,
    };
}

function matchBadgeClass(matchKind: 'exact' | 'possible') {
    return matchKind === 'exact'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-blue-100 text-blue-800';
}

function ownerLabel(tx: Pick<Transaction, 'ownerType' | 'ownerId'>) {
    if (tx.ownerType === 'shared') return 'Shared';
    if (tx.ownerId === 'eden') return 'Eden';
    if (tx.ownerId === 'sivan') return 'Sivan';
    return 'Individual';
}

export function BankImportPreviewModal({
    isOpen,
    onClose,
    rows,
    existingTransactions,
    skippedInvalid,
    onConfirm,
    importing,
}: BankImportPreviewModalProps) {
    const [editableRows, setEditableRows] = useState<EditableRow[]>(() =>
        buildInitialRows(rows, existingTransactions)
    );
    const [rowsSignature, setRowsSignature] = useState<BankRow[]>(rows);
    const [transactionsSignature, setTransactionsSignature] = useState<Transaction[]>(existingTransactions);

    if (rows !== rowsSignature || existingTransactions !== transactionsSignature) {
        setRowsSignature(rows);
        setTransactionsSignature(existingTransactions);
        setEditableRows(buildInitialRows(rows, existingTransactions));
    }

    const matchedCount = useMemo(
        () => editableRows.filter((r) => r.matches.length > 0).length,
        [editableRows]
    );
    const exactCount = useMemo(
        () => editableRows.filter((r) => r.matchKind === 'exact').length,
        [editableRows]
    );
    const unresolvedCount = useMemo(
        () => editableRows.filter((r) => r.matches.length > 0 && r.resolution === null).length,
        [editableRows]
    );
    const includedCount = useMemo(
        () => editableRows.filter((r) => r.matches.length === 0 ? r.included : r.resolution === 'import').length,
        [editableRows]
    );

    const updateCategory = (id: string, newCategoryId: string) => {
        setEditableRows((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                const cat = CATEGORIES.find((c) => c.id === newCategoryId && c.type === r.type);
                if (!cat) return r;
                return {
                    ...r,
                    categoryId: newCategoryId,
                };
            })
        );
    };

    const toggleIncluded = (id: string) => {
        setEditableRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, included: !r.included } : r))
        );
    };

    const setResolution = (id: string, resolution: Exclude<BankImportResolution, null>) => {
        setEditableRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, resolution, included: resolution === 'import' } : r))
        );
    };

    const handleConfirm = async () => {
        const toImport = editableRows
            .filter((r) => r.matches.length === 0 ? r.included : r.resolution === 'import')
            .map(toBankRow);
        await onConfirm(toImport);
    };

    const statusLine = `${editableRows.length} rows - ${matchedCount} match${matchedCount === 1 ? '' : 'es'} (${exactCount} exact) - ${skippedInvalid} invalid skipped`;
    const importDisabled = importing || unresolvedCount > 0 || includedCount === 0;
    const importLabel = unresolvedCount > 0
        ? `Resolve ${unresolvedCount} match${unresolvedCount === 1 ? '' : 'es'}`
        : importing
            ? 'Importing...'
            : `Import ${includedCount} row${includedCount === 1 ? '' : 's'}`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Bank CSV preview"
            maxWidthClass="max-w-5xl"
        >
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                    <span>{statusLine}</span>
                    {unresolvedCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-xs px-2 py-1">
                            Resolve {unresolvedCount} before import
                        </span>
                    )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                    {editableRows.map((row) => {
                        const selectableCategories = CATEGORIES.filter((c) => c.type === row.type);
                        const isMatched = row.matches.length > 0;
                        const resolvedImport = row.resolution === 'import';
                        const resolvedSkip = row.resolution === 'skip';
                        const muted = (!isMatched && !row.included) || resolvedSkip;

                        return (
                            <div
                                key={row.id}
                                className={`rounded-lg border bg-white p-3 text-sm ${muted ? 'opacity-60' : ''} ${isMatched ? 'border-amber-200' : 'border-gray-200'}`}
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_12rem_8rem] gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {!isMatched && (
                                                <input
                                                    type="checkbox"
                                                    checked={row.included}
                                                    onChange={() => toggleIncluded(row.id)}
                                                    disabled={importing}
                                                    className="h-4 w-4 accent-[#0073ea]"
                                                    aria-label={`Include ${row.name}`}
                                                />
                                            )}
                                            <span className="font-medium text-gray-900 truncate" title={row.name}>
                                                {row.name}
                                            </span>
                                            {row.matchKind ? (
                                                <span className={`inline-flex items-center rounded-full text-xs px-2 py-0.5 ${matchBadgeClass(row.matchKind)}`}>
                                                    {row.matchKind === 'exact' ? 'Exact match' : 'Possible match'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                                            <span>{row.date}</span>
                                            <span className={row.type === 'expense' ? 'text-[#e2445c]' : 'text-[#258750]'}>
                                                {row.type === 'expense' ? '-' : '+'}{row.amount.toFixed(2)}
                                            </span>
                                            {row.rawMessage && (
                                                <span className="truncate max-w-full" title={row.rawMessage}>
                                                    {row.rawMessage}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <select
                                            value={row.categoryId}
                                            onChange={(e) => updateCategory(row.id, e.target.value)}
                                            disabled={importing}
                                            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-white"
                                        >
                                            {selectableCategories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        {row.categoryId !== row.suggestedCategoryId && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                was: {categoryNameFor(row.suggestedCategoryId)}
                                            </div>
                                        )}
                                    </div>

                                    {isMatched ? (
                                        <div className="flex lg:flex-col gap-2">
                                            <Button
                                                variant={resolvedImport ? 'primary' : 'secondary'}
                                                size="sm"
                                                onClick={() => setResolution(row.id, 'import')}
                                                disabled={importing}
                                                className="flex-1"
                                            >
                                                Import anyway
                                            </Button>
                                            <Button
                                                variant={resolvedSkip ? 'primary' : 'ghost'}
                                                size="sm"
                                                onClick={() => setResolution(row.id, 'skip')}
                                                disabled={importing}
                                                className="flex-1"
                                            >
                                                Skip bank row
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="hidden lg:block" />
                                    )}
                                </div>

                                {isMatched && (
                                    <div className="mt-3 rounded-md bg-amber-50 border border-amber-100 p-2">
                                        <div className="text-xs font-medium text-amber-900 mb-2">
                                            Existing transaction{row.matches.length === 1 ? '' : 's'} to review
                                        </div>
                                        <div className="space-y-2">
                                            {row.matches.map((match) => (
                                                <div key={match.id} className="grid grid-cols-1 sm:grid-cols-[1fr_6rem_7rem_6rem] gap-1 text-xs text-gray-700">
                                                    <span className="font-medium truncate" title={match.name}>
                                                        {match.name || 'Unnamed transaction'}
                                                    </span>
                                                    <span>{match.date}</span>
                                                    <span className={match.type === 'expense' ? 'text-[#e2445c]' : 'text-[#258750]'}>
                                                        {match.type === 'expense' ? '-' : '+'}{match.amount.toFixed(2)}
                                                    </span>
                                                    <span>{ownerLabel(match)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button variant="ghost" onClick={onClose} disabled={importing}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={importDisabled}
                    >
                        {importLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
