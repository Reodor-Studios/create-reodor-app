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
import { BlurFade } from "@/components/ui/blur-fade";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { Fragment } from "react";
import type { UIMessage } from "ai";

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
  const sourceParts = message.parts.filter((part) => part.type === "source-url");
  const hasReasoningStreaming =
    status === "streaming" &&
    isLast &&
    message.parts.some((part) => part.type === "reasoning");

  return (
    <BlurFade delay={0.1} duration={0.5} inView>
      <div className="space-y-2">
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
                          onClick={() => navigator.clipboard.writeText(part.text)}
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

            case "tool-weather":
            case "tool-calculator":
              // Render tool call results
              return (
                <div
                  key={`${message.id}-${partIndex}`}
                  className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-4"
                >
                  <div className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                    Tool: {part.type.replace("tool-", "")}
                  </div>
                  <pre className="text-xs text-blue-800 dark:text-blue-200 overflow-x-auto">
                    {JSON.stringify(part, null, 2)}
                  </pre>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </BlurFade>
  );
}
