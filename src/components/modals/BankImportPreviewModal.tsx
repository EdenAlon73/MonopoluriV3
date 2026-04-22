"use client";

import React, { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CATEGORIES } from '@/lib/constants';
import { BankRow, categoryNameFor } from '@/lib/bankCsvImport';
import { dateAmountSignature } from '@/lib/csvHelpers';

interface BankImportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    rows: BankRow[];
    existingSignatures: Set<string>;
    skippedInvalid: number;
    onConfirm: (rowsToImport: BankRow[]) => Promise<void>;
    importing: boolean;
}

type EditableRow = BankRow & {
    id: string;
    isDuplicate: boolean;
    included: boolean;
};

function buildInitialRows(rows: BankRow[], existingSignatures: Set<string>): EditableRow[] {
    return rows.map((row, idx) => {
        const isDuplicate = existingSignatures.has(dateAmountSignature(row.date, row.amount));
        return {
            ...row,
            id: `${idx}-${row.date}-${row.amount}`,
            isDuplicate,
            included: !isDuplicate,
        };
    });
}

export function BankImportPreviewModal({
    isOpen,
    onClose,
    rows,
    existingSignatures,
    skippedInvalid,
    onConfirm,
    importing,
}: BankImportPreviewModalProps) {
    const [editableRows, setEditableRows] = useState<EditableRow[]>(() =>
        buildInitialRows(rows, existingSignatures)
    );
    const [rowsSignature, setRowsSignature] = useState<BankRow[]>(rows);

    if (rows !== rowsSignature) {
        setRowsSignature(rows);
        setEditableRows(buildInitialRows(rows, existingSignatures));
    }

    const duplicateCount = useMemo(
        () => editableRows.filter((r) => r.isDuplicate).length,
        [editableRows]
    );
    const includedCount = useMemo(
        () => editableRows.filter((r) => r.included).length,
        [editableRows]
    );

    const updateCategory = (id: string, newCategoryId: string) => {
        setEditableRows((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                const cat = CATEGORIES.find((c) => c.id === newCategoryId);
                if (!cat) return r;
                return {
                    ...r,
                    categoryId: newCategoryId,
                    type: cat.type === 'income' ? 'income' : 'expense',
                };
            })
        );
    };

    const toggleIncluded = (id: string) => {
        setEditableRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, included: !r.included } : r))
        );
    };

    const toggleAllDuplicates = (include: boolean) => {
        setEditableRows((prev) =>
            prev.map((r) => (r.isDuplicate ? { ...r, included: include } : r))
        );
    };

    const handleConfirm = async () => {
        const toImport = editableRows
            .filter((r) => r.included)
            .map<BankRow>((r) => ({
                date: r.date,
                name: r.name,
                amount: r.amount,
                type: r.type,
                rawDescription: r.rawDescription,
                rawRecipient: r.rawRecipient,
                rawMessage: r.rawMessage,
                suggestedCategoryId: r.suggestedCategoryId,
                categoryId: r.categoryId,
            }));
        await onConfirm(toImport);
    };

    const statusLine = `${editableRows.length} rows • ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} • ${skippedInvalid} invalid skipped`;

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
                    {duplicateCount > 0 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAllDuplicates(false)}
                                disabled={importing}
                            >
                                Uncheck all duplicates
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAllDuplicates(true)}
                                disabled={importing}
                            >
                                Include all duplicates
                            </Button>
                        </div>
                    )}
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[60vh] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50 border-b text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-3 py-2 text-left w-10">
                                        <span className="sr-only">Include</span>
                                    </th>
                                    <th className="px-3 py-2 text-left w-28">Date</th>
                                    <th className="px-3 py-2 text-left">Name</th>
                                    <th className="px-3 py-2 text-left w-48">Category</th>
                                    <th className="px-3 py-2 text-right w-28">Amount</th>
                                    <th className="px-3 py-2 text-left w-24">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {editableRows.map((row) => {
                                    const selectableCategories = CATEGORIES.filter(
                                        (c) => c.type === row.type
                                    );
                                    const isSelectableType = selectableCategories.some(
                                        (c) => c.id === row.categoryId
                                    );

                                    return (
                                        <tr
                                            key={row.id}
                                            className={row.included ? '' : 'bg-gray-50 opacity-60'}
                                        >
                                            <td className="px-3 py-2 align-top">
                                                <input
                                                    type="checkbox"
                                                    checked={row.included}
                                                    onChange={() => toggleIncluded(row.id)}
                                                    disabled={importing}
                                                    className="h-4 w-4 accent-[#0073ea]"
                                                />
                                            </td>
                                            <td className="px-3 py-2 align-top text-gray-700 whitespace-nowrap">
                                                {row.date}
                                            </td>
                                            <td className="px-3 py-2 align-top text-gray-900">
                                                <div className="truncate max-w-[18rem]" title={row.name}>
                                                    {row.name}
                                                </div>
                                                {row.rawMessage && (
                                                    <div
                                                        className="truncate max-w-[18rem] text-xs text-gray-400"
                                                        title={row.rawMessage}
                                                    >
                                                        {row.rawMessage}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 align-top">
                                                <select
                                                    value={isSelectableType ? row.categoryId : ''}
                                                    onChange={(e) => updateCategory(row.id, e.target.value)}
                                                    disabled={importing}
                                                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-white"
                                                >
                                                    <optgroup label="Expense">
                                                        {CATEGORIES.filter((c) => c.type === 'expense').map(
                                                            (c) => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.name}
                                                                </option>
                                                            )
                                                        )}
                                                    </optgroup>
                                                    <optgroup label="Income">
                                                        {CATEGORIES.filter((c) => c.type === 'income').map(
                                                            (c) => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.name}
                                                                </option>
                                                            )
                                                        )}
                                                    </optgroup>
                                                </select>
                                                {row.categoryId !== row.suggestedCategoryId && (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        was: {categoryNameFor(row.suggestedCategoryId)}
                                                    </div>
                                                )}
                                            </td>
                                            <td
                                                className={`px-3 py-2 align-top text-right tabular-nums whitespace-nowrap ${row.type === 'expense' ? 'text-[#e2445c]' : 'text-[#258750]'}`}
                                            >
                                                {row.type === 'expense' ? '-' : '+'}
                                                {row.amount.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 align-top">
                                                {row.isDuplicate ? (
                                                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-xs px-2 py-0.5">
                                                        Duplicate
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5">
                                                        New
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button variant="ghost" onClick={onClose} disabled={importing}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={importing || includedCount === 0}
                    >
                        {importing ? 'Importing…' : `Import ${includedCount} row${includedCount === 1 ? '' : 's'}`}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
