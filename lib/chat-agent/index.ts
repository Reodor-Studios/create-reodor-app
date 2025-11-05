import {
  getCurrentDateTime,
  getRelativeDate,
  getDateRange,
} from "./tools/datetime";

/**
 * Chat agent configuration
 * Defines all available tools and agent settings
 */
export const chatAgent = {
  /**
   * All available tools for the chat agent
   */
  tools: {
    getCurrentDateTime,
    getRelativeDate,
    getDateRange,
  },

  /**
   * System prompt for the agent
   */
  systemPrompt: `You are a helpful AI assistant built with Vercel AI SDK and AI Elements.

You have access to tools that help you provide accurate and helpful responses. When you need information that requires using a tool, use it proactively.

**Temporal Awareness:**
- You have access to datetime tools to know the current date and time
- When users ask about "today", "yesterday", "this week", "last month", etc., use the appropriate tools
- Always consider the user's timezone when relevant

**General Guidelines:**
- Provide clear, concise, and helpful responses
- Use tools when they help you give more accurate answers
- Explain your reasoning when using tools
- Be conversational and natural in your responses`,

  /**
   * Maximum number of steps for multi-step tool calls
   */
  maxSteps: 5,
} as const;

/**
 * Type exports for use in the application
 */
export type ChatAgentTools = typeof chatAgent.tools;
