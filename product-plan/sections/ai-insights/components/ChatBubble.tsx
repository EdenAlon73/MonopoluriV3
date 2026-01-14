import type { ChatMessageData } from '@/../product/sections/ai-insights/types';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatBubbleProps {
    message: ChatMessageData;
}

export function ChatBubble({ message }: ChatBubbleProps) {
    const isAI = message.sender === 'ai';

    return (
        <div
            className={cn(
                "flex gap-4 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300",
                isAI ? "mr-auto" : "ml-auto flex-row-reverse"
            )}
        >
            <div
                className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isAI
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                )}
            >
                {isAI ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>

            <div
                className={cn(
                    "px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[85%]",
                    isAI
                        ? "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 rounded-tl-none"
                        : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-tr-none"
                )}
            >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <span
                    className={cn(
                        "text-[10px] mt-2 block opacity-70",
                        isAI ? "text-stone-400" : "text-slate-300 dark:text-slate-500"
                    )}
                >
                    {message.timestamp}
                </span>
            </div>
        </div>
    );
}
