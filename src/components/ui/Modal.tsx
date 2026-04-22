"use client";

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ModalVariant = "panel" | "sheet";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    headerVariant?: "default" | "close-only";
    maxWidthClass?: string;
    variant?: ModalVariant;
    closeOnBackdropClick?: boolean;
    children: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useModalEffects(isOpen: boolean, onClose: () => void, panelRef: React.RefObject<HTMLDivElement | null>) {
    useEffect(() => {
        if (!isOpen) return;
        const previouslyFocused = document.activeElement as HTMLElement | null;
        document.body.style.overflow = 'hidden';

        const panel = panelRef.current;
        if (panel) {
            const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
            (firstFocusable ?? panel).focus?.();
        }

        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !panel) return;
            const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        window.addEventListener('keydown', handleKeydown);
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeydown);
            previouslyFocused?.focus?.();
        };
    }, [isOpen, onClose, panelRef]);
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    headerVariant = "default",
    maxWidthClass = "max-w-lg",
    variant = "panel",
    closeOnBackdropClick,
}: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const mounted = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false,
    );
    useModalEffects(isOpen, onClose, panelRef);

    const shouldCloseOnBackdrop =
        closeOnBackdropClick ?? variant === "sheet";

    if (!mounted) return null;

    if (variant === "sheet") {
        return createPortal(
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
                        onClick={shouldCloseOnBackdrop ? onClose : undefined}
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                    >
                        <motion.div
                            ref={panelRef}
                            key="panel"
                            initial={{ y: "100%", opacity: 0.9 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
                            className="w-full sm:max-w-xl h-[100dvh] sm:h-auto sm:max-h-[92vh] bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col outline-none"
                            onClick={(e) => e.stopPropagation()}
                            tabIndex={-1}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
        );
    }

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={shouldCloseOnBackdrop ? onClose : undefined}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div
                ref={panelRef}
                className={cn(
                    "bg-white rounded-xl shadow-xl w-full overflow-hidden animate-in zoom-in-95 duration-200 outline-none",
                    maxWidthClass
                )}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
            >
                <div className={cn(
                    "px-4 py-3 sm:p-4",
                    headerVariant === "close-only" ? "flex items-center justify-end border-b-0 pb-2" : "flex items-center justify-between border-b"
                )}>
                    {headerVariant === "default" && (
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[80vh] sm:max-h-[82vh]">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
