import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  generateConversationTitle,
  saveMessages,
} from "@/server/conversation.actions";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, webSearch, conversationId } = body as {
      messages: UIMessage[];
      webSearch?: boolean;
      conversationId?: string;
    };

    // Stream the response using Anthropic Claude
    const result = streamText({
      model: anthropic("claude-sonnet-4-5-20250929"),
      messages: convertToModelMessages(messages),
      system:
        "You are a helpful AI assistant built with Vercel AI SDK and AI Elements. Provide clear, concise, and helpful responses.",
      async onFinish({ response }) {
        // Only save if we have a conversationId
        if (!conversationId) {
          console.warn("No conversationId provided, messages not saved");
          return;
        }

        // Combine user message(s) with assistant response
        const messagesToSave: UIMessage[] = [];

        // Get the last user message (the one that triggered this response)
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage && lastUserMessage.role === "user") {
          messagesToSave.push(lastUserMessage);
        }

        // Add the assistant's response
        messagesToSave.push({
          id: response.id || crypto.randomUUID(),
          role: "assistant",
          parts: [{ type: "text", text: response.text }],
          metadata: {},
        });

        // Save messages to database
        const saveResult = await saveMessages(conversationId, messagesToSave);
        if (saveResult.error) {
          console.error("Failed to save messages:", saveResult.error);
          return;
        }

        // Generate title if this is the first message (only user message)
        if (
          messages.length === 1 &&
          lastUserMessage &&
          lastUserMessage.role === "user"
        ) {
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
              console.error("Failed to generate title:", titleResult.error);
            }
          }
        }
      },
    });

    // Return streaming response with optional sources
    return result.toUIMessageStreamResponse({
      sendSources: webSearch,
    });
  } catch (error) {
    console.error("Chat API error:", error);
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
