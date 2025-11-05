import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Type aliases extracted from the Database type for better readability
 * These are automatically generated from the SQL function signature!
 */
type GetUserTodoStatsReturn =
  Database["public"]["Functions"]["get_user_todo_stats"]["Returns"];

// The return type is an array with a single row, so we extract the element type
export type UserTodoStats = GetUserTodoStatsReturn[number];

/**
 * Type aliases for full text search functions
 */
type SearchConversationsReturn =
  Database["public"]["Functions"]["search_conversations"]["Returns"];
export type ConversationSearchResult = SearchConversationsReturn[number];

type SearchMessagesInConversationReturn =
  Database["public"]["Functions"]["search_messages_in_conversation"]["Returns"];
export type MessageSearchResult = SearchMessagesInConversationReturn[number];

type SearchConversationsByMessagesReturn =
  Database["public"]["Functions"]["search_conversations_by_messages"]["Returns"];
export type ConversationWithMessageMatchResult =
  SearchConversationsByMessagesReturn[number];

/**
 * Get comprehensive statistics about a user's todos
 *
 * This demo function showcases full type safety from database to TypeScript:
 * - The Args and Returns types are automatically inferred from the SQL function
 * - No manual type definitions needed!
 * - TypeScript will warn you if you pass wrong arguments or misuse the return type
 *
 * @param supabase - The Supabase client instance
 * @param userId - The UUID of the user to get statistics for
 * @returns Statistics about the user's todos including counts by status and priority
 *
 * @example
 * ```ts
 * const supabase = createClient();
 * const { data, error } = await getUserTodoStats(supabase, user.id);
 *
 * if (error) {
 *   console.error("Error fetching stats:", error);
 *   return;
 * }
 *
 * // All fields are fully typed!
 * console.log(`Completion rate: ${data.completion_rate}%`);
 * console.log(`High priority todos: ${data.high_priority_todos}`);
 * console.log(`Overdue todos: ${data.overdue_todos}`);
 * ```
 */
export async function getUserTodoStats(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase.rpc("get_user_todo_stats", {
    user_uuid: userId,
  });

  if (error) {
    console.error("Error fetching user todo stats:", error);
    return { data: null, error: error.message };
  }

  // The RPC returns an array with one row, extract it
  // TypeScript knows the exact structure of data[0]!
  return { data: data[0] || null, error: null };
}

/**
 * Search conversations using full text search with ranking
 *
 * Searches both conversation titles and previews with weighted ranking.
 * Titles have higher priority (weight A) than previews (weight B).
 * Supports web search syntax: quotes for phrases, OR for alternatives, - for exclusion.
 *
 * @param supabase - The Supabase client instance
 * @param userId - The UUID of the user whose conversations to search
 * @param searchText - The search query (e.g., "AI chat", "react OR vue", '"exact phrase"')
 * @returns Array of conversations matching the search query, ranked by relevance
 *
 * @example
 * ```ts
 * const supabase = createClient();
 * const { data, error } = await searchConversations(supabase, user.id, "AI chat");
 *
 * if (data) {
 *   data.forEach(conv => {
 *     console.log(`${conv.title} (rank: ${conv.rank})`);
 *   });
 * }
 * ```
 */
export async function searchConversations(
  supabase: SupabaseClient<Database>,
  userId: string,
  searchText: string,
) {
  const { data, error } = await supabase.rpc("search_conversations", {
    user_uuid: userId,
    search_text: searchText,
  });

  if (error) {
    console.error("Error searching conversations:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Search messages within a specific conversation
 *
 * Searches through all messages in a conversation to find matches.
 * Useful for finding specific content within a long conversation.
 *
 * @param supabase - The Supabase client instance
 * @param conversationId - The UUID of the conversation to search within
 * @param searchText - The search query
 * @returns Array of messages matching the search query, ranked by relevance
 *
 * @example
 * ```ts
 * const { data, error } = await searchMessagesInConversation(
 *   supabase,
 *   conversationId,
 *   "database schema"
 * );
 * ```
 */
export async function searchMessagesInConversation(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  searchText: string,
) {
  const { data, error } = await supabase.rpc("search_messages_in_conversation", {
    conversation_uuid: conversationId,
    search_text: searchText,
  });

  if (error) {
    console.error("Error searching messages:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Search conversations by their message content
 *
 * Finds conversations that contain messages matching the search query.
 * Returns the conversation along with match count and ranking.
 * Useful for finding conversations about a specific topic.
 *
 * @param supabase - The Supabase client instance
 * @param userId - The UUID of the user
 * @param searchText - The search query
 * @returns Array of conversations containing matching messages
 *
 * @example
 * ```ts
 * const { data, error } = await searchConversationsByMessages(
 *   supabase,
 *   user.id,
 *   "React components"
 * );
 *
 * if (data) {
 *   data.forEach(conv => {
 *     console.log(`${conv.title}: ${conv.matching_message_count} matches`);
 *   });
 * }
 * ```
 */
export async function searchConversationsByMessages(
  supabase: SupabaseClient<Database>,
  userId: string,
  searchText: string,
) {
  const { data, error } = await supabase.rpc(
    "search_conversations_by_messages",
    {
      user_uuid: userId,
      search_text: searchText,
    },
  );

  if (error) {
    console.error("Error searching conversations by messages:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
