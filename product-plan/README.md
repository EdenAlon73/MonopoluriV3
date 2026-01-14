# Monopoluri — Product Design Package

Welcome to your complete product design package for **Monopoluri**, a private web application for couples to track and manage their shared and individual finances.

## What's Inside

This package contains everything your development team needs to implement Monopoluri:

### 📋 Ready-to-Use Prompts
Pre-written prompts you can copy/paste into your coding agent (Claude Code, Cursor, Copilot, etc.):
- **`prompts/one-shot-prompt.md`** — Build the entire product in one session
- **`prompts/section-prompt.md`** — Build incrementally, section by section

### 📝 Implementation Instructions
Detailed guides for your coding agent:
- **`product-overview.md`** — Product context (always provide this)
- **`instructions/one-shot-instructions.md`** — All milestones combined
- **`instructions/incremental/`** — Step-by-step milestone guides

### 🎨 Design System
- **`design-system/`** — Color palette, typography, and styling tokens

### 📊 Data Model
- **`data-model/`** — TypeScript types, sample data, and entity definitions

### 🧩 Components
Production-ready React components:
- **`shell/`** — Application navigation and layout
- **`sections/`** — Feature components for each section

### ✅ Test Instructions
- **`sections/[section-id]/tests.md`** — Framework-agnostic TDD specs for each section

## Quick Start

### Option A: Build Incrementally (Recommended)

Build your product milestone by milestone:

1. Copy the content of **`prompts/section-prompt.md`**
2. Start a new conversation with your coding agent
3. Paste the prompt
4. Answer the agent's clarifying questions
5. Let it build milestone 01 (Foundation)
6. Review, test, commit
7. Repeat for each milestone

### Option B: Build Everything at Once

Build the entire product in one session:

1. Copy the content of **`prompts/one-shot-prompt.md`**
2. Start a new conversation with your coding agent
3. Paste the prompt
4. Answer the agent's clarifying questions
5. Let it build everything
6. Review, test, commit

## About the Components

All exported components are:
- **Props-based** — Accept data and callbacks via props
- **Portable** — Work with any React setup
- **Complete** — Full styling, responsive design, dark mode
- **Production-ready** — Not prototypes or mockups

Your implementation agent will:
- Wire up callbacks to routing and API calls
- Replace sample data with real data from your backend
- Implement error handling and loading states
- Implement empty states
- Build the backend APIs
- Write tests based on the provided test instructions

## Tech Requirements

- **Frontend:** React + Tailwind CSS (required)
- **Backend:** Your choice (Rails, Laravel, Next.js, Python, etc.)
- **Testing:** Your choice (framework-agnostic test specs provided)

## Questions?

See the individual README files in each directory for more details about specific components and implementation guidance.
