/**
 * Extended message part types for agent interactions
 * These extend the standard UIMessage types from Vercel AI SDK
 */

/**
 * Confirmation request for actions that need user approval
 */
export interface ConfirmationRequestPart {
  type: "confirmation-request";
  action: {
    type: "create_todo" | "update_todo" | "delete_todo" | "list_todos";
    description: string;
    details: Record<string, unknown>;
    impact: string;
    data?: unknown; // The actual data to be used when confirmed
  };
}

/**
 * Confirmation response from the user
 */
export interface ConfirmationResponsePart {
  type: "confirmation-response";
  confirmed: boolean;
  autoAccept?: boolean; // Enable auto-accept mode for subsequent actions
}

/**
 * Planning request with follow-up questions
 */
export interface PlanningRequestPart {
  type: "planning-request";
  plan: {
    summary: string;
    questions: Array<{
      question: string;
      rationale: string;
      options?: string[];
    }>;
    suggestedAction?: {
      type: string;
      description: string;
      steps: string[];
    };
  };
}

/**
 * Planning response from the user
 */
export interface PlanningResponsePart {
  type: "planning-response";
  answers: Record<number, string>; // Question index -> answer
  proceedWithAction?: boolean; // If true, execute the suggested action
}

/**
 * Clarification request for simple questions
 */
export interface ClarificationRequestPart {
  type: "clarification-request";
  clarification: {
    question: string;
    context: string;
    suggestedAnswers?: string[];
  };
}

/**
 * Clarification response from the user
 */
export interface ClarificationResponsePart {
  type: "clarification-response";
  answer: string;
}

/**
 * Extended message parts that can appear in UIMessage
 */
export type ExtendedMessagePart =
  | ConfirmationRequestPart
  | ConfirmationResponsePart
  | PlanningRequestPart
  | PlanningResponsePart
  | ClarificationRequestPart
  | ClarificationResponsePart;

/**
 * Auto-accept mode state
 * Tracks whether the user has enabled auto-accept for all confirmations
 */
export interface AutoAcceptState {
  enabled: boolean;
  conversationId: string;
}

/**
 * Metadata that can be attached to messages for tracking state
 */
export interface AgentMessageMetadata {
  autoAcceptEnabled?: boolean;
  pendingConfirmation?: boolean;
  confirmationData?: unknown;
  planningPhase?: boolean;
}
