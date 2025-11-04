import {
  BookOpenIcon,
  CodeIcon,
  CompassIcon,
  SparklesIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============================================================================
// Core Types
// ============================================================================

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  preview?: string;
}

export interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
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
// Mock Data
// ============================================================================

export const MOCK_CONVERSATIONS: Conversation[] = [
  // Today
  {
    id: "conv-1",
    userId: "user-1",
    title: "React Server Components explained",
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preview: "Can you explain how React Server Components work?",
  },
  {
    id: "conv-2",
    userId: "user-1",
    title: "Database schema design for chat",
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preview: "Help me design a database schema for a chat application",
  },
  {
    id: "conv-3",
    userId: "user-1",
    title: "TypeScript utility types",
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preview: "What are the most useful TypeScript utility types?",
  },

  // This week (2-6 days ago)
  {
    id: "conv-4",
    userId: "user-1",
    title: "Next.js App Router vs Pages Router",
    pinned: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "What are the key differences between App Router and Pages Router?",
  },
  {
    id: "conv-5",
    userId: "user-1",
    title: "Supabase RLS policies best practices",
    pinned: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "How do I write secure RLS policies in Supabase?",
  },
  {
    id: "conv-6",
    userId: "user-1",
    title: "TanStack Query mutation patterns",
    pinned: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "Show me common patterns for TanStack Query mutations",
  },
  {
    id: "conv-7",
    userId: "user-1",
    title: "Zod validation schemas",
    pinned: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "Help me create complex Zod validation schemas",
  },

  // This month (7-30 days ago)
  {
    id: "conv-8",
    userId: "user-1",
    title: "Tailwind CSS utility classes",
    pinned: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "What are some lesser-known Tailwind CSS utility classes?",
  },
  {
    id: "conv-9",
    userId: "user-1",
    title: "Vercel AI SDK streaming",
    pinned: false,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "How does streaming work with Vercel AI SDK?",
  },
  {
    id: "conv-10",
    userId: "user-1",
    title: "PostgreSQL performance tuning",
    pinned: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "What are the best practices for PostgreSQL performance?",
  },
  {
    id: "conv-11",
    userId: "user-1",
    title: "React Hook Form patterns",
    pinned: false,
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "Show me advanced React Hook Form patterns",
  },
  {
    id: "conv-12",
    userId: "user-1",
    title: "shadcn/ui component customization",
    pinned: false,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "How do I customize shadcn/ui components?",
  },

  // Older (>30 days)
  {
    id: "conv-13",
    userId: "user-1",
    title: "Microservices architecture patterns",
    pinned: false,
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "Explain microservices architecture patterns",
  },
  {
    id: "conv-14",
    userId: "user-1",
    title: "Docker container optimization",
    pinned: false,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "How can I optimize my Docker containers?",
  },
  {
    id: "conv-15",
    userId: "user-1",
    title: "Authentication best practices",
    pinned: false,
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "What are modern authentication best practices?",
  },
  {
    id: "conv-16",
    userId: "user-1",
    title: "API design principles",
    pinned: false,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "What are RESTful API design principles?",
  },
];

export const CATEGORIES: Category[] = [
  {
    id: "create",
    name: "Create",
    icon: SparklesIcon,
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
    icon: CompassIcon,
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
    icon: CodeIcon,
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
    icon: BookOpenIcon,
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
    const date = new Date(conv.updatedAt);
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
