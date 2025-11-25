"use client";

import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { getTodoCollection, type Todo } from "@/lib/tanstack-db";

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  noPriority: number;
  overdue: number;
  dueToday: number;
  isLoading: boolean;
}

/**
 * Hook that provides live-updating todo statistics using TanStack DB.
 * Stats update instantly when todos are created, updated, or deleted.
 */
export function useTodoStats(userId: string): TodoStats {
  // Get singleton collection instance
  const todoCollection = getTodoCollection(userId);

  // Get all todos to compute stats client-side
  const { data: rawData = [], isLoading } = useLiveQuery(
    (q) => q.from({ todo: todoCollection }),
    [userId]
  );

  // Cast to typed todos array
  const allTodos = rawData as Todo[];

  // Compute stats from the todos array
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const total = allTodos.length;
    const completed = allTodos.filter((t) => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const highPriority = allTodos.filter((t) => t.priority === "high").length;
    const mediumPriority = allTodos.filter((t) => t.priority === "medium").length;
    const lowPriority = allTodos.filter((t) => t.priority === "low").length;
    const noPriority = allTodos.filter((t) => t.priority === null).length;

    const overdue = allTodos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      return new Date(t.due_date) < todayStart;
    }).length;

    const dueToday = allTodos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= todayStart && dueDate < todayEnd;
    }).length;

    return {
      total,
      completed,
      pending,
      completionRate,
      highPriority,
      mediumPriority,
      lowPriority,
      noPriority,
      overdue,
      dueToday,
      isLoading,
    };
  }, [allTodos, isLoading]);

  return stats;
}
