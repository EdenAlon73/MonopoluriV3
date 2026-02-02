import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative rounded-xl border bg-white text-gray-800", {
    variants: {
        variant: {
            default: "border-gray-200",
            warning: "border-amber-500/60 bg-amber-50 text-amber-700",
            error: "border-red-500/60 bg-red-50 text-red-700",
            success: "border-emerald-500/60 bg-emerald-50 text-emerald-700",
            info: "border-blue-500/60 bg-blue-50 text-blue-700",
        },
        size: {
            sm: "px-4 py-3",
            lg: "p-4",
        },
        isNotification: {
            true: "z-[100] max-w-[420px] shadow-lg shadow-black/5",
            false: "",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "sm",
        isNotification: false,
    },
});

export interface AlertProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
    icon?: React.ReactNode;
    action?: React.ReactNode;
    layout?: "row" | "complex";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    (
        {
            className,
            variant,
            size,
            isNotification,
            icon,
            action,
            layout = "row",
            children,
            ...props
        },
        ref,
    ) => (
        <div
            ref={ref}
            role="alert"
            className={cn(
                alertVariants({ variant, size, isNotification }),
                className,
            )}
            {...props}
        >
            {layout === "row" ? (
                <div className="flex items-center gap-2">
                    <div className="grow flex items-center">
                        {icon && <span className="me-3 inline-flex">{icon}</span>}
                        {children}
                    </div>
                    {action && <div className="flex items-center shrink-0">{action}</div>}
                </div>
            ) : (
                <div className="flex gap-2">
                    {icon && children ? (
                        <div className="flex grow gap-3">
                            <span className="mt-0.5 shrink-0">{icon}</span>
                            <div className="grow">{children}</div>
                        </div>
                    ) : (
                        <div className="grow">
                            {icon && <span className="me-3 inline-flex">{icon}</span>}
                            {children}
                        </div>
                    )}
                    {action && <div className="shrink-0">{action}</div>}
                </div>
            )}
        </div>
    ),
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("text-sm font-medium", className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm text-gray-600", className)}
        {...props}
    />
));
AlertDescription.displayName = "AlertDescription";

const AlertContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-1", className)} {...props} />
));
AlertContent.displayName = "AlertContent";

export { Alert, AlertTitle, AlertDescription, AlertContent };
