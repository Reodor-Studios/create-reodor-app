import {
  Experimental_Agent as Agent,
  Experimental_InferAgentUIMessage as InferAgentUIMessage,
  stepCountIs,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  getCurrentDateTime,
  getRelativeDate,
  getDateRange,
} from "./tools/datetime";
import { planApproach, evaluateResponse } from "./tools/meta-cognitive";

/**
 * Chat agent using the Vercel AI SDK Agent class
 * Handles multi-step tool execution with automatic loop control
 */
export const chatAgent = new Agent({
  /**
   * Model configuration
   */
  model: anthropic("claude-sonnet-4-5-20250929"),

  /**
   * System prompt for the agent
   */
  system: `You are a helpful AI assistant built with Vercel AI SDK and AI Elements.

You have access to tools that help you provide accurate and helpful responses. When you need information that requires using a tool, use it proactively.

**Meta-Cognitive Tools:**
- Use the 'planApproach' tool when you receive a complex query to organize your thinking and determine which tools to use
- Use the 'evaluateResponse' tool after providing an answer to ensure you've adequately addressed the user's needs
- These tools help you provide higher quality, more thoughtful responses

**Temporal Awareness:**
- You have access to datetime tools to know the current date and time
- When users ask about "today", "yesterday", "this week", "last month", etc., use the appropriate tools
- Always consider the user's timezone when relevant

**General Guidelines:**
- Provide clear, concise, and helpful responses
- Use tools when they help you give more accurate answers
- Explain your reasoning when using tools
- Be conversational and natural in your responses
- For complex queries, plan first, then execute, then evaluate`,

  /**
   * All available tools for the chat agent
   */
  tools: {
    getCurrentDateTime,
    getRelativeDate,
    getDateRange,
    planApproach,
    evaluateResponse,
  },

  /**
   * Stop condition - allow up to 5 steps for multi-step tool calls
   */
  stopWhen: stepCountIs(5),
});

/**
 * Type exports for use in the application
 */
export type ChatAgentUIMessage = InferAgentUIMessage<typeof chatAgent>;
