# AI Insights Section — Test Instructions

This document provides framework-agnostic test specifications for implementing TDD for the AI Insights section.

## Test Categories

### 1. User Flow Tests

#### Happy Path: View Insights Feed
**Steps:**
1. User navigates to AI Insights page
2. Insights feed displays at top

**Expected Results:**
- All insight cards render
- Cards display in reverse chronological order (newest first)
- Each card shows icon, title, message, date, trend indicator

#### Happy Path: Send Chat Message
**Steps:**
1. User types message in chat input: "How much did I spend on coffee last month?"
2. User clicks "Send" button

**Expected Results:**
- User message appears in chat history (right-aligned)
- Input field clears
- Send button disables briefly
- AI response appears after brief delay (left-aligned)
- Chat auto-scrolls to bottom

#### Happy Path: Multi-Turn Conversation
**Steps:**
1. User sends first message
2. AI responds
3. User sends follow-up question
4. AI responds with context from previous exchange

**Expected Results:**
- Chat history maintains order
- Each message has timestamp
- User and AI messages visually distinct
- Chat scrolls to show latest message

### 2. Insight Card Tests

#### Insight Type Styling
**Verify Each Type:**
- **Anomaly:** Red/amber accent, warning icon
- **Forecast:** Blue accent, forecast/trend icon
- **Suggestion:** Green/lime accent, lightbulb/idea icon

#### Trend Indicators
**Test Cases:**
- Positive trend → Green indicator (e.g., up arrow, green dot)
- Negative trend → Red indicator (e.g., down arrow, red dot)
- Neutral trend → Neutral indicator (e.g., dash, gray dot)

#### Card Interactions
**Test:**
- Cards are read-only (no click actions)
- Scrollable if many cards
- Newest cards appear at top

### 3. Chat Interface Tests

#### Send Message
**Test Cases:**
- Type message and click "Send" → Message sent
- Type message and press Enter → Message sent
- Empty message → Send button disabled
- Whitespace-only message → Not sent or trimmed

#### Message Display
**Verify:**
- User messages right-aligned, distinct background
- AI messages left-aligned, different background
- Timestamps display below each message
- Formatted text (bold, lists) renders correctly

#### Auto-Scroll Behavior
**Test:**
- New message → Scrolls to bottom automatically
- User scrolled up → New message doesn't force scroll (or shows "New message" indicator)
- Many messages → Scrollbar appears, scrolls smoothly

#### Input Field
**Test:**
- Placeholder text displays when empty
- Multi-line input supported (or single-line, depending on design)
- Character limit (if applicable)
- Disabled while waiting for AI response

### 4. Empty State Tests

#### No Insights Available
**Condition:** No insights have been generated yet

**Expected UI:**
- Display empty state: "No insights yet"
- Optional message: "We'll analyze your finances and provide insights soon"
- No insight cards displayed

#### No Chat History
**Condition:** User hasn't sent any messages

**Expected UI:**
- Chat interface visible but empty
- Placeholder message: "Ask me anything about your finances"
- Input field ready for first message

### 5. AI Response Handling

#### Mock AI Response
**For Initial Implementation:**
- Simulate AI response with setTimeout (1-2 seconds)
- Return hardcoded responses based on keywords
- Examples:
  - "coffee" → "You spent $240 on coffee last month."
  - "savings" → "Your current savings rate is 18.5%."

#### Loading State
**While Waiting for AI:**
- Show typing indicator (three dots animation)
- Disable send button
- Input field disabled (optional)

#### Error Handling
**Test Cases:**
- AI API fails → Display error message: "I'm having trouble right now. Please try again."
- Network timeout → Same error message
- Invalid response → Fallback message

### 6. Formatting & Tone Tests

#### AI Message Formatting
**Verify:**
- **Bold text:** Supported (e.g., **$240**)
- **Line breaks:** Preserved
- **Lists:** Formatted correctly (bullet points or numbered)
- **Currency:** Formatted with $ and commas (e.g., $1,234.56)
- **Percentages:** Formatted correctly (e.g., 18.5%)

#### Professional Tone
**Test:**
- No emojis in AI responses
- Formal, data-driven language
- Objective, not playful or casual
- Example: "Your spending in Entertainment is $450 this month" (not "Looks like you've been having fun! 🎉")

### 7. Edge Cases

#### Very Long AI Response
**Test:**
- AI response exceeds chat bubble height
- Response wraps correctly
- Chat remains readable

#### Rapid Message Sending
**Test:**
- User sends multiple messages quickly
- All messages queue and display in order
- No duplicate messages
- No messages lost

#### Special Characters in Messages
**Test Cases:**
- User inputs: "What's my balance?" → Apostrophe renders correctly
- User inputs: "$1,000" → Dollar signs and commas display
- User inputs: "< > &" → HTML entities don't break UI

#### Chat History Persistence
**Test:**
- User navigates away and back → Chat history persists (session storage)
- User refreshes page → Chat history persists (local storage) or clears (session)

### 8. Responsive & Visual Tests

#### Responsive Layout
**Test On:**
- Mobile (< 768px): Insights feed stacks above chat, both full width
- Tablet (768px - 1023px): Same as mobile or side-by-side
- Desktop (≥ 1024px): Insights feed above, chat below (or side-by-side)

**Verify:**
- Chat input always accessible
- Insight cards readable on small screens
- Chat bubbles don't overflow

#### Dark Mode
**Verify:**
- Insight cards readable in dark mode
- Chat bubbles have appropriate backgrounds
- Input field styled for dark mode
- Typing indicator visible
- Icons and trend indicators visible

#### Scrolling
**Verify:**
- Insights feed scrolls independently
- Chat history scrolls independently
- Input field fixed at bottom (doesn't scroll away)

### 9. Integration Tests

#### Insights Update Over Time
**Test:**
- New insight is generated (mock backend event)
- New insight appears at top of feed
- Existing insights remain

#### Chat and Insights Coexist
**Verify:**
- Insights feed and chat don't interfere
- Both sections function independently
- Page doesn't slow down with many insights and messages

## Implementation Notes

- For initial version, mock AI responses
- Plan for future integration with OpenAI/Anthropic APIs
- Consider WebSocket for real-time chat (future)
- Store chat history in session/local storage
- Test with various response times
- Optimize for slow network conditions

## Acceptance Criteria Checklist

- [ ] Insights feed displays all cards
- [ ] Cards styled by type (Anomaly, Forecast, Suggestion)
- [ ] Trend indicators display correctly
- [ ] Can send chat messages
- [ ] User and AI messages visually distinct
- [ ] Chat auto-scrolls to latest message
- [ ] AI responses appear after brief delay
- [ ] Typing indicator shows while loading
- [ ] Empty states display appropriately
- [ ] Chat history persists in session
- [ ] Formatted text renders correctly (bold, lists)
- [ ] Professional, formal tone in AI responses
- [ ] Responsive layout on all screen sizes
- [ ] Dark mode fully supported
- [ ] Error handling works (failed AI requests)
- [ ] No errors with edge cases (long messages, special characters)
