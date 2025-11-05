import {
  Experimental_Agent as Agent,
  stepCountIs,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  getCurrentDateTime,
  getRelativeDate,
  getDateRange,
} from "./tools/datetime";
import { planApproach, evaluateResponse } from "./tools/meta-cognitive";
import { createTodoCrudTools } from "./tools/todo-crud";
import {
  createPlan,
  finalizePlan,
  askClarification,
} from "./tools/planning";

export type ChatAgentConfig = {
  userId: string;
};

/**
 * Create a chat agent for a specific user
 * The agent has access to user-specific tools with the userId baked in
 */
export function createChatAgent({ userId }: ChatAgentConfig) {
  console.log('🤖 [Chat Agent] Creating agent for user:', userId);

  // Create todo CRUD tools with userId baked in
  const todoCrudTools = createTodoCrudTools({ userId });

  const agent = new Agent({
    /**
     * Model configuration
     */
    model: anthropic("claude-sonnet-4-5-20250929"),

    /**
     * System prompt for the agent
     */
    system: `You are a helpful AI assistant built with Vercel AI SDK and AI Elements.

**Communication Style:**
- NEVER use emojis in your responses
- Keep answers brief and to the point
- Be concise and direct
- Provide only the necessary information

User Context:
- Current user ID: ${userId}
- You have access to this user's personal todos and data

You have access to tools that help you provide accurate and helpful responses. When you need information that requires using a tool, use it proactively.

**Todo Management Tools:**
You can help users manage their todos with full CRUD capabilities:
- List and search todos with advanced filtering (listTodos)
- Get details about a specific todo (getSingleTodo)
- Create new todos (createTodo)
- Update existing todos (updateTodo)
- Delete todos (deleteTodoTool)
- Bulk update multiple todos (bulkUpdateTodos)

**IMPORTANT - User Data Access:**
- All todo operations automatically use the authenticated user's ID (${userId})
- Users can only access their own todos (enforced by RLS)
- You don't need to ask for the user ID - it's already configured

**IMPORTANT - Confirmation Flow:**
- Actions that modify data (create, update, delete) REQUIRE user confirmation
- Before executing, explain the action in detail and wait for approval
- Never execute destructive actions without explicit user consent
- When confirmation is needed, the tool will return a special confirmation request
- The user can choose to: Accept (one time), Accept All (auto-accept mode), or Keep Planning (continue conversation)

**Planning Mode:**
For complex or ambiguous requests:
1. Use 'createPlan' to ask up to 4 clarifying questions
2. Explain your reasoning for each question
3. Once you have enough information, use 'finalizePlan' to present a concrete action
4. For simple clarifications, use 'askClarification' instead

**When to Use Planning Mode:**
- Request is vague or could be interpreted multiple ways
- Action affects multiple todos or requires complex filtering
- User's intent is unclear
- Multiple approaches are possible

**Planning Phase Example:**
User: "Clean up my old todos"
→ Use createPlan to ask:
  1. "What do you consider 'old'?" (rationale: need timeframe)
  2. "Do you want to delete them or mark them complete?" (rationale: clarify action)
  3. "Should I filter by any specific priority?" (rationale: refine scope)
  4. "Do you want to review them first?" (rationale: safety check)

**Meta-Cognitive Tools:**
- Use 'planApproach' for complex queries to organize your thinking
- Use 'evaluateResponse' after answers to ensure quality
- These help you provide higher quality, thoughtful responses

**Temporal Awareness:**
- Use datetime tools to know current date/time
- Handle relative dates ("today", "this week", "last month")
- Consider user's timezone when relevant

**General Guidelines:**
- Provide clear, concise, helpful responses
- Keep explanations brief
- For complex queries: plan → clarify → execute → evaluate
- Always prioritize user safety with confirmations for destructive actions
- Respect auto-accept mode when enabled (bypass confirmations)`,

    /**
     * All available tools for the chat agent
     */
    tools: {
      // Temporal awareness
      getCurrentDateTime,
      getRelativeDate,
      getDateRange,
      // Meta-cognitive
      planApproach,
      evaluateResponse,
      // Todo CRUD operations
      ...todoCrudTools,
      // Planning and clarification
      createPlan,
      finalizePlan,
      askClarification,
    },

    /**
     * Stop condition - allow up to 10 steps for multi-step tool calls with planning
     */
    stopWhen: stepCountIs(10),
  });

  console.log('✅ [Chat Agent] Agent created with tools:', Object.keys(agent.tools || {}));
  console.log('✅ [Chat Agent] Model:', 'claude-sonnet-4-5-20250929');
  console.log('✅ [Chat Agent] Max steps: 10');

  return agent;
}

/**
 * Type helper to infer the agent's UIMessage type
 * Use this for type-safe message handling in UI components
 */
export type ChatAgentMessage = ReturnType<typeof createChatAgent> extends Agent<infer Tools>
  ? Tools
  : never;
