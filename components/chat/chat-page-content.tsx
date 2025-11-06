"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useState, useEffect } from "react";
import {
  useCreateConversation,
  useConversation,
} from "@/hooks/use-conversations";
import { useQueryClient } from "@tanstack/react-query";
import { conversationKeys } from "@/hooks/use-conversations";
import { useRouter } from "next/navigation";
import { useAgentStore } from "@/stores/agent-store";
import { toast } from "sonner";

interface ChatPageContentProps {
  userId: string;
  conversationId?: string;
}

function ChatContent({ userId, conversationId }: ChatPageContentProps) {
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(conversationId);

  const router = useRouter();
  const queryClient = useQueryClient();
  const createConversationMutation = useCreateConversation();
  const { enableAutoAccept, disableAutoAccept, autoAcceptEnabled } =
    useAgentStore();

  // Fetch current conversation with messages if one is selected
  const { data: conversationData } = useConversation({
    conversationId: currentConversationId,
  });

  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: ({ message }) => {
      console.log("[Chat] useChat onFinish called");

      // Check for web search errors in the assistant's response
      if (message.role === "assistant") {
        const toolCalls = message.parts.filter(
          (p: any) => p.type === "tool-call"
        ) as any[];

        for (const toolCall of toolCalls) {
          const toolName = toolCall.toolName;
          if (
            toolName === "webSearch" ||
            toolName === "multiWebSearch" ||
            toolName === "domainWebSearch"
          ) {
            const result = toolCall.result;
            if (result && !result.success && result.userMessage) {
              console.log(
                "[Chat] Web search error detected:",
                result.userMessage
              );
              toast.error("Web Search Unavailable", {
                description: result.userMessage,
              });
              break; // Only show one error toast
            }
          }
        }
      }

      // Invalidate conversations list to show updated preview/timestamp
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
      // Invalidate current conversation to get updated messages
      if (currentConversationId) {
        console.log(
          "[Chat] Invalidating conversation queries for:",
          currentConversationId
        );
        queryClient.invalidateQueries({
          queryKey: conversationKeys.detail(currentConversationId),
        });
      }
    },
    onError: (error) => {
      console.error("[Chat] useChat error:", error);
    },
  });

  // Log messages changes
  useEffect(() => {
    console.log("[Chat] Messages state changed:", {
      count: messages.length,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        partsCount: m.parts.length,
      })),
    });
  }, [messages]);

  // Load messages when conversation is selected
  useEffect(() => {
    console.log("[Chat] Effect triggered:", {
      hasConversationData: !!conversationData,
      conversationId: conversationData?.id,
      dbMessageCount: conversationData?.messages?.length,
      localMessageCount: messages.length,
      status,
    });

    // Don't sync if we don't have conversation data yet (query still loading)
    if (!conversationData) {
      console.log("[Chat] Skipping DB sync - no conversation data yet");
      return;
    }

    // Don't sync from DB while actively streaming - preserve local state
    if (status === "streaming" || status === "submitted") {
      console.log("[Chat] Skipping DB sync - currently streaming");
      return;
    }

    // Only sync from DB if we have messages in the database
    if (conversationData.messages && conversationData.messages.length > 0) {
      // Only update if DB has more messages than local state
      // This handles: initial load after navigation, switching conversations
      if (conversationData.messages.length > messages.length) {
        // Convert database messages to UIMessage format
        const uiMessages: UIMessage[] = conversationData.messages.map(
          (msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant" | "system",
            parts: msg.parts as any, // Type cast Json to UIMessagePart[]
            metadata: (msg.metadata || {}) as Record<string, unknown>,
          })
        );

        console.log("[Chat] Loading messages from DB:", {
          count: uiMessages.length,
        });

        setMessages(uiMessages);
      } else {
        console.log(
          "[Chat] Skipping DB sync - local state is current or ahead"
        );
      }
    } else if (
      conversationData.messages &&
      conversationData.messages.length === 0 &&
      messages.length === 0
    ) {
      // Only clear messages if both DB and local are empty (new/empty conversation)
      console.log("[Chat] Empty conversation - clearing messages");
      setMessages([]);
    }
  }, [conversationData, setMessages, status]);

  const handleNewChat = () => {
    // Reset to empty state
    setCurrentConversationId(undefined);
    setInput("");
    setMessages([]);
    // Navigate to the new chat page
    router.push("/chat");
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // Navigate to the chat page with the conversation ID
    router.push(`/chat/${conversationId}`);
  };

  const handleQuestionSelect = (question: string) => {
    setInput(question);
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    console.log("[Chat] handleSubmit called", { message });

    // Create conversation if this is the first message
    let conversationId = currentConversationId;
    let isNewConversation = false;

    if (!conversationId) {
      console.log("[Chat] Creating new conversation");
      const result = await createConversationMutation.mutateAsync({
        title: "New conversation",
      });

      if (result.error || !result.data) {
        console.error("[Chat] Failed to create conversation:", result.error);
        return;
      }

      conversationId = result.data.id;
      console.log("[Chat] Conversation created:", conversationId);
      setCurrentConversationId(conversationId);
      isNewConversation = true;
    }

    console.log("[Chat] Sending message with conversationId:", conversationId);

    // Send message with conversationId - this will immediately add the user message to the messages array
    await sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          webSearch,
          conversationId,
        },
      }
    );

    console.log("[Chat] Message sent");

    // Navigate to the chat page AFTER message is sent (only for new conversations)
    if (isNewConversation) {
      console.log("[Chat] Navigating to new conversation:", conversationId);
      router.push(`/chat/${conversationId}`);
    }
  };

  // Callback for handling confirmation responses
  const handleConfirmation = async (
    confirmed: boolean,
    autoAccept?: boolean,
    confirmationData?: unknown
  ) => {
    if (confirmed && autoAccept && currentConversationId) {
      // Enable auto-accept mode
      enableAutoAccept(currentConversationId);
      toast.success("Auto-accept enabled for this conversation");
    }

    // Send a message indicating the user's choice
    let responseText = "";
    if (confirmed) {
      responseText = autoAccept
        ? "Yes, proceed with that action and automatically accept all subsequent actions."
        : "Yes, proceed with that action.";
    } else {
      responseText =
        "No, let's keep planning. I'd like to discuss this more before proceeding.";
    }

    // Send confirmation data in the body AND attach to message
    // The AI SDK sends the body to the API, so we need metadata there
    await sendMessage(
      {
        text: responseText,
      },
      {
        body: {
          webSearch,
          conversationId: currentConversationId,
          // Send confirmation data in body for API to access
          confirmationData: confirmed ? confirmationData : undefined,
          autoAcceptEnabled: autoAccept,
        },
      }
    );
  };

  // Callback for handling planning responses
  const handlePlanningResponse = async (
    answers: Record<number, string>,
    proceed: boolean
  ) => {
    // Format the answers into a clear message
    const answersText = Object.entries(answers)
      .map(([index, answer]) => `${Number(index) + 1}. ${answer}`)
      .join("\n");

    const responseText = proceed
      ? `Here are my answers:\n${answersText}\n\nPlease proceed with the suggested action.`
      : `Here are my answers:\n${answersText}\n\nLet's continue the conversation based on these answers.`;

    await sendMessage(
      { text: responseText },
      {
        body: {
          webSearch,
          conversationId: currentConversationId,
        },
      }
    );
  };

  // Callback for handling clarification responses
  const handleClarification = async (answer: string) => {
    await sendMessage(
      { text: answer },
      {
        body: {
          webSearch,
          conversationId: currentConversationId,
        },
      }
    );
  };

  // Don't show empty state if we're submitting or streaming (prevents flash)
  const showEmptyState = messages.length === 0 && status === "ready";

  console.log("[Chat] Render state:", {
    messagesCount: messages.length,
    status,
    showEmptyState,
    currentConversationId,
  });

  return (
    <>
      <ChatSidebar
        userId={userId}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />

      <SidebarInset className="flex pt-8 flex-col flex-1 min-w-0">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 md:px-6 py-6">
            {showEmptyState ? (
              <div
                className="flex items-center justify-center"
                style={{ minHeight: "calc(100vh - 250px)" }}
              >
                <ChatEmptyState onQuestionSelect={handleQuestionSelect} />
              </div>
            ) : (
              <Conversation>
                <ConversationContent>
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isLast={index === messages.length - 1}
                      status={status}
                      onRegenerate={regenerate}
                      onConfirmation={handleConfirmation}
                      onPlanningResponse={handlePlanningResponse}
                      onClarification={handleClarification}
                    />
                  ))}

                  {(status === "submitted" || status === "streaming") &&
                    messages.length > 0 &&
                    messages[messages.length - 1].role === "user" && <Loader />}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            )}
          </div>
        </div>

        {/* Input at bottom */}
        <div className="flex-shrink-0 bg-background">
          <div className="mx-auto w-full max-w-4xl px-4 md:px-6 py-4">
            <div className="bg-background border rounded-lg shadow-lg">
              <ChatInput
                input={input}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                webSearch={webSearch}
                onWebSearchChange={setWebSearch}
                status={status}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

export function ChatPageContent({
  userId,
  conversationId,
}: ChatPageContentProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-mobile": "20rem",
        } as React.CSSProperties
      }
    >
      <div className="flex w-full">
        <ChatContent userId={userId} conversationId={conversationId} />
      </div>
    </SidebarProvider>
  );
}
