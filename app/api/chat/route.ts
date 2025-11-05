import { convertToModelMessages, type UIMessage } from "ai";
import {
  generateConversationTitle,
  saveMessages,
} from "@/server/conversation.actions";
import { createChatAgent } from "@/lib/chat-agent";
import { createClient } from "@/lib/supabase/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to use the chat",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const { messages, webSearch, conversationId } = body as {
      messages: UIMessage[];
      webSearch?: boolean;
      conversationId?: string;
    };

    console.log("[Chat API] Received request:", {
      userId: user.id,
      messageCount: messages.length,
      conversationId,
      webSearch,
      lastMessage: messages[messages.length - 1],
    });

    // Create agent for this specific user
    const chatAgent = createChatAgent({ userId: user.id });

    // Use the agent's stream method to get the streaming response
    const result = await chatAgent.stream({
      messages: convertToModelMessages(messages),
    });

    console.log("[Chat API] Agent stream initialized");

    // Return streaming response with onFinish callback for message persistence
    return result.toUIMessageStreamResponse({
      async onFinish({ responseMessage }) {
        console.log("[Chat API] onFinish called", {
          responseParts: responseMessage.parts.length,
          partsTypes: responseMessage.parts.map((p: any) => p.type),
        });

        const text = responseMessage.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => ("text" in p ? p.text : ""))
          .join("");

        console.log("[Chat API] Extracted text length:", text.length);

        // Only save if we have a conversationId
        if (!conversationId) {
          console.warn("[Chat API] No conversationId provided, messages not saved");
          return;
        }

        console.log("[Chat API] Saving messages to conversation:", conversationId);

        // Combine user message(s) with assistant response
        const messagesToSave: UIMessage[] = [];

        // Get the last user message (the one that triggered this response)
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage && lastUserMessage.role === "user") {
          messagesToSave.push(lastUserMessage);
        }

        // Add the assistant's response
        messagesToSave.push({
          id: crypto.randomUUID(),
          role: "assistant",
          parts: [{ type: "text", text: text }],
          metadata: {},
        });

        console.log("[Chat API] Messages to save:", {
          count: messagesToSave.length,
          messages: messagesToSave.map((m) => ({
            role: m.role,
            partsCount: m.parts.length,
          })),
        });

        // Save messages to database
        const saveResult = await saveMessages(conversationId, messagesToSave);
        if (saveResult.error) {
          console.error("[Chat API] Failed to save messages:", saveResult.error);
          return;
        }

        console.log("[Chat API] Messages saved successfully");

        // Generate title if this is the first message (only user message)
        if (
          messages.length === 1 &&
          lastUserMessage &&
          lastUserMessage.role === "user"
        ) {
          console.log("[Chat API] Generating title for first message");

          const firstUserMessageText = lastUserMessage.parts
            .filter((p) => p.type === "text")
            .map((p) => ("text" in p ? p.text : ""))
            .join(" ");

          if (firstUserMessageText) {
            const titleResult = await generateConversationTitle(
              conversationId,
              firstUserMessageText,
            );
            if (titleResult.error) {
              console.error("[Chat API] Failed to generate title:", titleResult.error);
            } else {
              console.log("[Chat API] Title generated successfully");
            }
          }
        }
      },
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
