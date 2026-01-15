"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useUser } from "@/contexts/UserContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";

export default function AIInsightsPage() {
    const { currentUser } = useUser();
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'Hello! I am your financial AI assistant. Ask me anything about your spending or goals.' }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim() || !currentUser) return;

        const newMessages = [...messages, { role: 'user' as const, content: input }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            // Fetch financial data
            const transactionsSnapshot = await getDocs(query(collection(db, 'transactions')));
            const transactions = transactionsSnapshot.docs.map(doc => doc.data());

            const goalsSnapshot = await getDocs(query(collection(db, 'goals')));
            const goals = goalsSnapshot.docs.map(doc => doc.data());

            // Build context
            const financialContext = `
You are a financial AI assistant. Here is the user's financial data:

TRANSACTIONS (${transactions.length} total):
${transactions.slice(0, 50).map(t =>
                `- ${t.name}: €${t.amount} (${t.type}, ${t.categoryName}, ${t.date}, Owner: ${t.ownerId})`
            ).join('\n')}

GOALS (${goals.length} total):
${goals.map(g =>
                `- ${g.title}: €${g.savedAmount} / €${g.targetAmount} (${g.status}, Owner: ${g.owner})`
            ).join('\n')}

Use this data to answer the user's questions about their finances. Be specific and reference actual numbers from their data.
`;

            // Call OpenRouter directly
            const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

            if (!apiKey) {
                setMessages([...newMessages, {
                    role: 'assistant',
                    content: "⚠️ OpenRouter API key is not configured. Please add NEXT_PUBLIC_OPENROUTER_API_KEY to your environment variables."
                }]);
                setLoading(false);
                return;
            }

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "MonopoluriV3",
                },
                body: JSON.stringify({
                    "model": "z-ai/glm-4.5-air:free",
                    "messages": [
                        { role: 'system', content: financialContext },
                        ...newMessages
                    ],
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API Error: ${errorText}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            setMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages([...newMessages, {
                role: 'assistant',
                content: `Error connecting to AI: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <h2 className="text-3xl font-bold text-[#323338] mb-6">AI Insights</h2>

            <Card className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-xl ${m.role === 'user' ? 'bg-[#0073ea] text-white' : 'bg-gray-100 text-gray-800'}`}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                    {loading && <div className="text-sm text-gray-500 italic">Thinking...</div>}
                </div>
                <div className="p-4 border-t flex gap-2">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask about your finances..."
                        disabled={loading || !currentUser}
                    />
                    <Button onClick={sendMessage} disabled={loading || !currentUser}>
                        {currentUser ? 'Send' : 'Sign in to Ask'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
