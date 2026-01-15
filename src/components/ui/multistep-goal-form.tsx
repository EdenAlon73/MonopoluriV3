"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, CheckIcon } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Goal } from "@/types/goals";
import { cn } from "@/lib/utils";

type StepKey = "title" | "amount" | "owner" | "deadline" | "icon" | "review";

type StepDef = {
    id: StepKey;
    label: string;
    helper?: string;
};

const STEP_DEFS: StepDef[] = [
    { id: "title", label: "Goal Title", helper: "What are you saving for?" },
    { id: "amount", label: "Target Amount", helper: "How much do you need?" },
    { id: "owner", label: "Owner", helper: "Who owns this goal?" },
    { id: "deadline", label: "Deadline (optional)", helper: "When do you want to reach it?" },
    { id: "icon", label: "Icon", helper: "Pick an icon" },
    { id: "review", label: "Review", helper: "Confirm and save" },
];

type FormState = {
    title: string;
    targetAmount: string;
    owner: Goal["owner"];
    deadline?: string;
    icon: Goal["icon"];
};

const OWNER_OPTIONS: Array<Goal["owner"]> = ["Shared", "Eden", "Sivan"];
const ICON_OPTIONS: Array<Goal["icon"]> = ["plane", "gift", "home"];

type MultiStepGoalFormProps = {
    onSubmit: (goal: Omit<Goal, "id">) => Promise<void>;
    loading?: boolean;
};

export function MultiStepGoalForm({ onSubmit, loading = false }: MultiStepGoalFormProps) {
    const today = useMemo(() => new Date().toISOString().split("T")[0], []);
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<FormState>({
        title: "",
        targetAmount: "",
        owner: "Shared",
        deadline: "",
        icon: "gift",
    });

    const progress = ((currentStep + 1) / STEP_DEFS.length) * 100;

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const canContinue = useMemo(() => {
        const stepId = STEP_DEFS[currentStep].id;
        if (stepId === "title") return form.title.trim().length > 0;
        if (stepId === "amount") return parseFloat(form.targetAmount) > 0;
        if (stepId === "owner") return !!form.owner;
        if (stepId === "deadline") return true;
        if (stepId === "icon") return !!form.icon;
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
            const payload: Omit<Goal, "id"> = {
                title: form.title,
                targetAmount: parseFloat(form.targetAmount),
                savedAmount: 0,
                owner: form.owner,
                status: "Active",
                icon: form.icon,
                color: "stone",
            };

            if (form.deadline) {
                payload.deadline = form.deadline;
            }

            await onSubmit(payload);
        } finally {
            setSubmitting(false);
        }
    };

    const summary = [
        { label: "Title", value: form.title || "—" },
        { label: "Target", value: form.targetAmount ? `€${parseFloat(form.targetAmount).toLocaleString()}` : "—" },
        { label: "Owner", value: form.owner },
        { label: "Deadline", value: form.deadline || "None" },
        { label: "Icon", value: form.icon },
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
                                index === currentStep && "bg-[#0073ea] text-white shadow-[0_6px_18px_rgba(0,0,0,0.12)]",
                                index > currentStep && "bg-muted text-muted-foreground/60"
                            )}
                        >
                            {index < currentStep ? (
                                <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
                            ) : (
                                <span>{index + 1}</span>
                            )}
                            {index === currentStep && (
                                <div
                                    className="absolute inset-0 rounded-full blur-md"
                                    style={{ backgroundColor: "#0073ea", opacity: 0.35 }}
                                />
                            )}
                        </button>
                        {index < STEP_DEFS.length - 1 && (
                            <div className="relative h-[1.5px] w-10 sm:w-14 overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="absolute inset-0 transition-all duration-500 origin-left bg-[#0073ea]"
                                    style={{
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
                        backgroundImage: `linear-gradient(90deg, #0073ea, #0073ea)`
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
                    {STEP_DEFS[currentStep].id === "title" && (
                        <Input
                            autoFocus
                            value={form.title}
                            onChange={e => setField("title", e.target.value)}
                            placeholder="e.g. New Car"
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
                            value={form.targetAmount}
                            onChange={e => setField("targetAmount", e.target.value)}
                            placeholder="5000"
                            className="h-12 text-base"
                        />
                    )}

                    {STEP_DEFS[currentStep].id === "owner" && (
                        <select
                            className="w-full h-12 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea]"
                            value={form.owner}
                            onChange={(e) => setField("owner", e.target.value as Goal["owner"])}
                        >
                            {OWNER_OPTIONS.map(o => (
                                <option key={o} value={o}>{o}</option>
                            ))}
                        </select>
                    )}

                    {STEP_DEFS[currentStep].id === "deadline" && (
                        <div className="relative">
                            <Input
                                type="date"
                                min={today}
                                value={form.deadline}
                                onChange={e => setField("deadline", e.target.value)}
                                className="h-12 text-base pr-10"
                            />
                            <CalendarDays className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                    )}

                    {STEP_DEFS[currentStep].id === "icon" && (
                        <div className="grid grid-cols-3 gap-2">
                            {ICON_OPTIONS.map(icon => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setField("icon", icon)}
                                    className={cn(
                                        "rounded-lg border px-3 py-3 text-sm font-semibold transition-all flex items-center justify-center",
                                        form.icon === icon
                                            ? "bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] border-[#0073ea] text-[#0073ea]"
                                            : "bg-gray-50 hover:bg-white border-gray-200 text-gray-700"
                                    )}
                                >
                                    {icon.charAt(0).toUpperCase() + icon.slice(1)}
                                </button>
                            ))}
                        </div>
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
                        {submitting || loading ? "Saving..." : "Save Goal"}
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
