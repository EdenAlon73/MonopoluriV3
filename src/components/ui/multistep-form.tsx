"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckIcon, ArrowRight, ArrowLeft, CalendarDays } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import { Transaction } from "@/types/transactions";
import { resolveCategoryForTransaction } from "@/lib/transactionHelpers";

type StepKey = "type" | "description" | "amount" | "category" | "date" | "owner" | "frequency" | "review";

type StepDef = {
    id: StepKey;
    label: string;
    helper?: string;
};

const STEP_DEFS: StepDef[] = [
    { id: "type", label: "Type", helper: "Is this an expense or income?" },
    { id: "description", label: "Description", helper: "What is this for?" },
    { id: "amount", label: "Amount", helper: "How much? (€)" },
    { id: "category", label: "Category", helper: "Pick a category" },
    { id: "date", label: "Date", helper: "When did/will it happen?" },
    { id: "owner", label: "Owner", helper: "Who owns this?" },
    { id: "frequency", label: "Frequency", helper: "How often?" },
    { id: "review", label: "Review", helper: "Confirm and save" },
];

type FormState = {
    type: "expense" | "income";
    description: string;
    amount: string;
    categoryId: string;
    date: string;
    owner: "Shared" | "Eden" | "Sivan";
    frequency: Transaction["frequency"];
};

const OWNER_OPTIONS: Array<FormState["owner"]> = ["Shared", "Eden", "Sivan"];
const FREQUENCY_OPTIONS: Array<Transaction["frequency"]> = ["one-time", "weekly", "monthly"];

type MultiStepTransactionFormProps = {
    onSubmit: (tx: Omit<Transaction, "id">, id?: string) => Promise<void>;
    loading?: boolean;
    initialType?: "expense" | "income";
    initialTransaction?: Transaction;
};

export function MultiStepTransactionForm({ onSubmit, loading = false, initialType = "expense", initialTransaction }: MultiStepTransactionFormProps) {
    const today = useMemo(() => new Date().toISOString().split("T")[0], []);
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<FormState>(() => {
        const type = initialTransaction?.type ?? initialType;
        const resolvedCategory = resolveCategoryForTransaction({
            type,
            categoryId: initialTransaction?.categoryId,
            categoryName: initialTransaction?.categoryName,
        });
        return {
            type,
            description: initialTransaction?.name ?? "",
            amount: initialTransaction ? String(initialTransaction.amount) : "",
            categoryId: resolvedCategory.id,
            date: initialTransaction?.date ?? today,
            owner: (initialTransaction?.ownerId === "shared" ? "Shared" : (initialTransaction?.ownerId?.toLowerCase() === "eden" ? "Eden" : initialTransaction?.ownerId?.toLowerCase() === "sivan" ? "Sivan" : "Shared")),
            frequency: initialTransaction?.frequency ?? "one-time",
        };
    });

    const themeColor = form.type === "expense" ? "#d92c2c" : "#1d8a4c";
    const filteredCategories = useMemo(() => CATEGORIES.filter(c => c.type === form.type), [form.type]);

    useEffect(() => {
        const currentCategory = CATEGORIES.find((category) => category.id === form.categoryId);
        if (currentCategory?.type === form.type) return;

        const fallback = resolveCategoryForTransaction({
            type: form.type,
            categoryId: form.categoryId,
        });
        setForm((prev) => ({ ...prev, categoryId: fallback.id }));
    }, [form.type, form.categoryId]);

    const progress = ((currentStep + 1) / STEP_DEFS.length) * 100;

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const canContinue = useMemo(() => {
        const stepId = STEP_DEFS[currentStep].id;
        if (stepId === "type") return !!form.type;
        if (stepId === "description") return form.description.trim().length > 0;
        if (stepId === "amount") return parseFloat(form.amount) > 0;
        if (stepId === "category") return !!form.categoryId;
        if (stepId === "date") return !!form.date;
        if (stepId === "owner") return !!form.owner;
        if (stepId === "frequency") return !!form.frequency;
        return true;
    }, [currentStep, form]);

    const handleNext = () => {
        if (!canContinue) return;
        setCurrentStep(prev => Math.min(prev + 1, STEP_DEFS.length - 1));
    };

    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const category = resolveCategoryForTransaction({
                type: form.type,
                categoryId: form.categoryId,
            });
            const payload: Omit<Transaction, "id"> = {
                name: form.description,
                amount: parseFloat(form.amount),
                date: form.date,
                type: form.type,
                categoryId: category.id,
                categoryName: category.name,
                ownerId: form.owner === "Shared" ? "shared" : form.owner.toLowerCase(),
                ownerType: form.owner === "Shared" ? "shared" : "individual",
                frequency: form.frequency,
                hasReceipt: false,
            };

            await onSubmit(payload, initialTransaction?.id);
        } finally {
            setSubmitting(false);
        }
    };

    const summary = [
        { label: "Type", value: form.type === "income" ? "Income" : "Expense" },
        { label: "Description", value: form.description || "—" },
        { label: "Amount", value: form.amount ? `€${parseFloat(form.amount).toLocaleString()}` : "—" },
        { label: "Category", value: resolveCategoryForTransaction({ type: form.type, categoryId: form.categoryId }).name || "—" },
        { label: "Date", value: form.date },
        { label: "Owner", value: form.owner },
        { label: "Frequency", value: form.frequency },
    ];

    return (
        <div className="w-full space-y-6">
            <div className="flex items-center justify-center gap-3 flex-wrap">
                {STEP_DEFS.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3">
                        <button
                            onClick={() => index < currentStep && setCurrentStep(index)}
                            disabled={index > currentStep}
                            className={cn(
                                "group relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 ease-out text-xs font-medium",
                                "disabled:cursor-not-allowed",
                                index < currentStep && "bg-black/5 text-black/60",
                                index === currentStep && "text-white shadow-[0_6px_18px_rgba(0,0,0,0.12)]",
                                index > currentStep && "bg-muted text-muted-foreground/60"
                            )}
                            style={index === currentStep ? { backgroundColor: themeColor } : {}}
                        >
                            {index < currentStep ? (
                                <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
                            ) : (
                                <span>{index + 1}</span>
                            )}
                            {index === currentStep && (
                                <div
                                    className="absolute inset-0 rounded-full blur-md"
                                    style={{ backgroundColor: themeColor, opacity: 0.35 }}
                                />
                            )}
                        </button>
                        {index < STEP_DEFS.length - 1 && (
                            <div className="relative h-[1.5px] w-10 sm:w-14 overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="absolute inset-0 transition-all duration-500 origin-left"
                                    style={{
                                        backgroundColor: themeColor,
                                        transform: `scaleX(${index < currentStep ? 1 : 0})`
                                    }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mb-2 overflow-hidden rounded-full bg-gray-200 h-[6px]">
                <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{
                        width: `${progress}%`,
                        backgroundImage: `linear-gradient(90deg, ${themeColor}, ${themeColor}cc)`
                    }}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">{STEP_DEFS[currentStep].label}</p>
                        {STEP_DEFS[currentStep].helper && (
                            <p className="text-xs text-gray-500">{STEP_DEFS[currentStep].helper}</p>
                        )}
                    </div>
                    <span className="text-xs font-medium text-gray-400 tabular-nums">
                        {currentStep + 1}/{STEP_DEFS.length}
                    </span>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 space-y-4">
                    {STEP_DEFS[currentStep].id === "type" && (
                        <div className="grid grid-cols-2 gap-2">
                            {(["expense", "income"] as const).map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setField("type", opt)}
                                    className={cn(
                                        "rounded-lg border px-3 py-3 text-sm font-semibold transition-all",
                                        form.type === opt
                                            ? "bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
                                            : "bg-gray-50 hover:bg-white"
                                    )}
                                    style={form.type === opt ? { borderColor: themeColor, color: themeColor } : {}}
                                >
                                    {opt === "expense" ? "Expense" : "Income"}
                                </button>
                            ))}
                        </div>
                    )}

                    {STEP_DEFS[currentStep].id === "description" && (
                        <Input
                            autoFocus
                            value={form.description}
                            onChange={e => setField("description", e.target.value)}
                            placeholder="e.g. Weekly groceries"
                            className="h-12 text-base"
                        />
                    )}

                    {STEP_DEFS[currentStep].id === "amount" && (
                        <Input
                            autoFocus
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={form.amount}
                            onChange={e => setField("amount", e.target.value)}
                            placeholder="0.00"
                            className="h-12 text-base"
                        />
                    )}

                    {STEP_DEFS[currentStep].id === "category" && (
                        <select
                            className="w-full h-12 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2"
                            value={form.categoryId}
                            onChange={(e) => setField("categoryId", e.target.value)}
                        >
                            {filteredCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}

                    {STEP_DEFS[currentStep].id === "date" && (
                        <div className="relative">
                            <Input
                                type="date"
                                value={form.date}
                                onChange={e => setField("date", e.target.value)}
                                className="h-12 text-base pr-10"
                            />
                            <CalendarDays className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                    )}

                    {STEP_DEFS[currentStep].id === "owner" && (
                        <select
                            className="w-full h-12 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2"
                            value={form.owner}
                            onChange={(e) => setField("owner", e.target.value as FormState["owner"])}
                        >
                            {OWNER_OPTIONS.map(o => (
                                <option key={o} value={o}>{o}</option>
                            ))}
                        </select>
                    )}

                    {STEP_DEFS[currentStep].id === "frequency" && (
                        <select
                            className="w-full h-12 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2"
                            value={form.frequency}
                            onChange={(e) => setField("frequency", e.target.value as Transaction["frequency"])}
                        >
                            {FREQUENCY_OPTIONS.map(f => (
                                <option key={f} value={f}>{f.replace("-", " ")}</option>
                            ))}
                        </select>
                    )}

                    {STEP_DEFS[currentStep].id === "review" && (
                        <div className="space-y-3">
                            {summary.map(item => (
                                <div key={item.label} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                                    <span className="text-gray-500">{item.label}</span>
                                    <span className="font-semibold text-gray-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBack}
                    disabled={submitting || loading || currentStep === 0}
                    className="w-full sm:w-auto min-w-[120px]"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                </Button>

                {currentStep === STEP_DEFS.length - 1 ? (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={submitting || loading}
                        className="w-full sm:w-auto min-w-[150px]"
                    >
                        {submitting || loading ? "Saving..." : "Save Transaction"}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleNext}
                        disabled={!canContinue || submitting || loading}
                        className="w-full sm:w-auto min-w-[150px]"
                    >
                        Continue
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                )}
            </div>
        </div>
    );
}
