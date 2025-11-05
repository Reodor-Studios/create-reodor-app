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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyIcon, RefreshCcwIcon, WrenchIcon, CheckCircle2Icon, XCircleIcon, MessageCircleIcon, AlertCircleIcon, HelpCircleIcon, SearchIcon, ExternalLinkIcon } from "lucide-react";
import { Fragment } from "react";
import type { UIMessage } from "ai";
import { toast } from "sonner";

interface ChatMessageProps {
  message: UIMessage;
  isLast: boolean;
  status: "submitted" | "streaming" | "ready" | "error";
  onRegenerate: () => void;
  onConfirmation?: (confirmed: boolean, autoAccept?: boolean, confirmationData?: any) => void;
  onPlanningResponse?: (answers: Record<number, string>, proceed: boolean) => void;
  onClarification?: (answer: string) => void;
}

export function ChatMessage({
  message,
  isLast,
  status,
  onRegenerate,
  onConfirmation,
  onPlanningResponse,
  onClarification,
}: ChatMessageProps) {
  // Filter source parts
  const sourceParts = message.parts.filter(
    (part) => part.type === "source-url"
  );
  const hasReasoningStreaming =
    status === "streaming" &&
    isLast &&
    message.parts.some((part) => part.type === "reasoning");

  // Filter tool execution parts from AI SDK Agent
  // Agent returns parts with type like "tool-getCurrentDateTime", "tool-createTodo", etc.
  const toolExecutionParts = message.parts.filter(
    (part) => typeof part.type === "string" && part.type.startsWith("tool-")
  ) as unknown as Array<{ type: string; [key: string]: any }>;

  // For backwards compatibility, also check for standard tool-call/tool-result parts
  const toolCallParts = message.parts.filter(
    (part) => part.type === "tool-call"
  ) as unknown as Array<{ type: "tool-call"; toolCallId: string; toolName: string; input: any }>;

  const toolResultParts = message.parts.filter(
    (part) => part.type === "tool-result"
  ) as unknown as Array<{ type: "tool-result"; toolCallId: string; output: any }>;

  // Combine both formats for display
  const hasToolActivity = toolExecutionParts.length > 0 || toolCallParts.length > 0;

  // Detect confirmation requests in tool results (both old and new format)
  const confirmationRequestsFromResults = toolResultParts
    .filter((part) => part.output && part.output.requiresConfirmation === true)
    .map((part) => ({
      toolCallId: part.toolCallId,
      action: part.output.action,
    }));

  const confirmationRequestsFromExecutions = toolExecutionParts
    .filter((part: any) => part.result && part.result.requiresConfirmation === true)
    .map((part: any, index) => ({
      toolCallId: `exec-${index}`,
      action: part.result.action,
    }));

  const confirmationRequests = [
    ...confirmationRequestsFromResults,
    ...confirmationRequestsFromExecutions,
  ];

  // Detect planning requests in tool results
  const planningRequestsFromResults = toolResultParts
    .filter((part) => part.output && part.output.requiresPlanning === true)
    .map((part) => ({
      toolCallId: part.toolCallId,
      plan: part.output.plan,
    }));

  const planningRequestsFromExecutions = toolExecutionParts
    .filter((part: any) => part.result && part.result.requiresPlanning === true)
    .map((part: any, index) => ({
      toolCallId: `exec-${index}`,
      plan: part.result.plan,
    }));

  const planningRequests = [
    ...planningRequestsFromResults,
    ...planningRequestsFromExecutions,
  ];

  // Detect clarification requests in tool results
  const clarificationRequestsFromResults = toolResultParts
    .filter((part) => part.output && part.output.requiresClarification === true)
    .map((part) => ({
      toolCallId: part.toolCallId,
      clarification: part.output.clarification,
    }));

  const clarificationRequestsFromExecutions = toolExecutionParts
    .filter((part: any) => part.result && part.result.requiresClarification === true)
    .map((part: any, index) => ({
      toolCallId: `exec-${index}`,
      clarification: part.result.clarification,
    }));

  const clarificationRequests = [
    ...clarificationRequestsFromResults,
    ...clarificationRequestsFromExecutions,
  ];

  const handleCopy = async (text: string) => {
    await toast.promise(navigator.clipboard.writeText(text), {
      loading: "Copying...",
      success: "Copied to clipboard",
      error: "Failed to copy",
    });
  };

  // Show chain of thought during streaming OR if tools were executed
  const shouldShowChainOfThought = message.role === "assistant" && hasToolActivity;

  return (
    <BlurFade delay={0.1} duration={0.5}>
      <div className="space-y-2">
        {/* Tool Calls (shown during streaming and after completion) */}
        {shouldShowChainOfThought && (
          <ChainOfThought defaultOpen={status === "streaming" && isLast}>
            <ChainOfThoughtHeader>
              Tool Usage ({toolExecutionParts.length + toolCallParts.length}{" "}
              {(toolExecutionParts.length + toolCallParts.length) === 1 ? "call" : "calls"})
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {/* Render AI SDK Agent tool executions */}
              {toolExecutionParts.map((toolExecution, index) => {
                // Extract tool name from type (e.g., "tool-createTodo" -> "createTodo")
                const toolName = toolExecution.type.replace("tool-", "");
                const toolData = toolExecution as any;

                // Determine status based on whether the tool has output/result
                const hasOutput = toolData.result !== undefined || toolData.output !== undefined;
                const isCurrentlyExecuting = status === "streaming" && isLast && !hasOutput;

                // Check if this is a web search tool
                const isWebSearch = ["webSearch", "multiWebSearch", "domainWebSearch"].includes(toolName);

                return (
                  <ChainOfThoughtStep
                    key={`tool-exec-${index}`}
                    icon={isWebSearch ? SearchIcon : WrenchIcon}
                    label={toolName}
                    description={
                      isCurrentlyExecuting
                        ? "Running..."
                        : hasOutput
                          ? "Completed"
                          : "Pending"
                    }
                    status={
                      isCurrentlyExecuting
                        ? "active"
                        : hasOutput
                          ? "complete"
                          : "pending"
                    }
                  >
                    <div className="space-y-2">
                      {/* Tool Arguments (if available) */}
                      {toolData.args && (
                        <>
                          <div className="text-xs text-muted-foreground">
                            Input:
                          </div>
                          <div className="rounded-md bg-muted p-2 text-xs">
                            <pre className="overflow-x-auto">
                              {JSON.stringify(toolData.args, null, 2)}
                            </pre>
                          </div>
                        </>
                      )}

                      {/* Tool Result - Special handling for web search */}
                      {toolData.result && (
                        <>
                          <div className="text-xs text-muted-foreground pt-2">
                            Result:
                          </div>
                          {isWebSearch && toolData.result.success && toolData.result.results ? (
                            <div className="space-y-2">
                              {/* Web Search Results Display */}
                              {Array.isArray(toolData.result.results) ? (
                                toolData.result.results.map((result: any, resultIndex: number) => (
                                  <div
                                    key={resultIndex}
                                    className="rounded-md bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 border p-3 space-y-1"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <a
                                        href={result.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1"
                                      >
                                        {result.title}
                                        <ExternalLinkIcon className="size-3" />
                                      </a>
                                    </div>
                                    {result.snippet && (
                                      <p className="text-xs text-blue-800 dark:text-blue-200 line-clamp-3">
                                        {result.snippet}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                                      {result.publishedDate && (
                                        <span>Published: {result.publishedDate}</span>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-md bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 border p-2 text-xs">
                                  <pre className="overflow-x-auto text-green-800 dark:text-green-200">
                                    {typeof toolData.result === "string"
                                      ? toolData.result
                                      : JSON.stringify(toolData.result, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-md bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 border p-2 text-xs">
                              <pre className="overflow-x-auto text-green-800 dark:text-green-200">
                                {typeof toolData.result === "string"
                                  ? toolData.result
                                  : JSON.stringify(toolData.result, null, 2)}
                              </pre>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </ChainOfThoughtStep>
                );
              })}

              {/* Render standard tool-call/tool-result parts (backwards compatibility) */}
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

        {/* Confirmation Requests (detected from tool results) */}
        {message.role === "assistant" && confirmationRequests.length > 0 && (
          <>
            {confirmationRequests.map((req, i) => (
              <Card key={`${message.id}-confirmation-${i}`} className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircleIcon className="size-5 text-amber-600 dark:text-amber-400" />
                    <CardTitle className="text-amber-900 dark:text-amber-100">Action Requires Confirmation</CardTitle>
                  </div>
                  <CardDescription className="text-amber-800 dark:text-amber-200">
                    {req.action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Action Details */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-amber-900 dark:text-amber-100">Details:</div>
                    <div className="rounded-md bg-white dark:bg-amber-950/50 p-3 space-y-1">
                      {Object.entries(req.action.details).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium text-amber-900 dark:text-amber-100">{key}:</span>{" "}
                          <span className="text-amber-800 dark:text-amber-200">
                            {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Impact */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-amber-900 dark:text-amber-100">Impact:</div>
                    <div className="rounded-md bg-white dark:bg-amber-950/50 p-3">
                      <p className="text-sm text-amber-800 dark:text-amber-200">{req.action.impact}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => onConfirmation?.(true, false, req.action.data)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2Icon className="size-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => onConfirmation?.(true, true, req.action.data)}
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-50 dark:border-green-400 dark:text-green-300 dark:hover:bg-green-950/30"
                  >
                    <CheckCircle2Icon className="size-4 mr-2" />
                    Accept All
                  </Button>
                  <Button
                    onClick={() => onConfirmation?.(false)}
                    variant="outline"
                    className="border-amber-600 text-amber-700 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-300 dark:hover:bg-amber-950/30"
                  >
                    <MessageCircleIcon className="size-4 mr-2" />
                    Keep Planning
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </>
        )}

        {/* Planning Requests (detected from tool results) */}
        {message.role === "assistant" && planningRequests.length > 0 && (
          <>
            {planningRequests.map((req, i) => (
              <Card key={`${message.id}-planning-${i}`} className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HelpCircleIcon className="size-5 text-purple-600 dark:text-purple-400" />
                    <CardTitle className="text-purple-900 dark:text-purple-100">Planning Phase</CardTitle>
                  </div>
                  <CardDescription className="text-purple-800 dark:text-purple-200">
                    {req.plan.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Questions */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      I have a few questions to clarify:
                    </div>
                    {req.plan.questions.map((q: any, qIndex: number) => (
                      <div key={qIndex} className="rounded-md bg-white dark:bg-purple-950/50 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5 border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300">
                            {qIndex + 1}
                          </Badge>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">{q.question}</p>
                            <p className="text-xs text-purple-700 dark:text-purple-300 italic">
                              Why: {q.rationale}
                            </p>
                            {q.options && q.options.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {q.options.map((option: string, oIndex: number) => (
                                  <Badge key={oIndex} variant="secondary" className="text-xs">
                                    {option}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Suggested Action (if available) */}
                  {req.plan.suggestedAction && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        Suggested Action:
                      </div>
                      <div className="rounded-md bg-white dark:bg-purple-950/50 p-3 space-y-2">
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          {req.plan.suggestedAction.description}
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Steps:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            {req.plan.suggestedAction.steps.map((step: string, sIndex: number) => (
                              <li key={sIndex} className="text-xs text-purple-800 dark:text-purple-200">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-sm text-purple-700 dark:text-purple-300">
                  Please answer these questions in the chat to proceed.
                </CardFooter>
              </Card>
            ))}
          </>
        )}

        {/* Clarification Requests (detected from tool results) */}
        {message.role === "assistant" && clarificationRequests.length > 0 && (
          <>
            {clarificationRequests.map((req, i) => (
              <Card key={`${message.id}-clarification-${i}`} className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HelpCircleIcon className="size-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-blue-900 dark:text-blue-100">Clarification Needed</CardTitle>
                  </div>
                  <CardDescription className="text-blue-800 dark:text-blue-200">
                    {req.clarification.context}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md bg-white dark:bg-blue-950/50 p-3">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {req.clarification.question}
                    </p>
                  </div>
                  {req.clarification.suggestedAnswers && req.clarification.suggestedAnswers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-blue-700 dark:text-blue-300">Suggested answers:</p>
                      <div className="flex flex-wrap gap-2">
                        {req.clarification.suggestedAnswers.map((answer: string, aIndex: number) => (
                          <Button
                            key={aIndex}
                            onClick={() => onClarification?.(answer)}
                            variant="outline"
                            size="sm"
                            className="border-blue-600 text-blue-700 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-950/50"
                          >
                            {answer}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-sm text-blue-700 dark:text-blue-300">
                  Please provide your answer in the chat.
                </CardFooter>
              </Card>
            ))}
          </>
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
              // Handle tool execution parts (type starts with "tool-")
              if (typeof part.type === "string" && part.type.startsWith("tool-")) {
                // Rendered in ChainOfThought section above
                return null;
              }
              // Handle step-start parts from agent
              if (part.type === "step-start") {
                return null;
              }
              // Handle custom part types (confirmation, planning, clarification)
              // These are rendered in dedicated sections above
              const partType = (part as any).type;
              if (
                partType === "confirmation-request" ||
                partType === "planning-request" ||
                partType === "clarification-request" ||
                partType === "confirmation-response" ||
                partType === "planning-response" ||
                partType === "clarification-response"
              ) {
                return null;
              }
              return null;
          }
        })}
      </div>
    </BlurFade>
  );
}
