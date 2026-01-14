// =============================================================================
// Data Types
// =============================================================================

export interface User {
  id: string
  name: string
  color: 'blue' | 'amber'
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
}

export interface Transaction {
  id: string
  name: string
  amount: number
  type: 'income' | 'expense'
  categoryId: string
  ownerId: string | null
  ownerType: 'individual' | 'shared'
  date: string
  frequency: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly'
  hasReceipt: boolean
  receiptUrl?: string
}

export interface Receipt {
  transactionId: string
  url: string
  uploadedAt: string
}

// =============================================================================
// Summary Types
// =============================================================================

export interface TransactionSummary {
  totalIncome: number
  totalExpenses: number
  netBalance: number
}

// =============================================================================
// Component Props
// =============================================================================

export interface TransactionsProps {
  /** List of all transactions to display */
  transactions: Transaction[]
  /** Available categories for filtering and selection */
  categories: Category[]
  /** Available users (Eden and Sivan) */
  users: User[]
  /** Summary totals calculated from transactions */
  summary: TransactionSummary
  /** Called when user wants to add a new transaction */
  onAddTransaction?: () => void
  /** Called when user wants to edit an existing transaction */
  onEditTransaction?: (id: string) => void
  /** Called when user wants to delete a transaction */
  onDeleteTransaction?: (id: string) => void
  /** Called when user saves a new or edited transaction */
  onSaveTransaction?: (transaction: Partial<Transaction>) => void
  /** Called when user uploads a receipt photo */
  onUploadReceipt?: (transactionId: string, file: File) => void
  /** Called when user wants to view a receipt */
  onViewReceipt?: (receiptUrl: string) => void
  /** Called when filters are applied */
  onFilterChange?: (filters: TransactionFilters) => void
}

export interface TransactionFilters {
  dateRange?: { start: string; end: string }
  categoryIds?: string[]
  ownerIds?: string[]
  type?: 'income' | 'expense' | 'all'
  searchQuery?: string
}
