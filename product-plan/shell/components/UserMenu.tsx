import { LogOut, RefreshCw } from 'lucide-react'
import type { User } from './AppShell'

export interface UserMenuProps {
  user: User
  onSwitchProfile?: () => void
  onLogout?: () => void
}

export function UserMenu({ user, onSwitchProfile, onLogout }: UserMenuProps) {
  const colorClasses = user.color === 'blue'
    ? 'bg-slate-500 dark:bg-slate-600'
    : 'bg-amber-500 dark:bg-amber-600'

  return (
    <div className="p-4 border-t border-stone-200 dark:border-stone-800 space-y-2">
      {/* User Info */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div className={`w-10 h-10 rounded-full ${colorClasses} flex items-center justify-center text-white font-semibold`}>
          {user.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
            {user.name}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Active Profile
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-1">
        <button
          onClick={onSwitchProfile}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <RefreshCw size={16} />
          <span>Switch Profile</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
