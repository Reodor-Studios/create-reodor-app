import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, webSearch } = body as {
      messages: UIMessage[];
      webSearch?: boolean;
    };

    // Stream the response using Anthropic Claude
    const result = streamText({
      model: anthropic("claude-sonnet-4-5-20250929"),
      messages: convertToModelMessages(messages),
      system:
        "You are a helpful AI assistant built with Vercel AI SDK and AI Elements. Provide clear, concise, and helpful responses.",
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
