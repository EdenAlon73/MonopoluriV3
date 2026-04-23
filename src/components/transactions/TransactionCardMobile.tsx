"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getCategoryColor, getCategoryIcon } from "@/lib/categoryIcons";
import { Transaction } from "@/types/transactions";
import { resolveCategoryForTransaction } from "@/lib/transactionHelpers";

interface TransactionCardMobileProps {
    transaction: Transaction;
    onEdit: (tx: Transaction) => void;
    onDelete: (tx: Transaction) => void;
    onEditInManager: (recurrenceId: string) => void;
    hideDate?: boolean;
}

function formatDateLabel(iso: string) {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IE", { month: "short", day: "numeric" });
}

export function TransactionCardMobile({
    transaction: tx,
    onEdit,
    onDelete,
    onEditInManager,
    hideDate = false,
}: TransactionCardMobileProps) {
    const resolved = resolveCategoryForTransaction({
        type: tx.type,
        categoryId: tx.categoryId,
        categoryName: tx.categoryName,
    });
    const color = getCategoryColor(resolved.id);
    const iconElement = React.createElement(getCategoryIcon(resolved.id), {
        className: "w-5 h-5",
        style: { color },
    });
    const isIncome = tx.type === "income";
    const ownerLabel = tx.ownerType === "shared" ? "Shared" : "Individual";

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}1A` }}
                >
                    {iconElement}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-gray-900 break-words">{tx.name}</p>
                        <p
                            className={cn(
                                "font-semibold whitespace-nowrap",
                                isIncome ? "text-green-600" : "text-gray-900",
                            )}
                        >
                            {isIncome ? "+" : "-"}€{tx.amount.toLocaleString()}
                        </p>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                        <span
                            className="px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide"
                            style={{ backgroundColor: `${color}1A`, color }}
                        >
                            {resolved.name}
                        </span>
                        {!hideDate && (
                            <>
                                <span className="text-gray-300">·</span>
                                <span className="text-gray-500">{formatDateLabel(tx.date)}</span>
                            </>
                        )}
                        <span className="text-gray-300">·</span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                            {ownerLabel}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
                {tx.recurrenceId ? (
                    <button
                        type="button"
                        className="text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-100"
                        onClick={() => onEditInManager(tx.recurrenceId!)}
                    >
                        Edit in Manager
                    </button>
                ) : (
                    <button
                        type="button"
                        className="text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-100"
                        onClick={() => onEdit(tx)}
                    >
                        Edit
                    </button>
                )}
                <button
                    type="button"
                    className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(tx)}
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
