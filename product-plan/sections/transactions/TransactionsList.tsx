import data from '@/../product/sections/transactions/data.json'
import { TransactionsList } from './components/TransactionsList'
import type { TransactionSummary } from '@/../product/sections/transactions/types'

export default function TransactionsPreview() {
  // Calculate summary from transactions
  const summary: TransactionSummary = {
    totalIncome: data.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: data.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    netBalance: 0,
  }
  summary.netBalance = summary.totalIncome - summary.totalExpenses

  return (
    <TransactionsList
      transactions={data.transactions}
      categories={data.categories}
      users={data.users}
      summary={summary}
      onAddTransaction={() => console.log('Add transaction')}
      onEditTransaction={(id) => console.log('Edit transaction:', id)}
      onDeleteTransaction={(id) => console.log('Delete transaction:', id)}
      onSaveTransaction={(transaction) => console.log('Save transaction:', transaction)}
      onUploadReceipt={(transactionId, file) => console.log('Upload receipt for:', transactionId, file)}
      onFilterChange={(filters) => console.log('Filter change:', filters)}
    />
  )
}
