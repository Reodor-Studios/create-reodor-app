# AI Agent CRUD Tools with Confirmation Flow

## Overview

The chat agent has been enhanced with full CRUD (Create, Read, Update, Delete) capabilities for managing todos on behalf of the user. This system implements a sophisticated confirmation flow inspired by Claude Code's plan mode and auto-accept features, ensuring users maintain control over all data-modifying operations.

## Architecture

### Core Components

1. **CRUD Tools** (`lib/chat-agent/tools/todo-crud.ts`)
   - `listTodos`: Search and filter todos with advanced options
   - `getSingleTodo`: Get details about a specific todo
   - `createTodo`: Create new todos (requires confirmation)
   - `updateTodo`: Update existing todos (requires confirmation)
   - `deleteTodoTool`: Delete todos (requires confirmation)
   - `bulkUpdateTodos`: Batch update multiple todos (requires confirmation)

2. **Planning Tools** (`lib/chat-agent/tools/planning.ts`)
   - `createPlan`: Ask up to 4 clarifying questions for complex requests
   - `finalizePlan`: Convert planning phase into concrete action
   - `askClarification`: Simple single-question clarifications

3. **Agent Configuration** (`lib/chat-agent/index.ts`)
   - Updated system prompt with CRUD and planning instructions
   - Extended step count to 10 for multi-step operations
   - Comprehensive tool registration

4. **UI Components** (`components/chat/chat-message.tsx`)
   - Confirmation request cards (amber theme)
   - Planning request cards (purple theme)
   - Clarification request cards (blue theme)
   - Action buttons: Accept, Accept All, Keep Planning

5. **State Management** (`stores/agent-store.ts`)
   - Auto-accept mode persistence
   - Pending confirmation tracking
   - Conversation-specific state

## Confirmation Flow

### Standard Confirmation Flow

```
1. User requests action → "Create a todo for tomorrow"
2. Agent calls createTodo with needsConfirmation=true
3. Tool returns { requiresConfirmation: true, action: {...} }
4. UI detects tool result and renders confirmation card
5. User clicks "Accept" or "Accept All" or "Keep Planning"
6. Callback sends confirmation message to agent
7. Agent re-calls tool with needsConfirmation=false
8. Tool executes actual action and returns result
9. UI shows success/failure feedback
```

### Auto-Accept Mode

When enabled via "Accept All":
- Stored in Zustand with conversation ID
- Persisted across page refreshes
- Agent can detect via metadata in subsequent messages
- User can disable manually or it resets when switching conversations

## Tool Return Format

Tools requiring confirmation return:

```typescript
{
  requiresConfirmation: true,
  action: {
    type: "create_todo" | "update_todo" | "delete_todo",
    description: "User-friendly action description",
    details: {
      // Key-value pairs showing what will change
      title: "New Todo",
      priority: "high"
    },
    impact: "Description of the impact/consequences",
    data: {
      // The actual data payload to use when confirmed
      // Passed back to tool on re-execution
    }
  }
}
```

## Planning Mode

### When to Use

The agent uses planning mode when:
- Request is vague or ambiguous
- Action affects multiple items
- User's intent is unclear
- Multiple approaches are possible

### Planning Flow

```
1. User: "Clean up my old todos"
2. Agent calls createPlan with 4 questions:
   - "What timeframe do you consider 'old'?"
   - "Delete or mark complete?"
   - "Filter by priority?"
   - "Review first?"
3. UI renders planning card with questions
4. User answers in chat
5. Agent processes answers
6. Agent calls finalizePlan with concrete action
7. Flows into standard confirmation flow
```

### Planning Tool Return Format

```typescript
{
  requiresPlanning: true,
  plan: {
    summary: "Understanding your request",
    questions: [
      {
        question: "What do you consider 'old'?",
        rationale: "Need timeframe to filter",
        options: ["Older than 30 days", "Older than 90 days"]
      }
    ],
    suggestedAction?: {
      type: "bulk_update",
      description: "Mark old todos as complete",
      steps: ["Filter todos", "Update status", "Confirm results"]
    }
  }
}
```

## Clarification Requests

For simple, single-question clarifications:

```typescript
{
  requiresClarification: true,
  clarification: {
    question: "Which todo did you mean?",
    context: "I found 3 todos matching 'meeting'",
    suggestedAnswers: ["Morning standup", "Client meeting", "Team sync"]
  }
}
```

UI renders quick-select buttons for suggested answers.

## UI Detection Logic

In `chat-message.tsx`, tool results are inspected:

```typescript
const confirmationRequests = toolResultParts
  .filter((part) => part.output?.requiresConfirmation === true)
  .map((part) => ({
    toolCallId: part.toolCallId,
    action: part.output.action,
  }));
```

This pattern allows seamless integration with the Vercel AI SDK's standard tool result flow.

## Callback Handlers

### Confirmation Callback

```typescript
const handleConfirmation = async (
  confirmed: boolean,
  autoAccept?: boolean,
  confirmationData?: unknown
) => {
  if (confirmed && autoAccept) {
    enableAutoAccept(conversationId);
  }

  const responseText = confirmed
    ? "Yes, proceed with that action."
    : "No, let's keep planning.";

  await sendMessage({ text: responseText }, {
    body: { metadata: { confirmationData, autoAcceptEnabled: autoAccept } }
  });
};
```

### Planning Callback

```typescript
const handlePlanningResponse = async (
  answers: Record<number, string>,
  proceed: boolean
) => {
  const answersText = Object.entries(answers)
    .map(([index, answer]) => `${Number(index) + 1}. ${answer}`)
    .join("\n");

  const responseText = proceed
    ? `Here are my answers:\n${answersText}\n\nPlease proceed.`
    : `Here are my answers:\n${answersText}`;

  await sendMessage({ text: responseText });
};
```

## Security Considerations

1. **Server-Side Validation**
   - All server actions validate user ownership
   - RLS policies enforce data isolation
   - Zod schemas validate input data

2. **User Authorization**
   - Tools receive userId and verify ownership
   - No cross-user data access possible
   - Confirmation flow prevents accidental actions

3. **Data Integrity**
   - Optimistic UI updates invalidate query cache
   - Failed operations show clear error messages
   - Auto-accept mode is conversation-scoped

## Testing Strategy

### Manual Testing Checklist

- [ ] Create todo with confirmation
- [ ] Create todo with auto-accept
- [ ] Update todo fields
- [ ] Delete todo with confirmation
- [ ] Bulk update multiple todos
- [ ] Planning mode with 4 questions
- [ ] Clarification with suggested answers
- [ ] Auto-accept mode persistence
- [ ] Switching conversations resets auto-accept
- [ ] Error handling for failed operations

### Example Test Prompts

1. **Simple CRUD**: "Create a todo for tomorrow's meeting"
2. **Planning Required**: "Clean up all my old todos"
3. **Clarification Needed**: "Update the project todo" (when multiple exist)
4. **Bulk Operation**: "Mark all high priority todos as complete"
5. **Complex Flow**: "Organize my todos by priority and due date"

## Future Enhancements

1. **Undo/Redo**: Add ability to undo confirmed actions
2. **Dry Run**: Preview bulk operations before confirming
3. **Smart Defaults**: Learn user preferences for auto-accept
4. **Action History**: Log all agent actions for audit trail
5. **Multi-Step Workflows**: Chain multiple actions together
6. **Conditional Logic**: "If X then Y" style automations

## Troubleshooting

### Common Issues

**Confirmation not appearing**:
- Check tool result has `requiresConfirmation: true`
- Verify message.parts includes tool-result type
- Console log tool results to debug

**Auto-accept not working**:
- Check Zustand store state
- Verify conversationId matches
- Clear localStorage if needed

**Planning questions not rendering**:
- Ensure `requiresPlanning: true` in tool result
- Check questions array format
- Verify card component receives correct props

## Code References

- Tool implementations: `lib/chat-agent/tools/todo-crud.ts:lib/chat-agent/tools/todo-crud.ts`
- Planning tools: `lib/chat-agent/tools/planning.ts:lib/chat-agent/tools/planning.ts`
- Agent configuration: `lib/chat-agent/index.ts:18-127`
- UI components: `components/chat/chat-message.tsx:192-383`
- State management: `stores/agent-store.ts:1-67`
- Callback handlers: `components/chat/chat-page-content.tsx:142-218`
