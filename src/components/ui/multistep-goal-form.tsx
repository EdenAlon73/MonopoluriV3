"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Gift,
    Home,
    Plane,
    Target,
    X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./Button";
import { cn } from "@/lib/utils";
import { Goal } from "@/types/goals";

const THEME = "#0073ea";
const THEME_TINT = "rgba(0, 115, 234, 0.08)";

type StepKey = "title" | "amount" | "owner" | "deadline" | "icon" | "review";

type StepDef = {
    id: StepKey;
    question: string;
    subtitle: string;
};

const STEP_DEFS: StepDef[] = [
    { id: "title", question: "What are you saving for?", subtitle: "Give your goal a clear name" },
    { id: "amount", question: "How much do you need?", subtitle: "Target amount in euros" },
    { id: "owner", question: "Who owns this goal?", subtitle: "Shared, Eden or Sivan" },
    { id: "deadline", question: "By when?", subtitle: "Optional — leave blank if there's no deadline" },
    { id: "icon", question: "Pick an icon", subtitle: "Something to represent your goal" },
    { id: "review", question: "Ready to save?", subtitle: "Review and create your goal" },
];

type FormState = {
    title: string;
    targetAmount: string;
    owner: Goal["owner"];
    deadline?: string;
    icon: Goal["icon"];
};

const OWNER_OPTIONS: Array<{ value: Goal["owner"]; color: string }> = [
    { value: "Shared", color: "#0073ea" },
    { value: "Eden", color: "#7e5bef" },
    { value: "Sivan", color: "#ec4899" },
];

const ICON_OPTIONS: Array<{ id: Goal["icon"]; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
    { id: "plane", label: "Travel", Icon: Plane },
    { id: "gift", label: "Gift", Icon: Gift },
    { id: "home", label: "Home", Icon: Home },
];

type MultiStepGoalFormProps = {
    onSubmit: (goal: Omit<Goal, "id">) => Promise<void>;
    onClose: () => void;
    loading?: boolean;
};

function formatAmount(amount: string) {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return null;
    return `€${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDateLabel(iso: string | undefined) {
    if (!iso) return "No deadline";
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function MultiStepGoalForm({ onSubmit, onClose, loading = false }: MultiStepGoalFormProps) {
    const today = useMemo(() => new Date().toISOString().split("T")[0], []);
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<FormState>({
        title: "",
        targetAmount: "",
        owner: "Shared",
        deadline: "",
        icon: "gift",
    });

    const progress = ((currentStep + 1) / STEP_DEFS.length) * 100;
    const step = STEP_DEFS[currentStep];

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const canContinue = useMemo(() => {
        if (step.id === "title") return form.title.trim().length > 0;
        if (step.id === "amount") return parseFloat(form.targetAmount) > 0;
        if (step.id === "owner") return !!form.owner;
        if (step.id === "deadline") return true;
        if (step.id === "icon") return !!form.icon;
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
        setField("targetAmount", normalized);
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
            const payload: Omit<Goal, "id"> = {
                title: form.title,
                targetAmount: parseFloat(form.targetAmount),
                savedAmount: 0,
                owner: form.owner,
                status: "Active",
                icon: form.icon,
                color: "stone",
            };
            if (form.deadline) payload.deadline = form.deadline;
            await onSubmit(payload);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedIcon = ICON_OPTIONS.find((o) => o.id === form.icon) ?? ICON_OPTIONS[0];
    const ownerColor = OWNER_OPTIONS.find((o) => o.value === form.owner)?.color ?? THEME;

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
                        style={{ width: `${progress}%`, backgroundColor: THEME }}
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

                            {step.id === "title" && (
                                <input
                                    autoFocus
                                    value={form.title}
                                    onChange={(e) => setField("title", e.target.value)}
                                    placeholder="e.g. New Car"
                                    className="h-14 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-lg font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
                                />
                            )}

                            {step.id === "amount" && (
                                <AmountHero value={form.targetAmount} onChange={handleAmountChange} />
                            )}

                            {step.id === "owner" && (
                                <OwnerGrid value={form.owner} onChange={(o) => setField("owner", o)} />
                            )}

                            {step.id === "deadline" && (
                                <DeadlinePicker
                                    value={form.deadline ?? ""}
                                    min={today}
                                    onChange={(d) => setField("deadline", d)}
                                />
                            )}

                            {step.id === "icon" && (
                                <IconGrid value={form.icon} onChange={(v) => setField("icon", v)} />
                            )}

                            {step.id === "review" && (
                                <ReviewCard
                                    title={form.title}
                                    targetAmount={form.targetAmount}
                                    owner={form.owner}
                                    ownerColor={ownerColor}
                                    deadline={form.deadline}
                                    IconCmp={selectedIcon.Icon}
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
                        className="h-12 flex-1 sm:flex-none sm:min-w-[160px] rounded-xl text-base font-semibold shadow-md whitespace-nowrap"
                        style={{ backgroundColor: THEME }}
                    >
                        {submitting || loading ? "Saving..." : "Save Goal"}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleNext}
                        disabled={!canContinue || submitting || loading}
                        className="h-12 flex-1 sm:flex-none sm:min-w-[160px] rounded-xl text-base font-semibold shadow-md whitespace-nowrap"
                        style={{ backgroundColor: THEME }}
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

function AmountHero({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
                    aria-label="Target amount in euros"
                    className="w-[min(320px,70vw)] border-0 bg-transparent text-center text-[56px] sm:text-[72px] font-bold leading-none tabular-nums text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-0"
                />
            </label>
            <div className="h-6">
                {formatted && (
                    <div
                        className="text-sm font-medium tabular-nums"
                        style={{ color: THEME }}
                    >
                        {formatted}
                    </div>
                )}
            </div>
        </div>
    );
}

function OwnerGrid({ value, onChange }: { value: Goal["owner"]; onChange: (v: Goal["owner"]) => void }) {
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
                        style={selected ? { borderColor: THEME, backgroundColor: THEME_TINT } : {}}
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

function DeadlinePicker({
    value,
    min,
    onChange,
}: {
    value: string;
    min: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="relative">
                <input
                    type="date"
                    min={min}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-14 w-full rounded-xl border-2 border-gray-200 bg-white px-4 pr-12 text-base font-medium text-gray-900 focus:outline-none focus:border-gray-900 transition-colors"
                />
                <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition"
                >
                    Skip deadline
                </button>
            )}
        </div>
    );
}

function IconGrid({ value, onChange }: { value: Goal["icon"]; onChange: (v: Goal["icon"]) => void }) {
    return (
        <div className="grid grid-cols-3 gap-2.5">
            {ICON_OPTIONS.map(({ id, label, Icon }) => {
                const selected = value === id;
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onChange(id)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 py-6 transition-all",
                            selected
                                ? "shadow-[0_6px_16px_rgba(0,0,0,0.06)]"
                                : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                        style={selected ? { borderColor: THEME, backgroundColor: THEME_TINT } : {}}
                    >
                        <Icon
                            className="h-8 w-8"
                            {...({ style: { color: selected ? THEME : "#6b7280" } } as Record<string, unknown>)}
                        />
                        <span
                            className="text-sm font-semibold"
                            style={{ color: selected ? THEME : "#111827" }}
                        >
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function ReviewCard({
    title,
    targetAmount,
    owner,
    ownerColor,
    deadline,
    IconCmp,
}: {
    title: string;
    targetAmount: string;
    owner: string;
    ownerColor: string;
    deadline?: string;
    IconCmp: React.ComponentType<{ className?: string }>;
}) {
    const formatted = formatAmount(targetAmount) ?? "€—";
    return (
        <div className="space-y-4">
            <div
                className="rounded-2xl border-2 p-5 text-center"
                style={{ borderColor: THEME, backgroundColor: THEME_TINT }}
            >
                <div
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm"
                    style={{ backgroundColor: THEME }}
                >
                    <IconCmp className="h-7 w-7" />
                </div>
                <div className="mt-3 text-lg font-bold text-gray-900">{title || "Untitled goal"}</div>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-gray-500">
                    <Target className="h-3.5 w-3.5" />
                    <span className="tabular-nums font-semibold" style={{ color: THEME }}>{formatted}</span>
                </div>
            </div>

            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
                <ReviewRow
                    label="Owner"
                    value={
                        <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ownerColor }} />
                            {owner}
                        </span>
                    }
                />
                <ReviewRow label="Deadline" value={formatDateLabel(deadline)} />
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
