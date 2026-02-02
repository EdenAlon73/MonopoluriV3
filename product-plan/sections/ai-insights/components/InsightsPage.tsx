import { useState, useRef, useEffect } from 'react';
import type { AIInsightsData, ChatMessageData } from '@/../product-plan/data-model/ai-insights-types';
import { InsightCard } from './InsightCard';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { Sparkles } from 'lucide-react';

interface InsightsPageProps {
    data: AIInsightsData;
}

export function InsightsPage({ data }: InsightsPageProps) {
    const [history, setHistory] = useState<ChatMessageData[]>(data.chatHistory);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSend = (content: string) => {
        const newMessage: ChatMessageData = {
            id: Date.now().toString(),
            sender: 'user',
            content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setHistory(prev => [...prev, newMessage]);

        // Simulate AI response
        setTimeout(() => {
            const response: ChatMessageData = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                content: "I'm analyzing your request. As an AI advisor, I can help you break down expenses, forecast savings, and optimize your budget. \n\n*Is there a specific category you'd like me to look into?*",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setHistory(prev => [...prev, response]);
        }, 1000);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-6rem)] min-h-[600px] flex flex-col gap-6">

            {/* Header */}
            <div className="shrink-0 flex items-center gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Advisor Intelligence</h1>
                    <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">
                        {data.insights.length} New Insights Available
                    </p>
                </div>
            </div>

            {/* Hybrid Layout: Top Feed (Scrollable) */}
            <div className="shrink-0 space-y-4 pr-1">
                {data.insights.map(insight => (
                    <InsightCard key={insight.id} data={insight} />
                ))}
            </div>

            {/* Divider */}
            <div className="relative py-4 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200 dark:border-stone-800"></div>
                </div>
                <span className="relative bg-stone-50 dark:bg-stone-950 px-4 text-xs font-medium text-stone-400 uppercase tracking-widest">
                    Live Advisor
                </span>
            </div>

            {/* Chat Area (V-Flex) */}
            <div className="flex-1 min-h-0 flex flex-col">
                {/* Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-stone-800"
                >
                    {history.map(msg => (
                        <ChatBubble key={msg.id} message={msg} />
                    ))}
                </div>

                {/* Input */}
                <div className="shrink-0 pt-2 pb-1">
                    <ChatInput onSend={handleSend} />
                    <p className="text-[10px] text-center text-stone-400 mt-3">
                        AI Advisor can make mistakes. Please verify important financial information.
                    </p>
                </div>
            </div>

        </div>
    );
}
