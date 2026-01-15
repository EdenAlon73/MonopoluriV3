import { NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/ai';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

export async function POST(req: Request) {
    try {
        const { messages, userId } = await req.json();

        // Fetch user's financial data to provide context
        let financialContext = "";

        if (userId) {
            try {
                // Fetch transactions
                const transactionsSnapshot = await getDocs(query(collection(db, 'transactions')));
                const transactions = transactionsSnapshot.docs.map(doc => doc.data());

                // Fetch goals
                const goalsSnapshot = await getDocs(query(collection(db, 'goals')));
                const goals = goalsSnapshot.docs.map(doc => doc.data());

                // Build context string
                financialContext = `
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
            } catch (error) {
                console.error("Error fetching financial data:", error);
            }
        }

        // Inject financial context as a system message
        const messagesWithContext = financialContext
            ? [{ role: 'system' as const, content: financialContext }, ...messages]
            : messages;

        const response = await chatWithAI(messagesWithContext);
        return NextResponse.json({ response });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
