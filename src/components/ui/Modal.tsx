"use client";

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    headerVariant?: "default" | "close-only";
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, headerVariant = "default" }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={overlayRef}
                className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
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
