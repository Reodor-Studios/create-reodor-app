# Agentic Chatbot - Complete Vision Document

## Overview

This document outlines the complete vision for an agentic chatbot feature built with Vercel AI SDK, AI Elements, and Next.js. The chatbot provides an intelligent conversational interface with advanced capabilities including tool calling, reasoning, web search, file attachments, and conversation management.

## Table of Contents

1. [Product Vision](#product-vision)
2. [Core Features](#core-features)
3. [Technical Architecture](#technical-architecture)
4. [User Interface](#user-interface)
5. [Data Models](#data-models)
6. [Implementation Phases](#implementation-phases)
7. [Future Enhancements](#future-enhancements)

---

## Product Vision

### Mission Statement

Create an intuitive, powerful AI chat interface that enables users to have intelligent conversations with AI models, complete with tool execution, reasoning transparency, web search capabilities, and rich media support.

### Target Users

- Developers seeking AI assistance with code and technical questions
- Knowledge workers needing research and information synthesis
- Content creators looking for creative assistance
- General users wanting an intelligent conversational assistant

### Key Differentiators

1. **Multi-Model Support** - Switch between GPT-4o, Claude, Gemini, and specialized models
2. **Reasoning Transparency** - See the model's thinking process (when supported)
3. **Tool Execution** - Watch AI execute tools and see results in real-time
4. **Web Search Integration** - Ground responses in current web information
5. **Rich File Support** - Upload images, documents, and other files for analysis
6. **Conversation Management** - Organize, search, and pin important conversations
7. **Beautiful UI** - Polished interface built with AI Elements and shadcn/ui

---

## Core Features

### 1. Conversation Management

**Sidebar Navigation**
- Collapsible sidebar with icon-only compact mode
- Grouped conversations by recency:
  - Today
  - This week
  - This month
  - Older
- Pin important conversations to top
- Search/filter conversations
- Delete conversations
- Rename conversations
- New chat button

**Persistence**
- All conversations saved to database
- Messages linked to conversations
- Conversation metadata (title, created, updated, pinned)
- User-specific conversations with RLS

### 2. Message Interface

**Input Capabilities**
- Rich text input with markdown support
- Multi-line input with proper text wrapping
- File attachments:
  - Multiple files per message
  - Images (JPEG, PNG, WebP, GIF)
  - Documents (PDF, TXT, MD)
  - Max 10MB per file
  - Client-side compression for images
  - Preview thumbnails with remove option
- Drag-and-drop file upload
- Paste images from clipboard

**Message Display**
- User messages with timestamp
- Assistant messages with streaming
- Markdown rendering with syntax highlighting
- Code blocks with copy button
- Image display with zoom capability
- File attachment previews
- Message actions (copy, regenerate, edit)

### 3. AI Capabilities

**Model Selection**
- GPT-4o (OpenAI)
- Claude 3.5 Sonnet (Anthropic)
- Deepseek R1 (Deepseek)
- Gemini 2.0 Flash (Google)
- Per-conversation model switching
- Model-specific features (reasoning for R1)

**Reasoning Display**
- Collapsible reasoning section
- Streaming reasoning tokens
- Visual indication when model is thinking
- Toggle to show/hide reasoning

**Tool Calling**
- Visual tool execution indicators
- Tool input display
- Tool output rendering
- Support for multiple tool calls
- Tool execution status (pending, running, completed, error)

**Web Search**
- Toggle web search on/off
- Integration with Perplexity Sonar
- Source citations with links
- Visual source indicators
- Collapsible sources section

### 4. Category-Based Prompts

**Quick Start Categories**
- **Create**: Content generation, writing, coding
  - "Write a blog post about..."
  - "Create a React component for..."
  - "Generate test data for..."
  - "Design a database schema for..."

- **Explore**: Research, analysis, learning
  - "Explain how quantum computing works"
  - "Compare different state management solutions"
  - "Research the history of..."
  - "Analyze the pros and cons of..."

- **Code**: Programming assistance
  - "Debug this code snippet"
  - "Refactor this function"
  - "Explain this algorithm"
  - "Write unit tests for..."

- **Learn**: Educational content
  - "Teach me about machine learning"
  - "How does blockchain work?"
  - "What is functional programming?"
  - "Explain design patterns"

**Interaction**
- Click category to highlight
- Click question to prefill input
- Animated transitions
- Disappears when first message sent

---

## Technical Architecture

### Frontend Stack

**Core Framework**
- Next.js 15 (App Router)
- React 19
- TypeScript (strict mode)

**AI Integration**
- Vercel AI SDK (`ai`)
- AI SDK React (`@ai-sdk/react`)
- AI Elements (prebuilt UI components)

**UI Components**
- shadcn/ui (primary component library)
- Kibo UI (specialized components)
- Magic UI (animations - BlurFade)
- Tailwind CSS (styling)

**State Management**
- TanStack Query (server state)
- Zustand (client state - optional for chat state)
- React Hook Form (forms)
- Zod (validation)

### Backend Stack

**Database**
- Supabase PostgreSQL
- Row Level Security (RLS)
- Real-time subscriptions

**Storage**
- Supabase Storage
- Separate buckets:
  - `chat_attachments` (10MB max)
  - Public read for user's own files

**API Routes**
- Next.js API routes (`app/api/chat/route.ts`)
- Vercel AI SDK integration
- Streaming responses
- Tool execution

### Data Flow

```
User Input → PromptInput Component
    ↓
useChat Hook (AI SDK)
    ↓
API Route (/api/chat)
    ↓
streamText (AI SDK Core)
    ↓
Model Provider (OpenAI/Anthropic/etc)
    ↓
Streaming Response
    ↓
UI Updates (messages, reasoning, tools, sources)
```

---

## User Interface

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Navbar (Global)                                    │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  Sidebar     │  Chat Content Area                   │
│              │                                      │
│  - Trigger   │  ┌────────────────────────────────┐ │
│  - New Chat  │  │  Messages                      │ │
│  - Search    │  │  - User Message                │ │
│  ───────────  │  │  - Assistant Response          │ │
│  Today       │  │  - Tool Calls                  │ │
│  - Conv 1    │  │  - Reasoning                   │ │
│  - Conv 2    │  │  - Sources                     │ │
│              │  └────────────────────────────────┘ │
│  This Week   │                                      │
│  - Conv 3    │  ┌────────────────────────────────┐ │
│              │  │  Prompt Input                  │ │
│              │  │  - Attachments Preview         │ │
│              │  │  - Text Area                   │ │
│              │  │  - Model Picker | Web Search   │ │
│              │  └────────────────────────────────┘ │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

### Responsive Behavior

**Desktop (≥768px)**
- Sidebar always visible (default)
- Can collapse to icon-only mode
- Main content adjusts width
- Side-by-side layout

**Mobile (<768px)**
- Sidebar as drawer (Sheet)
- Full-width chat content
- Hamburger menu to open sidebar
- Bottom-anchored input

### Color System

**Theme Support**
- Full light/dark mode support
- Semantic color tokens
- Model-specific accent colors:
  - GPT-4o: Green
  - Claude: Orange
  - Deepseek: Blue
  - Gemini: Purple

**Message Styling**
- User messages: Right-aligned, primary color background
- Assistant messages: Left-aligned, muted background
- Reasoning: Amber/yellow accent
- Tool calls: Blue accent
- Sources: Green accent

### Animations

**BlurFade Usage**
- Messages fade in on receive
- Category cards stagger on load
- Sidebar items fade on open
- Tool execution indicators
- Duration: 0.5s
- Stagger delay: 0.1s per item

---

## Data Models

### Database Schema

#### `conversations` Table
```sql
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  pinned boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index conversations_user_id_idx on public.conversations(user_id);
create index conversations_updated_at_idx on public.conversations(updated_at desc);
```

#### `messages` Table
```sql
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text,
  model text,
  reasoning text,
  tool_calls jsonb,
  sources jsonb,
  created_at timestamptz default now() not null
);

create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_created_at_idx on public.messages(created_at);
```

#### `media` Table Extension
```sql
-- Add conversation and message references
alter table public.media
  add column conversation_id uuid references public.conversations(id) on delete cascade,
  add column message_id uuid references public.messages(id) on delete cascade;

-- Add chat_attachment media type
alter type public.media_type add value 'chat_attachment';
```

### TypeScript Types

```typescript
// Conversation types
interface Conversation {
  id: string;
  userId: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: string;
}

// Message types (aligned with AI SDK UIMessage)
interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
  createdAt: string;
}

type MessagePart =
  | TextPart
  | FilePart
  | ReasoningPart
  | ToolCallPart
  | ToolResultPart
  | SourcePart;

interface TextPart {
  type: 'text';
  text: string;
}

interface FilePart {
  type: 'file';
  url: string;
  filename: string;
  mediaType: string;
}

interface ReasoningPart {
  type: 'reasoning';
  text: string;
}

interface ToolCallPart {
  type: 'tool-call';
  toolName: string;
  args: Record<string, any>;
}

interface ToolResultPart {
  type: 'tool-result';
  toolName: string;
  result: any;
}

interface SourcePart {
  type: 'source-url';
  id: string;
  url: string;
  title?: string;
}

// Model types
interface Model {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'deepseek' | 'google';
  supportsReasoning: boolean;
  supportsVision: boolean;
  maxTokens: number;
}

// Category types
interface Category {
  id: string;
  name: string;
  icon: React.ComponentType;
  questions: string[];
}
```

---

## Implementation Phases

### Phase 1: Frontend Foundation (Current)

**Goal**: Build complete UI with mock data and AI SDK integration

**Deliverables**:
- ✅ Vision document
- ✅ Navigation integration
- ✅ Auth-gated chat page
- ✅ Sidebar with mock conversations
- ✅ Category-based quick start
- ✅ Prompt input with file handling
- ✅ Mock API route with streaming
- ✅ Message rendering (text, reasoning, tools, sources)
- ✅ Responsive layout
- ✅ Animations and polish

**Timeline**: 1-2 days

### Phase 2: Backend Integration

**Goal**: Connect to real AI providers and database

**Tasks**:
- Create database schema (conversations, messages)
- Set up Supabase storage bucket
- Implement server actions (CRUD operations)
- Connect to OpenAI/Anthropic/Deepseek APIs
- Real conversation persistence
- File upload to Supabase Storage
- Message history loading
- Real-time message subscriptions

**Timeline**: 2-3 days

### Phase 3: Advanced Features

**Goal**: Add tool calling, web search, and advanced capabilities

**Tasks**:
- Define tool schemas
- Implement tool execution
- Perplexity Sonar integration for web search
- Source citation rendering
- Reasoning token streaming (Deepseek R1)
- Multi-step tool execution
- Error handling and retry logic
- Usage tracking and limits

**Timeline**: 3-4 days

### Phase 4: Polish and Optimization

**Goal**: Production-ready feature

**Tasks**:
- Conversation search implementation
- Pinning functionality
- Conversation sharing
- Export conversations
- Message editing/deletion
- Keyboard shortcuts
- Mobile optimization
- Performance optimization
- Error boundaries
- Loading states
- Empty states
- Documentation

**Timeline**: 2-3 days

---

## Future Enhancements

### User Experience
- [ ] Voice input/output
- [ ] Conversation templates
- [ ] Custom instructions per conversation
- [ ] Message reactions
- [ ] Threading/branching conversations
- [ ] Conversation folders/tags
- [ ] Collaborative conversations (shared access)

### AI Capabilities
- [ ] Custom tools/functions
- [ ] Multi-agent workflows
- [ ] Memory across conversations
- [ ] Retrieval-Augmented Generation (RAG)
- [ ] Fine-tuned models
- [ ] Prompt templates
- [ ] AI-suggested follow-ups

### Developer Features
- [ ] API access to conversations
- [ ] Webhooks for events
- [ ] Custom model endpoints
- [ ] Conversation analytics
- [ ] A/B testing different prompts
- [ ] Cost tracking and optimization

### Integration
- [ ] Slack integration
- [ ] Email summaries
- [ ] Calendar integration
- [ ] GitHub integration
- [ ] Notion/Confluence sync
- [ ] Export to various formats

### Administration
- [ ] Admin dashboard for monitoring
- [ ] Usage analytics
- [ ] Model performance metrics
- [ ] User feedback collection
- [ ] Content moderation
- [ ] Rate limiting per user
- [ ] Custom model configurations

---

## Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Messages per user per day
- Average conversation length
- Return rate (7-day, 30-day)
- Feature adoption rates

### Performance
- Message streaming latency (p50, p95, p99)
- Time to first token
- Tool execution time
- API error rate
- Uptime/availability

### Quality
- User satisfaction (CSAT)
- Conversation completion rate
- Regeneration frequency
- Error recovery rate
- File upload success rate

### Business
- Conversion from free to paid
- API usage costs
- Token efficiency
- Storage costs
- Cost per message

---

## Technical Considerations

### Performance

**Optimization Strategies**:
- Virtual scrolling for long conversations
- Lazy loading of old messages
- Image optimization and compression
- Debounced search
- Optimistic updates
- Request deduplication

### Security

**Considerations**:
- Row Level Security (RLS) on all tables
- File upload validation and scanning
- Rate limiting per user
- Content moderation
- API key rotation
- Input sanitization
- XSS prevention

### Scalability

**Architecture**:
- Horizontal scaling of API routes
- CDN for static assets
- Database connection pooling
- Caching strategies (Redis)
- Background job processing
- Multi-region deployment

### Accessibility

**WCAG 2.1 AA Compliance**:
- Keyboard navigation
- Screen reader support
- ARIA labels and roles
- Focus management
- Color contrast
- Text alternatives for media
- Error announcements

---

## Conclusion

This agentic chatbot feature represents a comprehensive AI chat interface that combines the power of modern AI models with an intuitive, beautiful user interface. By leveraging Vercel AI SDK, AI Elements, and Next.js, we create a production-ready solution that's both powerful for advanced users and accessible for beginners.

The phased implementation approach allows for iterative development, starting with a solid frontend foundation and progressively adding backend integration, advanced features, and optimizations. This ensures we can validate the user experience early while maintaining high code quality throughout the development process.

The vision extends beyond a simple chat interface to include intelligent conversation management, transparent AI reasoning, tool execution, web search, and rich media support - creating a truly agentic experience where AI doesn't just respond, but actively helps users accomplish their goals.

---

**Document Version**: 1.0
**Last Updated**: 2025-01-04
**Status**: Phase 1 - Frontend Foundation (In Progress)
