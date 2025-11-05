"use client";

import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Action, Actions } from "@/components/ai-elements/actions";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { BlurFade } from "@/components/ui/blur-fade";
import { CopyIcon, RefreshCcwIcon, WrenchIcon } from "lucide-react";
import { Fragment } from "react";
import type { UIMessage } from "ai";
import { toast } from "sonner";

interface ChatMessageProps {
  message: UIMessage;
  isLast: boolean;
  status: "submitted" | "streaming" | "ready" | "error";
  onRegenerate: () => void;
}

export function ChatMessage({
  message,
  isLast,
  status,
  onRegenerate,
}: ChatMessageProps) {
  // Filter source parts
  const sourceParts = message.parts.filter(
    (part) => part.type === "source-url"
  );
  const hasReasoningStreaming =
    status === "streaming" &&
    isLast &&
    message.parts.some((part) => part.type === "reasoning");

  // Filter tool call parts (with type assertion for tool-specific properties)
  const toolCallParts = message.parts.filter(
    (part) => part.type === "tool-call"
  ) as unknown as Array<{ type: "tool-call"; toolCallId: string; toolName: string; input: any }>;

  const toolResultParts = message.parts.filter(
    (part) => part.type === "tool-result"
  ) as unknown as Array<{ type: "tool-result"; toolCallId: string; output: any }>;

  const handleCopy = async (text: string) => {
    await toast.promise(navigator.clipboard.writeText(text), {
      loading: "Copying...",
      success: "Copied to clipboard",
      error: "Failed to copy",
    });
  };

  return (
    <BlurFade delay={0.1} duration={0.5}>
      <div className="space-y-2">
        {/* Tool Calls (if available) */}
        {message.role === "assistant" && toolCallParts.length > 0 && (
          <ChainOfThought defaultOpen={false}>
            <ChainOfThoughtHeader>
              Tool Usage ({toolCallParts.length}{" "}
              {toolCallParts.length === 1 ? "call" : "calls"})
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {toolCallParts.map((toolCall, index) => {
                // Find corresponding result
                const result = toolResultParts.find(
                  (r) => r.toolCallId === toolCall.toolCallId
                );

                return (
                  <ChainOfThoughtStep
                    key={toolCall.toolCallId}
                    icon={WrenchIcon}
                    label={`${toolCall.toolName}`}
                    description={
                      result
                        ? "Completed"
                        : status === "streaming" && isLast
                          ? "Running..."
                          : "Pending"
                    }
                    status={
                      result
                        ? "complete"
                        : status === "streaming" && isLast
                          ? "active"
                          : "pending"
                    }
                  >
                    {/* Tool Input */}
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Input:
                      </div>
                      <div className="rounded-md bg-muted p-2 text-xs">
                        <pre className="overflow-x-auto">
                          {JSON.stringify(toolCall.input, null, 2)}
                        </pre>
                      </div>

                      {/* Tool Result */}
                      {result && (
                        <>
                          <div className="text-xs text-muted-foreground pt-2">
                            Result:
                          </div>
                          <div className="rounded-md bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 border p-2 text-xs">
                            <pre className="overflow-x-auto text-green-800 dark:text-green-200">
                              {typeof result.output === "string"
                                ? result.output
                                : JSON.stringify(result.output, null, 2)}
                            </pre>
                          </div>
                        </>
                      )}
                    </div>
                  </ChainOfThoughtStep>
                );
              })}
            </ChainOfThoughtContent>
          </ChainOfThought>
        )}

        {/* Sources (if available) */}
        {message.role === "assistant" && sourceParts.length > 0 && (
          <Sources>
            <SourcesTrigger count={sourceParts.length} />
            {sourceParts.map((part, i) => (
              <SourcesContent key={`${message.id}-source-${i}`}>
                <Source
                  href={part.url}
                  title={part.title || new URL(part.url).hostname}
                />
              </SourcesContent>
            ))}
          </Sources>
        )}

        {/* Message parts */}
        {message.parts.map((part, partIndex) => {
          switch (part.type) {
            case "text":
              return (
                <Fragment key={`${message.id}-${partIndex}`}>
                  <Message from={message.role}>
                    <MessageContent>
                      <Response>{part.text}</Response>
                    </MessageContent>
                  </Message>

                  {/* Actions for assistant messages */}
                  {message.role === "assistant" &&
                    partIndex === message.parts.length - 1 && (
                      <Actions className="mt-2">
                        <Action onClick={onRegenerate} label="Retry">
                          <RefreshCcwIcon className="size-3" />
                        </Action>
                        <Action
                          onClick={() => handleCopy(part.text)}
                          label="Copy"
                        >
                          <CopyIcon className="size-3" />
                        </Action>
                      </Actions>
                    )}
                </Fragment>
              );

            case "reasoning":
              return (
                <Reasoning
                  key={`${message.id}-${partIndex}`}
                  className="w-full"
                  isStreaming={hasReasoningStreaming}
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              );

            case "file":
              if (part.mediaType?.startsWith("image/")) {
                return (
                  <div
                    key={`${message.id}-${partIndex}`}
                    className="rounded-lg overflow-hidden border max-w-sm"
                  >
                    <img
                      src={part.url}
                      alt={part.filename || "Uploaded image"}
                      className="w-full h-auto"
                    />
                    {part.filename && (
                      <div className="p-2 bg-muted text-xs">
                        {part.filename}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div
                  key={`${message.id}-${partIndex}`}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-muted"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {part.filename || "File"}
                    </div>
                    {part.mediaType && (
                      <div className="text-xs text-muted-foreground">
                        {part.mediaType}
                      </div>
                    )}
                  </div>
                </div>
              );

            case "tool-call":
            case "tool-result":
              // Tool calls and results are rendered in the ChainOfThought section above
              return null;

            default:
              return null;
          }
        })}
      </div>
    </BlurFade>
  );
}
