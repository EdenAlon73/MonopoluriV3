import { useState } from 'react'
import { X, Upload, Calendar } from 'lucide-react'
import type { Transaction, Category, User } from '@/../product/sections/transactions/types'

interface TransactionModalProps {
  transaction?: Transaction
  categories: Category[]
  users: User[]
  isOpen: boolean
  onClose: () => void
  onSave?: (transaction: Partial<Transaction>) => void
  onDelete?: (id: string) => void
  onUploadReceipt?: (file: File) => void
}

export function TransactionModal({
  transaction,
  categories,
  users,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onUploadReceipt,
}: TransactionModalProps) {
  const [formData, setFormData] = useState<Partial<Transaction>>(transaction || {
    name: '',
    amount: 0,
    type: 'expense',
    categoryId: categories[0]?.id || '',
    ownerId: null,
    ownerType: 'shared',
    date: new Date().toISOString().split('T')[0],
    frequency: 'one-time',
    hasReceipt: false,
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!isOpen) return null

  const handleSave = () => {
    onSave?.(formData)
    onClose()
  }

  const handleDelete = () => {
    if (transaction?.id) {
      onDelete?.(transaction.id)
      onClose()
    }
  }

  const handleOwnerChange = (ownerId: string | null) => {
    if (ownerId === null) {
      setFormData({ ...formData, ownerId: null, ownerType: 'shared' })
    } else {
      setFormData({ ...formData, ownerId, ownerType: 'individual' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-stone-800">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X size={24} className="text-stone-600 dark:text-stone-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent transition-shadow"
              placeholder="e.g., Weekly Groceries"
            />
          </div>

          {/* Amount & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Amount (€)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent"
            >
              {categories.filter(c => c.type === formData.type).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent"
              />
              <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
              className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent"
            >
              <option value="one-time">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Owner
            </label>
            <div className="grid grid-cols-3 gap-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleOwnerChange(user.id)}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    formData.ownerId === user.id
                      ? user.color === 'blue'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                        : 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                      : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  {user.name}
                </button>
              ))}
              <button
                onClick={() => handleOwnerChange(null)}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  formData.ownerId === null
                    ? 'border-slate-500 bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
                }`}
              >
                Shared
              </button>
            </div>
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Receipt (Optional)
            </label>
            <button
              onClick={() => document.getElementById('receipt-upload')?.click()}
              className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={18} />
              <span>{formData.hasReceipt ? 'Change Receipt' : 'Upload Receipt'}</span>
            </button>
            <input
              id="receipt-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onUploadReceipt?.(file)
                  setFormData({ ...formData, hasReceipt: true })
                }
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 p-6 flex items-center justify-between gap-3">
          {transaction ? (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              onClick={handleSave}
              className="w-full px-6 py-3 bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
            >
              Add Transaction
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
