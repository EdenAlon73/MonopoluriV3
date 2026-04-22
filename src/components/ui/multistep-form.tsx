"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowDownRight,
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    Banknote,
    Briefcase,
    CalendarDays,
    Car,
    Check,
    Clapperboard,
    Gift,
    HeartPulse,
    Home,
    MoreHorizontal,
    Package,
    Plane,
    Repeat,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Sparkles,
    Undo2,
    UtensilsCrossed,
    X,
    Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./Button";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import { Transaction } from "@/types/transactions";
import { resolveCategoryForTransaction } from "@/lib/transactionHelpers";

type StepKey = "type" | "description" | "amount" | "category" | "date" | "owner" | "review";

type StepDef = {
    id: StepKey;
    question: string;
    subtitle: string;
};

const STEP_DEFS: StepDef[] = [
    { id: "type", question: "Expense or income?", subtitle: "Choose the type of transaction" },
    { id: "description", question: "What is this for?", subtitle: "Give it a short, recognizable name" },
    { id: "amount", question: "How much?", subtitle: "Enter the amount in euros" },
    { id: "category", question: "Pick a category", subtitle: "Helps you understand your spending" },
    { id: "date", question: "When did it happen?", subtitle: "Past or future dates are fine" },
    { id: "owner", question: "Who owns this?", subtitle: "Shared, Eden or Sivan" },
    { id: "review", question: "All good?", subtitle: "Review and save the transaction" },
];

type FormState = {
    type: "expense" | "income";
    description: string;
    amount: string;
    categoryId: string;
    date: string;
    owner: "Shared" | "Eden" | "Sivan";
};

const OWNER_OPTIONS: Array<{ value: FormState["owner"]; color: string }> = [
    { value: "Shared", color: "#0073ea" },
    { value: "Eden", color: "#7e5bef" },
    { value: "Sivan", color: "#ec4899" },
];

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    salary: Banknote,
    freelance: Briefcase,
    gift: Gift,
    refunds: Undo2,
    other: MoreHorizontal,
    housing: Home,
    food: UtensilsCrossed,
    groceries: ShoppingCart,
    insurance: ShieldCheck,
    subscriptions: Repeat,
    transport: Car,
    travel: Plane,
    shopping: ShoppingBag,
    utilities: Zap,
    entertainment: Clapperboard,
    health: HeartPulse,
    "personal-care": Sparkles,
    misc: Package,
};

type MultiStepTransactionFormProps = {
    onSubmit: (tx: Omit<Transaction, "id">, id?: string) => Promise<void>;
    onClose: () => void;
    loading?: boolean;
    initialType?: "expense" | "income";
    initialTransaction?: Transaction;
};

function formatAmount(amount: string) {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return null;
    return `€${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateLabel(iso: string) {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function MultiStepTransactionForm({
    onSubmit,
    onClose,
    loading = false,
    initialType = "expense",
    initialTransaction,
}: MultiStepTransactionFormProps) {
    const today = useMemo(() => new Date().toISOString().split("T")[0], []);
    const yesterday = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split("T")[0];
    }, []);
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);
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
            owner: initialTransaction?.ownerId === "shared"
                ? "Shared"
                : initialTransaction?.ownerId?.toLowerCase() === "eden"
                    ? "Eden"
                    : initialTransaction?.ownerId?.toLowerCase() === "sivan"
                        ? "Sivan"
                        : "Shared",
        };
    });

    const themeColor = form.type === "expense" ? "#d92c2c" : "#1d8a4c";
    const themeTint = form.type === "expense" ? "rgba(217, 44, 44, 0.08)" : "rgba(29, 138, 76, 0.08)";
    const filteredCategories = useMemo(
        () => CATEGORIES.filter((c) => c.type === form.type),
        [form.type]
    );

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
    const step = STEP_DEFS[currentStep];

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const canContinue = useMemo(() => {
        if (step.id === "type") return !!form.type;
        if (step.id === "description") return form.description.trim().length > 0;
        if (step.id === "amount") return parseFloat(form.amount) > 0;
        if (step.id === "category") return !!form.categoryId;
        if (step.id === "date") return !!form.date;
        if (step.id === "owner") return !!form.owner;
        return true;
    }, [step, form]);

    const handleNext = () => {
        if (!canContinue) return;
        setDirection(1);
        setCurrentStep((prev) => Math.min(prev + 1, STEP_DEFS.length - 1));
    };

    const handleBack = () => {
        setDirection(-1);
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const handleAmountChange = (raw: string) => {
        const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
        const parts = cleaned.split(".");
        const normalized = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
        setField("amount", normalized);
    };

    const handleKeyNavigate = (e: React.KeyboardEvent) => {
        if (e.key !== "Enter") return;
        if (step.id === "review") return;
        if (canContinue) {
            e.preventDefault();
            handleNext();
        }
    };

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
                frequency: "one-time",
                hasReceipt: false,
            };
            await onSubmit(payload, initialTransaction?.id);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedCategory = resolveCategoryForTransaction({ type: form.type, categoryId: form.categoryId });
    const SelectedCategoryIcon = CATEGORY_ICONS[selectedCategory.id] ?? Package;
    const ownerColor = OWNER_OPTIONS.find((o) => o.value === form.owner)?.color ?? "#0073ea";

    return (
        <div className="flex h-full flex-col bg-white" onKeyDown={handleKeyNavigate}>
            <header className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>
                <span className="text-xs font-medium tracking-wide text-gray-500 tabular-nums">
                    STEP {currentStep + 1} OF {STEP_DEFS.length}
                </span>
                <div className="h-10 w-10" aria-hidden />
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-100">
                    <div
                        className="h-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%`, backgroundColor: themeColor }}
                    />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-5 sm:px-8 py-8 sm:py-12">
                    <AnimatePresence mode="wait" initial={false} custom={direction}>
                        <motion.div
                            key={step.id}
                            custom={direction}
                            initial={{ x: direction * 24, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: direction * -24, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col gap-6"
                        >
                            <div className="space-y-1.5">
                                <h2 className="text-2xl sm:text-[28px] font-bold leading-tight text-gray-900">
                                    {step.question}
                                </h2>
                                <p className="text-[15px] text-gray-500">{step.subtitle}</p>
                            </div>

                            {step.id === "type" && (
                                <TypeSelector value={form.type} onChange={(v) => setField("type", v)} />
                            )}

                            {step.id === "description" && (
                                <input
                                    autoFocus
                                    value={form.description}
                                    onChange={(e) => setField("description", e.target.value)}
                                    placeholder="e.g. Weekly groceries"
                                    className={cn(
                                        "h-14 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-lg font-medium text-gray-900",
                                        "placeholder:text-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
                                    )}
                                />
                            )}

                            {step.id === "amount" && (
                                <AmountHero
                                    value={form.amount}
                                    themeColor={themeColor}
                                    onChange={handleAmountChange}
                                />
                            )}

                            {step.id === "category" && (
                                <CategoryGrid
                                    categories={filteredCategories}
                                    value={form.categoryId}
                                    themeColor={themeColor}
                                    themeTint={themeTint}
                                    onChange={(id) => setField("categoryId", id)}
                                />
                            )}

                            {step.id === "date" && (
                                <DatePicker
                                    value={form.date}
                                    today={today}
                                    yesterday={yesterday}
                                    themeColor={themeColor}
                                    themeTint={themeTint}
                                    onChange={(d) => setField("date", d)}
                                />
                            )}

                            {step.id === "owner" && (
                                <OwnerGrid
                                    value={form.owner}
                                    themeColor={themeColor}
                                    onChange={(o) => setField("owner", o)}
                                />
                            )}

                            {step.id === "review" && (
                                <ReviewCard
                                    type={form.type}
                                    amount={form.amount}
                                    description={form.description}
                                    categoryName={selectedCategory.name}
                                    CategoryIcon={SelectedCategoryIcon}
                                    date={form.date}
                                    owner={form.owner}
                                    ownerColor={ownerColor}
                                    themeColor={themeColor}
                                    themeTint={themeTint}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <footer className="flex items-center gap-3 border-t border-gray-100 bg-white px-4 sm:px-6 py-3 sm:py-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBack}
                    disabled={submitting || loading || currentStep === 0}
                    className="h-12 shrink-0 rounded-xl text-base px-5"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                </Button>
                <div className="hidden sm:block sm:flex-1" />
                {currentStep === STEP_DEFS.length - 1 ? (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={submitting || loading}
                        className="h-12 flex-1 sm:flex-none sm:min-w-[180px] rounded-xl text-base font-semibold shadow-md whitespace-nowrap"
                        style={{ backgroundColor: themeColor }}
                    >
                        {submitting || loading ? "Saving..." : "Save Transaction"}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleNext}
                        disabled={!canContinue || submitting || loading}
                        className="h-12 flex-1 sm:flex-none sm:min-w-[160px] rounded-xl text-base font-semibold shadow-md whitespace-nowrap"
                        style={{ backgroundColor: themeColor }}
                    >
                        Continue
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                )}
            </footer>
        </div>
    );
}

/* --------------------------- Step subcomponents --------------------------- */

function TypeSelector({ value, onChange }: { value: "expense" | "income"; onChange: (v: "expense" | "income") => void }) {
    const items = [
        {
            id: "expense" as const,
            label: "Expense",
            helper: "Money going out",
            color: "#d92c2c",
            tint: "rgba(217, 44, 44, 0.08)",
            Icon: ArrowDownRight,
        },
        {
            id: "income" as const,
            label: "Income",
            helper: "Money coming in",
            color: "#1d8a4c",
            tint: "rgba(29, 138, 76, 0.08)",
            Icon: ArrowUpRight,
        },
    ];
    return (
        <div className="grid grid-cols-2 gap-3">
            {items.map(({ id, label, helper, color, tint, Icon }) => {
                const selected = value === id;
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onChange(id)}
                        className={cn(
                            "relative flex h-36 flex-col items-start justify-between rounded-2xl border-2 p-4 text-left transition-all",
                            selected
                                ? "shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
                                : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                        style={selected ? { borderColor: color, backgroundColor: tint } : {}}
                    >
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-full"
                            style={{ backgroundColor: selected ? color : "#f3f4f6", color: selected ? "white" : "#6b7280" }}
                        >
                            <Icon className="h-5 w-5" strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="text-lg font-bold" style={{ color: selected ? color : "#111827" }}>
                                {label}
                            </div>
                            <div className="text-sm text-gray-500">{helper}</div>
                        </div>
                        {selected && (
                            <div
                                className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-white"
                                style={{ backgroundColor: color }}
                            >
                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

function AmountHero({ value, themeColor, onChange }: { value: string; themeColor: string; onChange: (v: string) => void }) {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        ref.current?.focus();
    }, []);
    const formatted = formatAmount(value);
    return (
        <div className="flex flex-col items-center gap-4 py-4 sm:py-8">
            <label className="flex items-baseline gap-2 cursor-text" onClick={() => ref.current?.focus()}>
                <span className="text-3xl sm:text-4xl font-semibold text-gray-400 select-none">€</span>
                <input
                    ref={ref}
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="0"
                    aria-label="Amount in euros"
                    className="w-[min(320px,70vw)] border-0 bg-transparent text-center text-[56px] sm:text-[72px] font-bold leading-none tabular-nums text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-0"
                />
            </label>
            <div className="h-6">
                {formatted && (
                    <div
                        className="text-sm font-medium tabular-nums transition-colors"
                        style={{ color: themeColor }}
                    >
                        {formatted}
                    </div>
                )}
            </div>
        </div>
    );
}

type CategoryOption = { id: string; name: string; type: string };

function CategoryGrid({
    categories,
    value,
    themeColor,
    themeTint,
    onChange,
}: {
    categories: CategoryOption[];
    value: string;
    themeColor: string;
    themeTint: string;
    onChange: (id: string) => void;
}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id] ?? Package;
                const selected = value === cat.id;
                return (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => onChange(cat.id)}
                        className={cn(
                            "flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all min-h-[84px]",
                            selected
                                ? "shadow-[0_6px_16px_rgba(0,0,0,0.06)]"
                                : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                        style={selected ? { borderColor: themeColor, backgroundColor: themeTint } : {}}
                    >
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{
                                backgroundColor: selected ? themeColor : "#f3f4f6",
                                color: selected ? "white" : "#6b7280",
                            }}
                        >
                            <Icon className="h-4 w-4" />
                        </div>
                        <span
                            className="text-sm font-semibold leading-tight"
                            style={{ color: selected ? themeColor : "#111827" }}
                        >
                            {cat.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function DatePicker({
    value,
    today,
    yesterday,
    themeColor,
    themeTint,
    onChange,
}: {
    value: string;
    today: string;
    yesterday: string;
    themeColor: string;
    themeTint: string;
    onChange: (d: string) => void;
}) {
    const chips: Array<{ label: string; value: string }> = [
        { label: "Today", value: today },
        { label: "Yesterday", value: yesterday },
    ];
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {chips.map((c) => {
                    const selected = value === c.value;
                    return (
                        <button
                            key={c.label}
                            type="button"
                            onClick={() => onChange(c.value)}
                            className={cn(
                                "rounded-full border px-4 h-9 text-sm font-medium transition-all",
                                selected
                                    ? "border-transparent"
                                    : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                            )}
                            style={selected ? { backgroundColor: themeTint, color: themeColor, borderColor: themeColor } : {}}
                        >
                            {c.label}
                        </button>
                    );
                })}
            </div>
            <div className="relative">
                <input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-14 w-full rounded-xl border-2 border-gray-200 bg-white px-4 pr-12 text-base font-medium text-gray-900 focus:outline-none focus:border-gray-900 transition-colors"
                />
                <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
        </div>
    );
}

function OwnerGrid({
    value,
    themeColor,
    onChange,
}: {
    value: FormState["owner"];
    themeColor: string;
    onChange: (v: FormState["owner"]) => void;
}) {
    return (
        <div className="grid grid-cols-3 gap-2.5">
            {OWNER_OPTIONS.map(({ value: owner, color }) => {
                const selected = value === owner;
                return (
                    <button
                        key={owner}
                        type="button"
                        onClick={() => onChange(owner)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 py-4 transition-all",
                            selected
                                ? "shadow-[0_6px_16px_rgba(0,0,0,0.06)]"
                                : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                        style={selected ? { borderColor: themeColor, backgroundColor: `${themeColor}0F` } : {}}
                    >
                        <span
                            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ backgroundColor: color }}
                        >
                            {owner.charAt(0)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{owner}</span>
                    </button>
                );
            })}
        </div>
    );
}

function ReviewCard({
    type,
    amount,
    description,
    categoryName,
    CategoryIcon,
    date,
    owner,
    ownerColor,
    themeColor,
    themeTint,
}: {
    type: "expense" | "income";
    amount: string;
    description: string;
    categoryName: string;
    CategoryIcon: React.ComponentType<{ className?: string }>;
    date: string;
    owner: string;
    ownerColor: string;
    themeColor: string;
    themeTint: string;
}) {
    const formatted = formatAmount(amount) ?? "€—";
    const isIncome = type === "income";
    return (
        <div className="space-y-4">
            <div
                className="rounded-2xl border-2 p-5 text-center"
                style={{ borderColor: themeColor, backgroundColor: themeTint }}
            >
                <div className="flex items-center justify-center gap-1.5">
                    {isIncome ? (
                        <ArrowUpRight className="h-4 w-4" style={{ color: themeColor }} strokeWidth={2.5} />
                    ) : (
                        <ArrowDownRight className="h-4 w-4" style={{ color: themeColor }} strokeWidth={2.5} />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColor }}>
                        {isIncome ? "Income" : "Expense"}
                    </span>
                </div>
                <div className="mt-2 text-4xl sm:text-5xl font-bold tabular-nums text-gray-900">
                    {formatted}
                </div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm">
                    <CategoryIcon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">{categoryName}</span>
                </div>
            </div>

            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
                <ReviewRow label="Description" value={description || "—"} />
                <ReviewRow label="Date" value={formatDateLabel(date)} />
                <ReviewRow
                    label="Owner"
                    value={
                        <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ownerColor }} />
                            {owner}
                        </span>
                    }
                />
            </div>
        </div>
    );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-semibold text-gray-900 truncate text-right">{value}</span>
        </div>
    );
}
