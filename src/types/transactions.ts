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
    categoryName?: string // Helper
    ownerId: string | null
    ownerType: 'individual' | 'shared'
    date: string
    frequency: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly'
    hasReceipt: boolean
    receiptUrl?: string
    parentTransactionId?: string // Links recurring instances to their base transaction
    createdAt?: any
}

export interface TransactionSummary {
    totalIncome: number
    totalExpenses: number
    netBalance: number
}
