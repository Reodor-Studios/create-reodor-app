import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { Compass } from "@/components/animate-ui/icons/compass";
import { Terminal } from "@/components/animate-ui/icons/terminal";
import { Lightbulb } from "@/components/animate-ui/icons/lightbulb";
import type { ComponentType } from "react";
import type { DatabaseTables } from "@/types";

// ============================================================================
// Core Types
// ============================================================================

// Use real database types instead of custom interfaces
// Omit FTS columns as they're internal implementation details
export type Conversation = Omit<
  DatabaseTables["conversations"]["Row"],
  "fts_weighted"
>;
export type Message = Omit<DatabaseTables["messages"]["Row"], "fts">;

export interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}

export interface Category {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string; animateOnHover?: boolean }>;
  description: string;
  questions: string[];
}

export interface Model {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "deepseek" | "google";
  supportsReasoning: boolean;
  supportsVision: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const CATEGORIES: Category[] = [
  {
    id: "create",
    name: "Create",
    icon: Sparkles,
    description: "Generate content, code, and creative ideas",
    questions: [
      "Write a blog post about sustainable technology",
      "Create a React component for a kanban board",
      "Generate realistic test data for user profiles",
      "Design a PostgreSQL schema for an e-commerce platform",
    ],
  },
  {
    id: "explore",
    name: "Explore",
    icon: Compass,
    description: "Research, analyze, and learn new concepts",
    questions: [
      "Explain how quantum computing works",
      "Compare React Server Components vs traditional SSR",
      "Research the history of functional programming",
      "Analyze the pros and cons of microservices architecture",
    ],
  },
  {
    id: "code",
    name: "Code",
    icon: Terminal,
    description: "Debug, refactor, and optimize your code",
    questions: [
      "Debug this TypeScript type error",
      "Refactor this function to be more efficient",
      "Explain this algorithm's time complexity",
      "Write comprehensive unit tests for this module",
    ],
  },
  {
    id: "learn",
    name: "Learn",
    icon: Lightbulb,
    description: "Educational content and step-by-step guides",
    questions: [
      "Teach me about machine learning fundamentals",
      "How does OAuth 2.0 authentication work?",
      "What is the difference between TCP and UDP?",
      "Explain design patterns with real-world examples",
    ],
  },
];

export const MODELS: Model[] = [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    supportsReasoning: false,
    supportsVision: true,
  },
  {
    id: "anthropic/claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    supportsReasoning: false,
    supportsVision: true,
  },
  {
    id: "deepseek/deepseek-r1",
    name: "Deepseek R1",
    provider: "deepseek",
    supportsReasoning: true,
    supportsVision: false,
  },
  {
    id: "google/gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    provider: "google",
    supportsReasoning: false,
    supportsVision: true,
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Group conversations by recency
 */
export function groupConversationsByRecency(
  conversations: Conversation[],
): ConversationGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // First, separate pinned conversations
  const pinned = conversations.filter((c) => c.pinned);
  const unpinned = conversations.filter((c) => !c.pinned);

  // Group unpinned by recency
  const todayConvos: Conversation[] = [];
  const weekConvos: Conversation[] = [];
  const monthConvos: Conversation[] = [];
  const olderConvos: Conversation[] = [];

  unpinned.forEach((conv) => {
    const date = new Date(conv.updated_at);
    if (date >= today) {
      todayConvos.push(conv);
    } else if (date >= weekAgo) {
      weekConvos.push(conv);
    } else if (date >= monthAgo) {
      monthConvos.push(conv);
    } else {
      olderConvos.push(conv);
    }
  });

  // Build groups array
  const groups: ConversationGroup[] = [];

  if (pinned.length > 0) {
    groups.push({ label: "Pinned", conversations: pinned });
  }

  if (todayConvos.length > 0) {
    groups.push({ label: "Today", conversations: todayConvos });
  }

  if (weekConvos.length > 0) {
    groups.push({ label: "This Week", conversations: weekConvos });
  }

  if (monthConvos.length > 0) {
    groups.push({ label: "This Month", conversations: monthConvos });
  }

  if (olderConvos.length > 0) {
    groups.push({ label: "Older", conversations: olderConvos });
  }

  return groups;
}

/**
 * Format relative time for conversation timestamps
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

/**
 * Search conversations by title or preview
 */
export function searchConversations(
  conversations: Conversation[],
  query: string,
): Conversation[] {
  if (!query.trim()) return conversations;

  const lowerQuery = query.toLowerCase();
  return conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(lowerQuery) ||
      conv.preview?.toLowerCase().includes(lowerQuery),
  );
}
