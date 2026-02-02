const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function chatWithAI(messages: { role: 'user' | 'assistant' | 'system', content: string }[]) {
    if (!OPENROUTER_API_KEY) {
        console.warn("OPENROUTER_API_KEY is not set");
        // Return mock if no key for dev
        return "I am an AI assistant (Mock). Please set your API Key to get real responses.";
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
                "X-Title": "MonopoluriV3",
            },
            body: JSON.stringify({
                "model": "z-ai/glm-4.5-air:free",
                "messages": messages,
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenRouter API Error: ${err}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("AI Chat Error:", error);
        throw error;
    }
}
