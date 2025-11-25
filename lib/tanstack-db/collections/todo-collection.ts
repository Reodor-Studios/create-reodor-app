"use client";

import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "@/lib/tanstack";
import { getAllTodos } from "@/server/todo.actions";
import type { DatabaseTables } from "@/types";

export type Todo = DatabaseTables["todos"]["Row"];

/**
 * Creates a todo collection for a specific user.
 */
function createUserTodoCollection(userId: string) {
  const options = queryCollectionOptions({
    queryKey: ["todos-collection", userId],
    queryFn: async () => {
      const result = await getAllTodos(userId);
      if (result.error || !result.data) {
        return [];
      }
      return result.data;
    },
    queryClient,
    getKey: (item: Todo) => item.id,
    staleTime: 0,
  });

  return createCollection(options);
}

/** Inferred type for the todo collection */
export type TodoCollection = ReturnType<typeof createUserTodoCollection>;

/**
 * Singleton cache for todo collections per user.
 * This ensures the same collection instance is used across all components,
 * which is critical for TanStack DB's live query reactivity to work correctly.
 */
const todoCollectionCache = new Map<string, TodoCollection>();

/**
 * Gets or creates a user-scoped todo collection for TanStack DB.
 * Uses singleton pattern to ensure all components share the same collection instance.
 * This enables proper live query updates when todos are modified.
 */
export function getTodoCollection(userId: string): TodoCollection {
  const existing = todoCollectionCache.get(userId);
  if (existing) {
    return existing;
  }

  const collection = createUserTodoCollection(userId);
  todoCollectionCache.set(userId, collection);
  return collection;
}

