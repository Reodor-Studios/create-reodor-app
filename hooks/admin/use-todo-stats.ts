"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAllUsersTodoStats,
  getUserTodoStatsById,
} from "@/server/admin/todo-stats.actions";

const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false,
};

/**
 * Hook to fetch aggregated todo statistics for all users
 * Used in the admin overview tab
 */
export function useAllUsersTodoStats() {
  return useQuery({
    queryKey: ["admin", "all-users-todo-stats"],
    queryFn: () => getAllUsersTodoStats(),
    ...defaultQueryOptions,
  });
}

/**
 * Hook to fetch todo statistics for a specific user
 * Used when viewing detailed user statistics
 */
export function useUserTodoStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "user-todo-stats", userId],
    queryFn: () => getUserTodoStatsById(userId!),
    ...defaultQueryOptions,
    enabled: !!userId,
  });
}
