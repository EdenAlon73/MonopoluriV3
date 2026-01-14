// =============================================================================
// Data Types
// =============================================================================

export type InsightType = 'Anomaly' | 'Forecast' | 'Suggestion';
export type Trend = 'positive' | 'negative' | 'neutral';

export interface InsightCardData {
    id: string;
    type: InsightType;
    title: string;
    message: string;
    trend: Trend;
    date: string;
}

export type Sender = 'user' | 'ai';

export interface ChatMessageData {
    id: string;
    sender: Sender;
    content: string;
    timestamp: string;
}

export interface AIInsightsData {
    insights: InsightCardData[];
    chatHistory: ChatMessageData[];
}

// =============================================================================
// Component Props
// =============================================================================

export interface InsightFeedProps {
    insights: InsightCardData[];
}

export interface ChatInterfaceProps {
    history: ChatMessageData[];
    onSendMessage: (message: string) => void;
}
