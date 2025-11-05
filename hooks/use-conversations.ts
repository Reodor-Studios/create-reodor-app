"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  deleteAllConversations,
  type ConversationFilters,
} from "@/server/conversation.actions";
import { toast } from "sonner";

// ============================================================================
// Query Keys
// ============================================================================

export const conversationKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationKeys.all, "list"] as const,
  list: (userId: string, filters?: ConversationFilters) =>
    [...conversationKeys.lists(), userId, filters] as const,
  details: () => [...conversationKeys.all, "detail"] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch all conversations for a user with optional filters
 */
export function useConversations({
  userId,
  filters,
}: {
  userId: string;
  filters?: ConversationFilters;
}) {
  return useQuery({
    queryKey: conversationKeys.list(userId, filters),
    queryFn: async () => {
      const result = await getConversations(userId, filters);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    enabled: !!userId,
  });
}

/**
 * Fetch a single conversation with messages
 */
export function useConversation({ conversationId }: { conversationId?: string }) {
  return useQuery({
    queryKey: conversationKeys.detail(conversationId || ""),
    queryFn: async () => {
      if (!conversationId) throw new Error("No conversation ID");
      const result = await getConversation(conversationId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!conversationId,
  });
}

/**
 * Create a new conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConversation,
    onSuccess: (result) => {
      if (result.error) {
        toast.error("Failed to create conversation");
        return;
      }

      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });

      toast.success("Conversation created");
    },
    onError: () => {
      toast.error("Failed to create conversation");
    },
  });
}

/**
 * Update a conversation
 */
export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: Parameters<typeof updateConversation>[0] extends string
      ? { id: string; data: Parameters<typeof updateConversation>[1] }
      : never) => updateConversation(id, data),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error("Failed to update conversation");
        return;
      }

      // Invalidate specific conversation
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(variables.id),
      });

      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });

      toast.success("Conversation updated");
    },
    onError: () => {
      toast.error("Failed to update conversation");
    },
  });
}

/**
 * Delete a conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: (result, conversationId) => {
      if (result.error) {
        toast.error("Failed to delete conversation");
        return;
      }

      // Remove from cache
      queryClient.removeQueries({
        queryKey: conversationKeys.detail(conversationId),
      });

      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });

      toast.success("Conversation deleted");
    },
    onError: () => {
      toast.error("Failed to delete conversation");
    },
  });
}

/**
 * Delete all conversations for a user
 */
export function useDeleteAllConversations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllConversations,
    onSuccess: (result) => {
      if (result.error) {
        toast.error("Failed to delete all conversations");
        return;
      }

      // Clear all conversation caches
      queryClient.removeQueries({
        queryKey: conversationKeys.all,
      });

      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });

      const deletedCount = result.data?.deletedCount || 0;
      toast.success(
        `${deletedCount} conversation${deletedCount !== 1 ? "s" : ""} deleted`,
      );
    },
    onError: () => {
      toast.error("Failed to delete all conversations");
    },
  });
}
