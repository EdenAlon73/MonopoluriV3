import React, { useState } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
type Size = 'sm' | 'md' | 'lg';

interface Button3DProps extends Omit<HTMLMotionProps<"button">, "children"> {
    variant?: Variant;
    size?: Size;
    children: React.ReactNode;
}

export function Button3D({
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    disabled = false,
    className,
    ...rest
}: Button3DProps) {
    const [isPressed, setIsPressed] = useState(false);

    const variants: Record<Variant, { base: string; hover: string; shadow: string; gradient: string }> = {
        primary: { base: 'bg-[#0d6efd] text-white border-[#0b5ed7]', hover: 'hover:bg-[#0b5ed7]', shadow: '#0a58ca', gradient: 'from-[#0d6efd] to-[#0b5ed7]' },
        secondary: { base: 'bg-gray-600 text-white border-gray-700', hover: 'hover:bg-gray-700', shadow: '#4b5563', gradient: 'from-gray-600 to-gray-700' },
        success: { base: 'bg-green-500 text-white border-green-600', hover: 'hover:bg-green-600', shadow: '#166534', gradient: 'from-green-500 to-green-600' },
        danger: { base: 'bg-red-500 text-white border-red-600', hover: 'hover:bg-red-600', shadow: '#991b1b', gradient: 'from-red-500 to-red-600' },
        warning: { base: 'bg-yellow-400 text-black border-yellow-500', hover: 'hover:bg-yellow-500', shadow: '#b45309', gradient: 'from-yellow-400 to-yellow-500' },
    };

    const sizes: Record<Size, string> = {
        sm: 'px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm',
        md: 'px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base',
        lg: 'px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg',
    };

    const v = variants[variant];
    const s = sizes[size];

    const handleMouseDown = () => {
        if (!disabled) setIsPressed(true);
    };
    const handleMouseUp = () => setIsPressed(false);

    const lipOpacity = disabled ? 0.5 : 0.9;

    return (
        <motion.button
            className={cn(
                'relative inline-flex overflow-visible select-none',
                'font-semibold rounded-xl border-b-4',
                `bg-gradient-to-b ${v.gradient}`,
                s,
                disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                'focus:outline-none focus:ring-4 focus:ring-[#0073ea33]',
                'flex items-center justify-center gap-2',
                className
            )}
            style={{
                boxShadow: isPressed
                    ? `0 2px 0 0 ${v.shadow}, 0 8px 18px rgba(0,0,0,0.18)`
                    : `0 8px 0 0 ${v.shadow}, 0 12px 22px rgba(0,0,0,0.15)`,
                transform: `translateY(${isPressed ? 4 : 0}px)`,
                transition: 'transform 120ms ease, box-shadow 120ms ease',
            }}
            whileHover={
                disabled
                    ? undefined
                    : {
                        scale: 1.02,
                        transition: { duration: 0.08 },
                    }
            }
            whileTap={
                disabled
                    ? undefined
                    : {
                        scale: 0.99,
                        transition: { duration: 0.08 },
                    }
            }
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={onClick}
            disabled={disabled}
            {...rest}
        >
            {/* Lip / shadow layer */}
            <span
                aria-hidden
                className="absolute inset-x-1 bottom-[-8px] h-3 rounded-b-[14px]"
                style={{ backgroundColor: v.shadow, opacity: lipOpacity, zIndex: -1 }}
            />
            {children}
        </motion.button>
    );
}
