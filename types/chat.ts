import type { UIMessage } from "ai";

/**
 * Chat API request body payload
 * This type ensures type safety between the frontend (chat-page-content.tsx)
 * and the backend (app/api/chat/route.ts)
 */
export type ChatRequestBody = {
  /** Array of messages in the conversation (required) */
  messages: UIMessage[];
  /** Whether web search is enabled for this request (optional) */
  webSearch?: boolean;
  /** ID of the conversation to save messages to (optional, but required for persistence) */
  conversationId?: string;
  /** Confirmation data from user approving an action (optional) */
  confirmationData?: unknown;
  /** Whether auto-accept mode is enabled for this conversation (optional) */
  autoAcceptEnabled?: boolean;
};

/**
 * Validation result for chat request body
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; field?: string };

/**
 * Validates that the chat request body has the required structure
 * @param body - The request body to validate
 * @returns Validation result with typed data or error message
 */
export function validateChatRequestBody(
  body: unknown,
): ValidationResult<ChatRequestBody> {
  // Check if body is an object
  if (!body || typeof body !== "object") {
    return {
      success: false,
      error: "Request body must be an object",
    };
  }

  const bodyObj = body as Record<string, unknown>;

  // Required field: messages
  if (!bodyObj.messages) {
    return {
      success: false,
      error: "Missing required field: messages",
      field: "messages",
    };
  }

  if (!Array.isArray(bodyObj.messages)) {
    return {
      success: false,
      error: "Field 'messages' must be an array",
      field: "messages",
    };
  }

  // Validate message structure (basic check)
  for (let i = 0; i < bodyObj.messages.length; i++) {
    const msg = bodyObj.messages[i];
    if (!msg || typeof msg !== "object") {
      return {
        success: false,
        error: `Invalid message at index ${i}: must be an object`,
        field: `messages[${i}]`,
      };
    }

    const message = msg as Record<string, unknown>;
    if (!message.role || typeof message.role !== "string") {
      return {
        success: false,
        error: `Invalid message at index ${i}: missing or invalid 'role' field`,
        field: `messages[${i}].role`,
      };
    }

    if (
      !["user", "assistant", "system"].includes(message.role as string)
    ) {
      return {
        success: false,
        error:
          `Invalid message at index ${i}: role must be 'user', 'assistant', or 'system'`,
        field: `messages[${i}].role`,
      };
    }

    if (!message.parts || !Array.isArray(message.parts)) {
      return {
        success: false,
        error: `Invalid message at index ${i}: missing or invalid 'parts' field`,
        field: `messages[${i}].parts`,
      };
    }
  }

  // Optional fields validation
  if (bodyObj.webSearch !== undefined && typeof bodyObj.webSearch !== "boolean") {
    return {
      success: false,
      error: "Field 'webSearch' must be a boolean",
      field: "webSearch",
    };
  }

  if (
    bodyObj.conversationId !== undefined &&
    typeof bodyObj.conversationId !== "string"
  ) {
    return {
      success: false,
      error: "Field 'conversationId' must be a string",
      field: "conversationId",
    };
  }

  if (
    bodyObj.autoAcceptEnabled !== undefined &&
    typeof bodyObj.autoAcceptEnabled !== "boolean"
  ) {
    return {
      success: false,
      error: "Field 'autoAcceptEnabled' must be a boolean",
      field: "autoAcceptEnabled",
    };
  }

  // confirmationData can be any type, so no validation needed

  // Return validated body
  return {
    success: true,
    data: {
      messages: bodyObj.messages as UIMessage[],
      webSearch: bodyObj.webSearch as boolean | undefined,
      conversationId: bodyObj.conversationId as string | undefined,
      confirmationData: bodyObj.confirmationData,
      autoAcceptEnabled: bodyObj.autoAcceptEnabled as boolean | undefined,
    },
  };
}

/**
 * Type guard to check if body is a valid ChatRequestBody
 * Useful for runtime type checking
 */
export function isChatRequestBody(body: unknown): body is ChatRequestBody {
  const result = validateChatRequestBody(body);
  return result.success;
}
