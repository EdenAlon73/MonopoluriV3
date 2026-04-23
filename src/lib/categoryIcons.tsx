import {
    Banknote,
    Briefcase,
    Car,
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
    Zap,
    type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
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

export function getCategoryIcon(id: string | undefined | null): LucideIcon {
    if (!id) return Package;
    return CATEGORY_ICONS[id] ?? Package;
}

// Per-category colors. Each category gets a unique, saturated hex that reads
// well as text on white and works as a soft tint on pill/icon backgrounds.
// Shared so the transactions list, wizard, and any future surfaces stay in sync.
export const CATEGORY_COLORS: Record<string, string> = {
    salary: "#16A34A",
    freelance: "#0284C7",
    gift: "#9333EA",
    refunds: "#0D9488",
    other: "#64748B",
    housing: "#DC2626",
    food: "#EA580C",
    groceries: "#65A30D",
    insurance: "#0891B2",
    subscriptions: "#CA8A04",
    transport: "#2563EB",
    travel: "#8B5CF6",
    shopping: "#DB2777",
    utilities: "#D97706",
    entertainment: "#C026D3",
    health: "#E11D48",
    "personal-care": "#059669",
    misc: "#71717A",
};

const FALLBACK_COLOR = "#71717A";

export function getCategoryColor(id: string | undefined | null): string {
    if (!id) return FALLBACK_COLOR;
    return CATEGORY_COLORS[id] ?? FALLBACK_COLOR;
}

