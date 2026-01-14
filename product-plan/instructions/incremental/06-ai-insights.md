# Milestone 06: AI Insights Section

## Overview
Implement an intelligence hub combining a proactive "Intelligence Feed" with an interactive "Advisor Chat".

## Components to Build

### 1. InsightsPage Component
Main container with two sections:
- **Top Section:** Scrollable feed of insight cards
- **Bottom Section:** Persistent chat interface
- Layout: Vertical split, chat interface fixed at bottom or side

### 2. InsightCard Component
Display proactive financial insights:
- **Visual Elements:**
  - Distinct icon for card type (Anomaly, Forecast, Suggestion)
  - Title (bold, concise)
  - Message (detailed explanation)
  - Date/timestamp
  - Trend indicator (positive/negative/neutral)
- **Styling:**
  - Anomaly: Red/amber accent (alert)
  - Forecast: Blue accent (informational)
  - Suggestion: Green/lime accent (positive action)
- **Behavior:** Read-only, no action buttons

### 3. ChatBubble Component
Individual message in chat history:
- **User messages:** Right-aligned, different background
- **AI messages:** Left-aligned, formatted text support
- Timestamp below each message
- Support for **bold text**, lists, and basic formatting

### 4. ChatInput Component
Message input field with:
- Text input area (expandable)
- Send button
- Disabled state while waiting for response
- Clear field after sending

### 5. Chat Functionality
Implement chat behavior:
- Accept user questions
- Display AI responses (can be mock/hardcoded initially)
- Maintain chat history
- Auto-scroll to latest message
- Show typing indicator while generating response (optional)

## Tone & Style

### Persona: Formal Financial Advisor
- **Voice:** Professional, data-driven, objective
- **Style:** No emojis, formal language
- **Content:** Actionable insights backed by data

### Visual Design
- Premium, trustworthy aesthetic
- Consider using serif font for AI messages to distinguish from UI
- Clean, spacious layout
- Professional color palette

## Backend Integration (Future)

You'll eventually need:
- `GET /api/insights` — Fetch proactive insights
- `POST /api/chat` — Send user message, get AI response
- WebSocket for real-time chat (optional)

For now, you can:
- Use static insight data
- Mock AI responses with setTimeout
- Store chat history in component state

## Sample Data

See `../sections/ai-insights/sample-data.json` for:
- Sample insight cards (Anomaly, Forecast, Suggestion)
- Sample chat history
- Example AI responses

## Reference Components

See `../sections/ai-insights/components/` for fully implemented React components:
- `InsightsPage.tsx`
- `InsightCard.tsx`
- `ChatBubble.tsx`
- `ChatInput.tsx`
- `index.ts` (exports)

## Acceptance Criteria

- [ ] Insight feed displays all cards
- [ ] Cards styled by type (Anomaly, Forecast, Suggestion)
- [ ] Chat interface renders at bottom/side
- [ ] Can send messages in chat
- [ ] Chat history displays correctly
- [ ] User vs. AI messages visually distinct
- [ ] Chat auto-scrolls to latest message
- [ ] Supports formatted AI responses (bold, lists)
- [ ] Professional, formal tone throughout
- [ ] Mobile responsive
- [ ] Dark mode supported

## Testing

See `../sections/ai-insights/tests.md` for complete TDD specifications including:
- User flow tests
- Chat interaction tests
- Empty states (no insights, no chat history)
- Edge cases
