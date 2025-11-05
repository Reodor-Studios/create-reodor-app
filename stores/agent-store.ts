import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Agent state for managing confirmation and planning modes
 */
interface AgentState {
  // Auto-accept mode: when enabled, automatically approve all confirmations
  autoAcceptEnabled: boolean;
  conversationId: string | null;

  // Pending confirmation data
  pendingConfirmation: {
    messageId: string;
    action: {
      type: string;
      description: string;
      details: Record<string, unknown>;
      impact: string;
      data?: unknown;
    };
  } | null;

  // Actions
  enableAutoAccept: (conversationId: string) => void;
  disableAutoAccept: () => void;
  setPendingConfirmation: (
    messageId: string,
    action: AgentState["pendingConfirmation"]
  ) => void;
  clearPendingConfirmation: () => void;
  reset: () => void;
}

/**
 * Agent store for managing confirmation flow and auto-accept mode
 *
 * This store handles:
 * - Auto-accept mode: bypass confirmations for all subsequent actions
 * - Pending confirmations: track actions waiting for user approval
 * - Conversation-specific state: reset when switching conversations
 */
export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      autoAcceptEnabled: false,
      conversationId: null,
      pendingConfirmation: null,

      enableAutoAccept: (conversationId: string) =>
        set({
          autoAcceptEnabled: true,
          conversationId,
        }),

      disableAutoAccept: () =>
        set({
          autoAcceptEnabled: false,
        }),

      setPendingConfirmation: (messageId, action) =>
        set({
          pendingConfirmation: action
            ? {
                messageId,
                action: action.action,
              }
            : null,
        }),

      clearPendingConfirmation: () =>
        set({
          pendingConfirmation: null,
        }),

      reset: () =>
        set({
          autoAcceptEnabled: false,
          conversationId: null,
          pendingConfirmation: null,
        }),
    }),
    {
      name: "agent-storage",
      // Only persist auto-accept state, not pending confirmations
      partialize: (state) => ({
        autoAcceptEnabled: state.autoAcceptEnabled,
        conversationId: state.conversationId,
      }),
    }
  )
);
