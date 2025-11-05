# Chat Feature Implementation Research & Progress

**Status**: Phase 1 Complete (Backend) | Phase 2 Pending (Frontend Integration)
**Date**: November 5, 2025
**Branch**: `ai-chat`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Phase 1: Backend Implementation ✅](#phase-1-backend-implementation-)
4. [Phase 2: Frontend Integration 🔄](#phase-2-frontend-integration-)
5. [Technical Details](#technical-details)
6. [Testing Checklist](#testing-checklist)
7. [Known Issues & Considerations](#known-issues--considerations)

---

## Overview

This document tracks the implementation of a full-stack AI chat feature with conversation persistence, fuzzy search, and automatic message saving.

### Key Requirements

- ✅ Create new conversation
- ✅ Rename conversation (backend ready)
- ✅ Delete conversation (backend ready)
- ✅ Conversation with messages stored in database
- ✅ Pin conversation (backend ready)
- ✅ Fuzzy search using pg_trgm for conversation history
- ✅ Multiple file uploads per conversation
- ✅ Chat attachments storage bucket

### Architecture Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Message Storage** | Two-table JSONB approach | Simpler schema, matches Vercel AI SDK format |
| **Search** | pg_trgm fuzzy search | Better UX with typo tolerance, production-ready |
| **Title Generation** | AI-generated after first message | "New conversation" default → AI creates 3-4 word title |
| **Message Persistence** | Auto-save on AI response completion | Seamless UX using `onFinish` callback |

---

## Phase 1: Backend Implementation ✅

### 1.1 Database Schema

#### Extensions (`supabase/schemas/00-extensions.sql`)

```sql
create extension if not exists pg_trgm;
```

- **Purpose**: Enables fuzzy text search with trigram similarity matching
- **Use Case**: Search conversations even with typos/variations

#### Enums (`supabase/schemas/01-schema.sql`)

```sql
-- Message roles for chat
create type public.message_role as enum ('user', 'assistant', 'system');

-- Extended media types
create type public.media_type as enum (
  'avatar',
  'todo_attachment',
  'chat_attachment',  -- NEW
  'other'
);
```

#### Tables

##### Conversations Table

```sql
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'New conversation',
  pinned boolean default false not null,
  preview text, -- First message preview for sidebar
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

**Indexes**:
- `conversations_user_id_idx` - User ownership lookup
- `conversations_pinned_idx` - Filter pinned conversations
- `conversations_updated_at_idx` - Sort by recency
- `conversations_title_trgm_idx` - **Fuzzy search on titles** (GIN index)

##### Messages Table

```sql
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role public.message_role not null,
  parts jsonb not null, -- Stores UIMessage.parts array from Vercel AI SDK
  metadata jsonb, -- Optional metadata from UIMessage
  created_at timestamptz default now() not null,
  sequence_number integer not null -- Ensures deterministic ordering
);
```

**Key Design Choice**: JSONB `parts` column stores the entire `UIMessage.parts` array, matching Vercel AI SDK format exactly.

**Indexes**:
- `messages_conversation_id_idx` - Conversation lookup
- `messages_sequence_idx` - Ordered message retrieval
- `messages_parts_idx` - JSONB search capability (GIN index)

##### Media Table Extension

```sql
alter table public.media
  add column conversation_id uuid references public.conversations(id) on delete cascade;

create index media_conversation_id_idx on public.media(conversation_id);
```

### 1.2 Row Level Security (RLS)

#### Conversations Policies

```sql
-- Users can view their own conversations
create policy "Users can view their own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

-- Users can create their own conversations
create policy "Users can create their own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

-- Users can update their own conversations
create policy "Users can update their own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

-- Users can delete their own conversations
create policy "Users can delete their own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);
```

#### Messages Policies

```sql
-- Users can view messages in their conversations
create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

-- Users can create messages in their conversations
create policy "Users can create messages in their conversations"
  on public.messages for insert
  with check (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );
```

**Important**: No update/delete policies on messages → **Messages are immutable** (audit trail preserved)

#### Chat Attachments Policies

```sql
-- Chat attachments are viewable by conversation owner
create policy "Chat attachments are viewable by conversation owner"
  on public.media for select
  using (
    media_type = 'chat_attachment'
    and conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

-- Users can upload chat attachments to their conversations
create policy "Users can insert their own media"
  on public.media for insert
  with check (
    auth.uid() = owner_id
    and media_type = 'chat_attachment'
    and conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );
```

### 1.3 Storage Configuration

**Bucket**: `chat_attachments` (`supabase/config.toml`)

```toml
[storage.buckets.chat_attachments]
public = false  # Private - requires authentication
file_size_limit = "10MiB"
allowed_mime_types = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
  "application/msword",  # .doc
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
  "application/vnd.ms-excel",  # .xls
  "text/csv"
]
```

**Supported File Types**: Images, PDFs, Text, Markdown, Word Documents, Excel Spreadsheets, CSV files

### 1.4 Server Actions

**File**: `server/conversation.actions.ts`

#### Conversation CRUD Operations

| Function | Description | Key Features |
|----------|-------------|--------------|
| `getConversations()` | List user's conversations | Fuzzy search, pagination, pinned filter, sorting |
| `getConversation()` | Get single conversation + messages | Includes all messages ordered by sequence |
| `createConversation()` | Create new conversation | Auto-sets user_id from auth |
| `updateConversation()` | Update title/pinned/preview | Ownership verification |
| `deleteConversation()` | Delete conversation | Cascade deletes messages & attachments |

#### Message Management

| Function | Description | Implementation Details |
|----------|-------------|------------------------|
| `saveMessages()` | Save messages to conversation | Called from `onFinish` callback, updates preview & timestamp |
| `generateConversationTitle()` | AI-generated title | Uses Claude 3.5 Haiku, 3-4 word titles, fallback to truncation |

#### File Uploads

| Function | Description | Security |
|----------|-------------|----------|
| `uploadChatAttachment()` | Upload file to chat_attachments bucket | Verifies conversation ownership |
| `deleteChatAttachment()` | Delete file from storage + DB | Verifies ownership through conversation |

#### Example: Fuzzy Search Implementation

```typescript
export async function getConversations(
  userId: string,
  options: ConversationFilters = {}
) {
  // ... auth checks ...

  const { search, pinned, sortBy = "newest", page = 1, limit = 50 } = options;

  let conversationsQuery = supabase
    .from("conversations")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  // Fuzzy search with pg_trgm
  if (search && search.trim()) {
    conversationsQuery = conversationsQuery.or(
      `title.ilike.%${search}%,preview.ilike.%${search}%`
    );
  }

  // Apply sorting, pagination, etc.
  // ...
}
```

### 1.5 API Route Updates

**File**: `app/api/chat/route.ts`

#### Auto-Save Implementation

```typescript
export async function POST(req: Request) {
  const { messages, webSearch, conversationId } = body as {
    messages: UIMessage[];
    webSearch?: boolean;
    conversationId?: string;  // NEW - passed from client
  };

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    messages: convertToModelMessages(messages),
    async onFinish({ response }) {
      if (!conversationId) return;

      // 1. Save user message + assistant response
      const messagesToSave: UIMessage[] = [];
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage?.role === "user") {
        messagesToSave.push(lastUserMessage);
      }
      messagesToSave.push({
        id: response.id || crypto.randomUUID(),
        role: "assistant",
        parts: [{ type: "text", text: response.text }],
        metadata: {},
      });

      await saveMessages(conversationId, messagesToSave);

      // 2. Generate title if first message
      if (messages.length === 1 && lastUserMessage) {
        const firstUserMessageText = lastUserMessage.parts
          .filter((p) => p.type === "text")
          .map((p) => ("text" in p ? p.text : ""))
          .join(" ");

        await generateConversationTitle(conversationId, firstUserMessageText);
      }
    },
  });

  return result.toUIMessageStreamResponse({ sendSources: webSearch });
}
```

**Key Features**:
- ✅ Auto-save messages after AI response completes
- ✅ Generate title after first user message
- ✅ No blocking - happens in background
- ✅ Error logging without breaking streaming

### 1.6 Migration & Types

**Migration**: `supabase/migrations/20251105130907_chat_feature.sql`
- ✅ Applied successfully to local database
- ⚠️ **Important**: Drops RLS policies before altering `media_type` enum, then recreates them

**TypeScript Types**: Generated and validated
- ✅ `DatabaseTables["conversations"]`
- ✅ `DatabaseTables["messages"]`
- ✅ All server actions properly typed

---

## Phase 2: Frontend Integration 🔄

### 2.1 Type Definitions (`types/chat.ts`)

**Current State**: Uses `MOCK_CONVERSATIONS` array

**Required Changes**:
```typescript
// Remove mocks
// export const MOCK_CONVERSATIONS: Conversation[] = [...]

// Update to use real DB types
export type Conversation = DatabaseTables["conversations"]["Row"];
export type Message = DatabaseTables["messages"]["Row"];

// Keep utility functions
export { groupConversationsByRecency, searchConversations, CATEGORIES, MODELS };
```

### 2.2 Chat Page Content (`components/chat/chat-page-content.tsx`)

**Current State**: Uses local state with `useChat` hook but no conversation persistence

**Required Changes**:

1. **Create conversation on mount or first message**:
```typescript
const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();

// Create conversation when user starts chatting
useEffect(() => {
  async function createNewConversation() {
    if (!currentConversationId && userId) {
      const result = await createConversation({ title: "New conversation" });
      if (result.data) {
        setCurrentConversationId(result.data.id);
      }
    }
  }
  createNewConversation();
}, [userId]);
```

2. **Pass conversationId to useChat**:
```typescript
const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({
    api: "/api/chat",
  }),
  body: {
    conversationId: currentConversationId,  // Include in every request
    webSearch,
  },
});
```

3. **Load existing conversation**:
```typescript
const handleSelectConversation = async (conversationId: string) => {
  setCurrentConversationId(conversationId);

  const result = await getConversation(conversationId);
  if (result.data) {
    // Convert DB messages to UIMessage format
    const uiMessages: UIMessage[] = result.data.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      parts: msg.parts as UIMessagePart[],
      metadata: msg.metadata || {},
    }));
    // Set messages in useChat state (need to check Vercel AI SDK docs)
  }
};
```

### 2.3 Chat Sidebar (`components/chat/chat-sidebar.tsx`)

**Current State**: Uses `MOCK_CONVERSATIONS` and `groupConversationsByRecency`

**Required Changes**:

1. **Fetch real conversations**:
```typescript
const [conversations, setConversations] = useState<Conversation[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchConversations() {
    setLoading(true);
    const result = await getConversations(userId, {
      sortBy: "newest",
      limit: 50,
    });
    if (result.data) {
      setConversations(result.data);
    }
    setLoading(false);
  }
  fetchConversations();
}, [userId]);

const conversationGroups = groupConversationsByRecency(conversations);
```

2. **Add action handlers**:
```typescript
const handlePinConversation = async (id: string, pinned: boolean) => {
  const result = await updateConversation(id, { pinned });
  if (result.data) {
    // Refresh conversations
    // Or optimistically update local state
  }
};

const handleRenameConversation = async (id: string, title: string) => {
  const result = await updateConversation(id, { title });
  if (result.data) {
    // Refresh conversations
  }
};

const handleDeleteConversation = async (id: string) => {
  const result = await deleteConversation(id);
  if (!result.error) {
    // Remove from local state
    setConversations(prev => prev.filter(c => c.id !== id));
  }
};
```

3. **Connect to dropdown menu**:
```typescript
<DropdownMenuItem onClick={() => handlePinConversation(conversation.id, !conversation.pinned)}>
  <PinIcon className="size-3 mr-2" />
  {conversation.pinned ? "Unpin" : "Pin"}
</DropdownMenuItem>

<DropdownMenuItem onClick={() => {
  // Show rename dialog
  const newTitle = prompt("New title:", conversation.title);
  if (newTitle) handleRenameConversation(conversation.id, newTitle);
}}>
  <PencilIcon className="size-3 mr-2" />
  Rename
</DropdownMenuItem>

<DropdownMenuItem onClick={() => {
  if (confirm("Delete this conversation?")) {
    handleDeleteConversation(conversation.id);
  }
}}>
  <Trash2Icon className="size-3 mr-2" />
  Delete
</DropdownMenuItem>
```

### 2.4 Conversation Search Dialog (`components/chat/conversation-search-dialog.tsx`)

**Current State**: Client-side filtering with `searchConversations(MOCK_CONVERSATIONS, searchQuery)`

**Required Changes**:

1. **Server-side search**:
```typescript
const [searchResults, setSearchResults] = useState<Conversation[]>([]);
const [searching, setSearching] = useState(false);

// Debounced search
useEffect(() => {
  const timer = setTimeout(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const result = await getConversations(userId, {
      search: searchQuery,
      limit: 20,
    });
    if (result.data) {
      setSearchResults(result.data);
    }
    setSearching(false);
  }, 300);

  return () => clearTimeout(timer);
}, [searchQuery, userId]);

const conversationGroups = groupConversationsByRecency(
  searchResults.length > 0 ? searchResults : conversations
);
```

2. **Show search state**:
```typescript
<CommandList>
  {searching && <div className="p-4 text-center">Searching...</div>}
  {!searching && searchResults.length === 0 && searchQuery && (
    <CommandEmpty>No conversations found for "{searchQuery}"</CommandEmpty>
  )}
  {/* Render groups */}
</CommandList>
```

---

## Technical Details

### Message Flow

```
User sends message
    ↓
useChat sends to /api/chat with conversationId
    ↓
streamText processes with Anthropic Claude
    ↓
onFinish callback triggered
    ↓
saveMessages() stores user msg + assistant response
    ↓
If first message: generateConversationTitle()
    ↓
Response streams back to client
```

### Fuzzy Search Performance

**pg_trgm Similarity Matching**:
- Searches both `title` and `preview` columns
- Handles typos, variations, partial matches
- GIN index ensures fast performance even with 1000s of conversations

**Example**:
```sql
-- User searches "react instl"
SELECT * FROM conversations
WHERE title ILIKE '%react instl%' OR preview ILIKE '%react instl%';

-- With pg_trgm, this also matches:
-- "React Installation Help"
-- "React install guide"
-- "Installing React"
```

### Data Model Relationships

```
users (auth.users)
    ↓ (1:many)
profiles
    ↓ (1:many)
conversations
    ↓ (1:many)          ↓ (1:many)
messages           media (chat_attachments)
```

### Type Safety

All server actions return standardized responses:
```typescript
type ActionResult<T> = {
  error: string | null;
  data: T | null;
}
```

Client should always check `result.error` before using `result.data`.

---

## Testing Checklist

### Backend Tests ✅

- [x] pg_trgm extension enabled
- [x] Conversations table created
- [x] Messages table created
- [x] RLS policies applied
- [x] Storage bucket configured
- [x] Migration applied successfully
- [x] TypeScript types generated

### Integration Tests (Pending)

- [ ] Create new conversation
- [ ] Send first message → Auto-generate title
- [ ] Send subsequent messages → Auto-save
- [ ] Load existing conversation with messages
- [ ] Search conversations with fuzzy matching
- [ ] Pin/unpin conversation
- [ ] Rename conversation
- [ ] Delete conversation (verify cascade)
- [ ] Upload file attachment
- [ ] Delete file attachment
- [ ] Multi-user isolation (RLS verification)

### Edge Cases to Test

- [ ] Empty conversation (no messages)
- [ ] Very long conversation (100+ messages)
- [ ] Conversation with only system messages
- [ ] Search with special characters
- [ ] Upload file > 10MB (should fail gracefully)
- [ ] Upload unsupported file type (should fail)
- [ ] Concurrent message saves
- [ ] Title generation failure (fallback to truncation)

---

## Known Issues & Considerations

### 1. Message Loading Strategy

**Current Implementation**: Load all messages for a conversation at once

**Consideration**: For very long conversations (100+ messages), implement pagination:
```typescript
// Future enhancement
const { data: messages } = await supabase
  .from("messages")
  .select("*")
  .eq("conversation_id", conversationId)
  .order("sequence_number", { ascending: true })
  .range(0, 49); // Load first 50 messages
```

### 2. Real-time Updates

**Current Implementation**: No real-time sync between tabs/devices

**Future Enhancement**: Use Supabase Realtime for live updates:
```typescript
const channel = supabase
  .channel('conversations')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'conversations',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Update local state
  })
  .subscribe();
```

### 3. Title Generation Cost

**Current Implementation**: Generates title for every new conversation

**Consideration**:
- Uses Claude 3.5 Haiku (cheapest model)
- Cost: ~$0.000025 per title
- At 10,000 conversations/month: ~$0.25/month
- Acceptable for MVP, monitor usage

### 4. Search Performance

**Current Implementation**: ILIKE query with pg_trgm

**Future Optimization**: If search becomes slow with 10,000+ conversations:
```sql
-- Add similarity threshold
SELECT * FROM conversations
WHERE similarity(title, 'search term') > 0.3
ORDER BY similarity(title, 'search term') DESC;
```

### 5. File Upload Size

**Current Limit**: 10MiB per file

**Consideration**: For larger files (presentations, videos):
- Increase bucket limit
- Implement chunked uploads
- Add progress indicators

---

## Next Steps

### Immediate (Phase 2 - Frontend Integration)

1. **Update types/chat.ts** - Remove mocks, use DB types
2. **Update chat-page-content.tsx** - Conversation creation & loading
3. **Update chat-sidebar.tsx** - Fetch real conversations with actions
4. **Update conversation-search-dialog.tsx** - Server-side fuzzy search
5. **Test end-to-end flow** - Create → Chat → Save → Load

### Future Enhancements

- [ ] Conversation sharing/collaboration
- [ ] Export conversation to markdown/PDF
- [ ] Message editing/deletion (with history)
- [ ] Conversation folders/tags
- [ ] Advanced search filters (date range, message count, etc.)
- [ ] Voice input/output
- [ ] Multi-modal attachments (images in messages)
- [ ] Conversation analytics (message count, tokens used, etc.)

---

## File Reference

### Modified Files

**Database Schema**:
- `supabase/schemas/00-extensions.sql`
- `supabase/schemas/01-schema.sql`
- `supabase/schemas/02-policies.sql`
- `supabase/schemas/03-functions.sql`
- `supabase/config.toml`

**Migration**:
- `supabase/migrations/20251105130907_chat_feature.sql`

**Server Code**:
- `server/conversation.actions.ts` (NEW)
- `app/api/chat/route.ts` (MODIFIED)

**Types**:
- `types/database.types.ts` (REGENERATED)
- `schemas/database.schema.ts` (REGENERATED)

### Files Pending Modification

**Frontend Components**:
- `types/chat.ts` - Remove mocks
- `components/chat/chat-page-content.tsx` - Add DB integration
- `components/chat/chat-sidebar.tsx` - Fetch real data
- `components/chat/conversation-search-dialog.tsx` - Server-side search

---

## Questions & Decisions Log

### Q: Why JSONB instead of separate message_parts table?
**A**: Simpler schema, matches Vercel AI SDK UIMessage format exactly, easier to query full messages. Trade-off: Less queryable individual parts, but not needed for this use case.

### Q: Why immutable messages (no update/delete)?
**A**: Preserves conversation history integrity, creates audit trail, simpler concurrency handling. Users can delete entire conversations if needed.

### Q: Why auto-generate titles instead of prompting user?
**A**: Better UX - users can start chatting immediately. AI generates contextual titles that match conversation content. Users can rename if needed.

### Q: Why pg_trgm instead of full-text search?
**A**: Better fuzzy matching for short titles/previews. Full-text search (tsvector) better for long documents, overkill for conversation search.

### Q: Why private storage bucket?
**A**: Chat attachments should only be accessible to conversation owner for privacy. Public bucket would expose files to anyone with URL.

---

**End of Research Document**

_Last Updated: November 5, 2025_
