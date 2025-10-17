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
