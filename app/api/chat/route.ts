import { convertToModelMessages, streamText, type UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, webSearch } = body as {
      messages: UIMessage[];
      model: string;
      webSearch?: boolean;
    };

    // Determine if model supports reasoning
    const supportsReasoning = model?.includes("deepseek-r1");

    // Stream the response using the actual model
    const result = streamText({
      model: webSearch ? "perplexity/sonar" : model,
      messages: convertToModelMessages(messages),
      system:
        "You are a helpful AI assistant built with Vercel AI SDK and AI Elements. Provide clear, concise, and helpful responses.",
    });

    // Return streaming response with optional reasoning and sources
    return result.toUIMessageStreamResponse({
      sendReasoning: supportsReasoning,
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
