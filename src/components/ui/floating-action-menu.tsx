"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type FloatingActionMenuProps = {
    options: {
        label: string;
        onClick: () => void;
        Icon?: React.ReactNode;
    }[];
    className?: string;
};

const FloatingActionMenu = ({ options, className }: FloatingActionMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen((prev) => !prev);

    const handleOptionClick = (fn: () => void) => {
        fn();
        setIsOpen(false);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setIsOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px]"
                    />
                )}
            </AnimatePresence>

            <div className={cn("fixed bottom-24 sm:bottom-8 right-4 sm:right-6 z-40", className)}>
                <Button
                    onClick={toggleMenu}
                    className="w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-[#0073ea] hover:bg-[#0060c4] text-white shadow-[0_12px_24px_rgba(0,115,234,0.35)]"
                    style={{ borderBottomWidth: 4, borderColor: "#005bb8" }}
                    aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
                    aria-expanded={isOpen}
                >
                    <motion.div
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        <Plus className="w-6 h-6" />
                    </motion.div>
                </Button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: 12, y: 12, filter: "blur(10px)" }}
                            animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: 12, y: 12, filter: "blur(10px)" }}
                            transition={{
                                duration: 0.35,
                                type: "spring",
                                stiffness: 320,
                                damping: 22,
                                delay: 0.03,
                            }}
                            className="absolute bottom-16 right-1 mb-2"
                        >
                            <div className="flex flex-col items-end gap-2">
                                {options.map((option, index) => (
                                    <motion.div
                                        key={option.label}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2, delay: index * 0.04 }}
                                    >
                                        <Button
                                            onClick={() => handleOptionClick(option.onClick)}
                                            className="flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-50 shadow-[0_10px_24px_rgba(0,0,0,0.15)] border border-gray-100 rounded-full px-5 py-2.5 text-sm sm:text-base font-semibold"
                                        >
                                            {option.Icon && (
                                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0073ea] text-white">
                                                    {option.Icon}
                                                </span>
                                            )}
                                            <span>{option.label}</span>
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default FloatingActionMenu;
