import { 
  ReceiptText, 
  Target, 
  BarChart3, 
  Sparkles 
} from 'lucide-react'
import type { NavigationItem } from './AppShell'

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  'Transactions': ReceiptText,
  'Goals': Target,
  'Analytics': BarChart3,
  'AI Insights': Sparkles,
}

export interface MainNavProps {
  items: NavigationItem[]
  onNavigate?: (href: string) => void
  userColor?: 'blue' | 'amber'
}

export function MainNav({ items, onNavigate, userColor = 'blue' }: MainNavProps) {
  const activeColorClasses = userColor === 'blue' 
    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' 
    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100'

  const hoverColorClasses = 'hover:bg-stone-100 dark:hover:bg-stone-800'

  return (
    <nav className="px-3 space-y-1">
      {items.map((item) => {
        const Icon = iconMap[item.label]
        const isActive = item.isActive

        return (
          <button
            key={item.href}
            onClick={() => onNavigate?.(item.href)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg
              text-sm font-medium transition-colors
              ${isActive 
                ? activeColorClasses
                : `text-stone-600 dark:text-stone-400 ${hoverColorClasses}`
              }
            `}
          >
            {Icon && <Icon size={20} />}
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
