import { DollarSign, TrendingUp, TrendingDown, Paperclip } from 'lucide-react'
import type { Transaction, Category, User } from '@/../product/sections/transactions/types'

interface SummaryCardProps {
  label: string
  amount: number
  type: 'income' | 'expense' | 'net'
  userColor?: 'blue' | 'amber'
}

export function SummaryCard({ label, amount, type, userColor = 'blue' }: SummaryCardProps) {
  const isPositive = amount >= 0
  const Icon = type === 'income' ? TrendingUp : type === 'expense' ? TrendingDown : DollarSign
  
  const colorClasses = {
    income: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400',
    expense: 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400',
    net: isPositive 
      ? 'bg-slate-50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-400'
      : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-stone-600 dark:text-stone-400">{label}</p>
        <div className={`p-2 rounded-lg ${colorClasses[type]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-3xl font-bold text-stone-900 dark:text-stone-100">
        €{Math.abs(amount).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  )
}

interface TransactionRowProps {
  transaction: Transaction
  category: Category
  owner: User | null
  onClick?: () => void
}

export function TransactionRow({ transaction, category, owner, onClick }: TransactionRowProps) {
  const isIncome = transaction.type === 'income'
  const ownerColorClasses = owner?.color === 'blue'
    ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
    : owner?.color === 'amber'
    ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-400'

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors border-b border-stone-100 dark:border-stone-800 last:border-b-0"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Name and Category */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
              {transaction.name}
            </p>
            {transaction.hasReceipt && (
              <Paperclip size={14} className="text-stone-400 dark:text-stone-600 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              {category.name}
            </span>
            {transaction.frequency !== 'one-time' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                {transaction.frequency}
              </span>
            )}
          </div>
        </div>

        {/* Center: Owner */}
        <div className="hidden sm:block">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${ownerColorClasses}`}>
            {owner ? owner.name : 'Shared'}
          </span>
        </div>

        {/* Right: Amount and Date */}
        <div className="text-right flex-shrink-0">
          <p className={`font-bold text-lg ${
            isIncome 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {isIncome ? '+' : '-'}€{transaction.amount.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-500">
            {new Date(transaction.date).toLocaleDateString('en-IE', { 
              month: 'short', 
              day: 'numeric',
              year: new Date(transaction.date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            })}
          </p>
        </div>
      </div>
    </button>
  )
}
