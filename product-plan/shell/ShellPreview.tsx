import { AppShell } from './components/AppShell'

export default function ShellPreview() {
  const navigationItems = [
    { label: 'Transactions', href: '/transactions', isActive: true },
    { label: 'Goals', href: '/goals' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'AI Insights', href: '/insights' },
  ]

  const user = {
    name: 'Eden',
    color: 'blue' as const,
  }

  return (
    <AppShell
      navigationItems={navigationItems}
      user={user}
      onNavigate={(href) => console.log('Navigate to:', href)}
      onSwitchProfile={() => console.log('Switch profile to Sivan')}
      onLogout={() => console.log('Logout')}
    >
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Welcome to Monopoluri
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-lg">
          Section content will render here. This is the main content area where
          Transactions, Goals, Analytics, and AI Insights pages will be displayed.
        </p>
        <div className="mt-8 p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Shell Features
          </h2>
          <ul className="space-y-2 text-stone-600 dark:text-stone-400">
            <li>• Sidebar navigation with profile color accent</li>
            <li>• Mobile-responsive hamburger menu</li>
            <li>• Profile switching between Eden and Sivan</li>
            <li>• Light and dark mode support</li>
            <li>• User menu at bottom of sidebar</li>
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
