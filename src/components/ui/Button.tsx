import * as React from "react";
// import { cva, type VariantProps } from "class-variance-authority"; 
// Removed unused import

// Plan said "Monday.com style". I'll stick to simple component with cn.

import { cn } from "@/lib/utils";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {

        const variants = {
            primary: "bg-[#0073ea] text-white hover:bg-[#0060b9] border-transparent", // Monday blue
            secondary: "bg-white border border-[#d0d4e4] text-[#323338] hover:bg-[#d0d4e433]",
            ghost: "bg-transparent text-[#323338] hover:bg-[#d0d4e433]",
            danger: "bg-[#e2445c] text-white hover:bg-[#c43249] border-transparent"
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 text-sm",
            lg: "h-12 px-6 text-base"
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0073ea] disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
