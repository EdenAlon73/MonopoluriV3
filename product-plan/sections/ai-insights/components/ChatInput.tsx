import { SendHorizontal } from 'lucide-react';
import { useState } from 'react';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [value, setValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim() && !disabled) {
            onSend(value);
            setValue('');
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="relative flex items-center bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-lg shadow-stone-900/5 focus-within:ring-2 focus-within:ring-slate-500/20 transition-all"
        >
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ask for financial advice..."
                className="flex-1 bg-transparent px-5 py-4 text-sm outline-none text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
                disabled={disabled}
            />
            <button
                type="submit"
                disabled={!value.trim() || disabled}
                className="p-2 mr-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <SendHorizontal className="w-5 h-5" />
            </button>
        </form>
    );
}
