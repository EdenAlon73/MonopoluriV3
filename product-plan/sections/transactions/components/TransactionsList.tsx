import { Search, Filter, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { TransactionsProps } from '@/../product/sections/transactions/types'
import { SummaryCard, TransactionRow } from './TransactionCard'
import { TransactionModal } from './TransactionModal'

export function TransactionsList({
  transactions,
  categories,
  users,
  summary,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onSaveTransaction,
  onUploadReceipt,
  onFilterChange,
}: TransactionsProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterOwner, setFilterOwner] = useState<string | 'all' | 'shared'>('all')
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set(['2026-01']))

  // Group transactions by month
  const transactionsByMonth = useMemo(() => {
    const filtered = transactions.filter((txn) => {
      const matchesSearch = txn.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === 'all' || txn.type === filterType
      const matchesOwner = 
        filterOwner === 'all' || 
        (filterOwner === 'shared' && txn.ownerType === 'shared') ||
        (filterOwner !== 'shared' && txn.ownerId === filterOwner)
      
      return matchesSearch && matchesType && matchesOwner
    })

    const grouped = new Map<string, typeof transactions>()
    
    filtered.forEach((txn) => {
      const monthKey = txn.date.substring(0, 7) // YYYY-MM
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, [])
      }
      grouped.get(monthKey)!.push(txn)
    })

    // Sort each month's transactions by date (most recent first)
    grouped.forEach((txns) => {
      txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })

    // Convert to array and sort by month (most recent first)
    return Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [transactions, searchQuery, filterType, filterOwner])

  const handleOpenModal = (transactionId?: string) => {
    setSelectedTransaction(transactionId || null)
    setIsModalOpen(true)
    if (!transactionId) {
      onAddTransaction?.()
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTransaction(null)
  }

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths)
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey)
    } else {
      newExpanded.add(monthKey)
    }
    setExpandedMonths(newExpanded)
  }

  const formatMonthHeader = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-IE', {
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard label="Total Income" amount={summary.totalIncome} type="income" />
        <SummaryCard label="Total Expenses" amount={summary.totalExpenses} type="expense" />
        <SummaryCard label="Net Balance" amount={summary.netBalance} type="net" />
      </div>

      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
          Transactions
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-600" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          {/* Owner Filter */}
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent"
          >
            <option value="all">All Owners</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
            <option value="shared">Shared</option>
          </select>
        </div>
      </div>

      {/* Transactions by Month */}
      <div className="space-y-4">
        {transactionsByMonth.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-12 text-center">
            <p className="text-stone-500 dark:text-stone-400 text-lg">
              No transactions found. Add your first transaction to get started!
            </p>
          </div>
        ) : (
          transactionsByMonth.map(([monthKey, monthTransactions]) => {
            const isExpanded = expandedMonths.has(monthKey)
            const monthTotal = monthTransactions.reduce((sum, txn) => {
              return sum + (txn.type === 'income' ? txn.amount : -txn.amount)
            }, 0)

            return (
              <div
                key={monthKey}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden"
              >
                {/* Month Header */}
                <button
                  onClick={() => toggleMonth(monthKey)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors border-b border-stone-200 dark:border-stone-800"
                >
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {formatMonthHeader(monthKey)}
                    </h2>
                    <span className="text-sm text-stone-500 dark:text-stone-400">
                      {monthTransactions.length} transaction{monthTransactions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-semibold ${
                      monthTotal >= 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {monthTotal >= 0 ? '+' : ''}€{monthTotal.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={20} className="text-stone-400" />
                    ) : (
                      <ChevronDown size={20} className="text-stone-400" />
                    )}
                  </div>
                </button>

                {/* Month Transactions */}
                {isExpanded && (
                  <div>
                    {monthTransactions.map((txn) => {
                      const category = categories.find((c) => c.id === txn.categoryId)
                      const owner = users.find((u) => u.id === txn.ownerId) || null

                      return (
                        <TransactionRow
                          key={txn.id}
                          transaction={txn}
                          category={category!}
                          owner={owner}
                          onClick={() => {
                            onEditTransaction?.(txn.id)
                            handleOpenModal(txn.id)
                          }}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        transaction={selectedTransaction ? transactions.find((t) => t.id === selectedTransaction) : undefined}
        categories={categories}
        users={users}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={onSaveTransaction}
        onDelete={onDeleteTransaction}
        onUploadReceipt={onUploadReceipt}
      />
    </div>
  )
}
