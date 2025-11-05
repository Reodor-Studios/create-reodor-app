import { convertToModelMessages, type UIMessage } from "ai";
import {
  generateConversationTitle,
  saveMessages,
} from "@/server/conversation.actions";
import { chatAgent } from "@/lib/chat-agent";

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

    // Use the agent's stream method to get the streaming response
    const result = await chatAgent.stream({
      messages: convertToModelMessages(messages),
    });

    // Return streaming response with onFinish callback for message persistence
    return result.toUIMessageStreamResponse({
      async onFinish({ responseMessage }) {
        const text = responseMessage.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => ("text" in p ? p.text : ""))
          .join("");
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
          id: crypto.randomUUID(),
          role: "assistant",
          parts: [{ type: "text", text: text }],
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
