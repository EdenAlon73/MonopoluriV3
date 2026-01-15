import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DockProps {
    className?: string;
    items: {
        icon: LucideIcon;
        label: string;
        onClick?: () => void;
        className?: string;
        active?: boolean;
    }[];
}

interface DockIconButtonProps {
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
    className?: string;
    active?: boolean;
}

const floatingAnimation: Variants = {
    initial: { y: 0 },
    animate: {
        y: [-2, 2, -2],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: [0.42, 0, 0.58, 1],
        }
    }
};

const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
    ({ icon: Icon, label, onClick, className, active }, ref) => {
        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className={cn(
                    "relative group p-3 rounded-xl",
                    "hover:bg-[#e6f0ff] transition-colors",
                    active && "bg-primary/10 text-primary",
                    className
                )}
            >
                <Icon className="w-5 h-5 text-foreground" />
                <span className={cn(
                    "absolute -top-8 left-1/2 -translate-x-1/2",
                    "px-2 py-1 rounded text-xs",
                    "bg-popover text-popover-foreground",
                    "opacity-0 group-hover:opacity-100",
                    "transition-opacity whitespace-nowrap pointer-events-none shadow-sm"
                )}>
                    {label}
                </span>
            </motion.button>
        );
    }
);
DockIconButton.displayName = "DockIconButton";

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
    ({ items, className }, ref) => {
        return (
            <div ref={ref} className={cn("w-full flex items-center justify-center p-2", className)}>
                <div className="w-full sm:w-auto rounded-2xl flex items-center justify-center relative">
                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={floatingAnimation}
                        className={cn(
                            "flex items-center justify-between gap-1 p-2 rounded-2xl",
                            "backdrop-blur-lg border shadow-lg",
                            "bg-background/95 border-border",
                            "hover:shadow-xl transition-shadow duration-300",
                            "w-full sm:w-auto"
                        )}
                    >
                        {items.map((item) => (
                            <DockIconButton key={item.label} {...item} />
                        ))}
                    </motion.div>
                </div>
            </div>
        );
    }
);
Dock.displayName = "Dock";

export { Dock };
