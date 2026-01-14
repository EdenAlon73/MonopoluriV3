import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { MainNav } from './MainNav'
import { UserMenu } from './UserMenu'

export interface NavigationItem {
  label: string
  href: string
  isActive?: boolean
}

export interface User {
  name: string
  color: 'blue' | 'amber'
  avatarUrl?: string
}

export interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavigationItem[]
  user?: User
  onNavigate?: (href: string) => void
  onSwitchProfile?: () => void
  onLogout?: () => void
}

export function AppShell({
  children,
  navigationItems,
  user,
  onNavigate,
  onSwitchProfile,
  onLogout,
}: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-slate-700 dark:bg-slate-800 text-white hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Monopoluri
          </h1>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <MainNav
            items={navigationItems}
            onNavigate={(href) => {
              onNavigate?.(href)
              setIsMobileMenuOpen(false)
            }}
            userColor={user?.color}
          />
        </div>

        {/* User Menu */}
        {user && (
          <UserMenu
            user={user}
            onSwitchProfile={onSwitchProfile}
            onLogout={onLogout}
          />
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
