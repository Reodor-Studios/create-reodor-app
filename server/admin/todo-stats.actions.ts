"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getUserTodoStats } from "@/lib/supabase/rpc";

/**
 * Get aggregated todo statistics across all users
 * Uses the service client to bypass RLS and get stats for all users
 */
export async function getAllUsersTodoStats() {
  const supabase = createServiceClient();

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .order("created_at", { ascending: false });

    if (usersError) throw usersError;

    // Get todo stats for each user using the RPC function
    const userStatsPromises = (users || []).map(async (user) => {
      const { data: stats } = await getUserTodoStats(supabase, user.id);
      return {
        user_id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        stats: stats || {
          user_id: user.id,
          total_todos: 0,
          completed_todos: 0,
          pending_todos: 0,
          overdue_todos: 0,
          high_priority_todos: 0,
          medium_priority_todos: 0,
          low_priority_todos: 0,
          no_priority_todos: 0,
          completion_rate: 0,
        },
      };
    });

    const userStats = await Promise.all(userStatsPromises);

    // Aggregate platform-wide statistics
    const platformStats = userStats.reduce(
      (acc, user) => ({
        total_todos: acc.total_todos + Number(user.stats.total_todos),
        completed_todos:
          acc.completed_todos + Number(user.stats.completed_todos),
        pending_todos: acc.pending_todos + Number(user.stats.pending_todos),
        overdue_todos: acc.overdue_todos + Number(user.stats.overdue_todos),
        high_priority_todos:
          acc.high_priority_todos + Number(user.stats.high_priority_todos),
        medium_priority_todos:
          acc.medium_priority_todos + Number(user.stats.medium_priority_todos),
        low_priority_todos:
          acc.low_priority_todos + Number(user.stats.low_priority_todos),
        no_priority_todos:
          acc.no_priority_todos + Number(user.stats.no_priority_todos),
      }),
      {
        total_todos: 0,
        completed_todos: 0,
        pending_todos: 0,
        overdue_todos: 0,
        high_priority_todos: 0,
        medium_priority_todos: 0,
        low_priority_todos: 0,
        no_priority_todos: 0,
      },
    );

    // Calculate platform completion rate
    const platformCompletionRate =
      platformStats.total_todos > 0
        ? Number(
            (
              (platformStats.completed_todos / platformStats.total_todos) *
              100
            ).toFixed(2),
          )
        : 0;

    // Get top users by todo count
    const topUsers = [...userStats]
      .sort((a, b) => Number(b.stats.total_todos) - Number(a.stats.total_todos))
      .slice(0, 5)
      .map((user) => ({
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        total_todos: Number(user.stats.total_todos),
        completed_todos: Number(user.stats.completed_todos),
        completion_rate: Number(user.stats.completion_rate),
      }));

    return {
      platformStats: {
        ...platformStats,
        completion_rate: platformCompletionRate,
      },
      topUsers,
      totalUsers: users?.length || 0,
      usersWithTodos: userStats.filter(
        (u) => Number(u.stats.total_todos) > 0,
      ).length,
    };
  } catch (error) {
    console.error("Error fetching all users todo stats:", error);
    throw error;
  }
}

/**
 * Get detailed todo statistics for a specific user
 * Uses the service client to bypass RLS
 */
export async function getUserTodoStatsById(userId: string) {
  const supabase = createServiceClient();

  try {
    const { data: stats, error } = await getUserTodoStats(supabase, userId);

    if (error) throw new Error(error);

    return stats;
  } catch (error) {
    console.error("Error fetching user todo stats:", error);
    throw error;
  }
}
