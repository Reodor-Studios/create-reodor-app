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

interface ChatPageContentProps {
  userId: string;
}

interface ChatContentProps {
  userId: string;
}

function ChatContent({ userId }: ChatContentProps) {
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(undefined);

  const queryClient = useQueryClient();
  const createConversationMutation = useCreateConversation();

  // Fetch current conversation with messages if one is selected
  const { data: conversationData } = useConversation({
    conversationId: currentConversationId,
  });

  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: () => {
      // Invalidate conversations list to show updated preview/timestamp
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
      // Invalidate current conversation to get updated messages
      if (currentConversationId) {
        queryClient.invalidateQueries({
          queryKey: conversationKeys.detail(currentConversationId),
        });
      }
    },
  });

  // Load messages when conversation is selected
  useEffect(() => {
    if (conversationData?.messages) {
      // Convert database messages to UIMessage format
      const uiMessages: UIMessage[] = conversationData.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        parts: msg.parts as any, // Type cast Json to UIMessagePart[]
        metadata: (msg.metadata || {}) as Record<string, unknown>,
      }));
      setMessages(uiMessages);
    }
  }, [conversationData, setMessages]);

  const handleNewChat = () => {
    // Reset to empty state
    setCurrentConversationId(undefined);
    setInput("");
    setMessages([]);
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleQuestionSelect = (question: string) => {
    setInput(question);
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    // Create conversation if this is the first message
    let conversationId = currentConversationId;

    if (!conversationId) {
      const result = await createConversationMutation.mutateAsync({
        title: "New conversation",
      });

      if (result.error || !result.data) {
        return;
      }

      conversationId = result.data.id;
      setCurrentConversationId(conversationId);
    }

    // Send message with conversationId
    sendMessage(
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
  };

  const showEmptyState = messages.length === 0;

  return (
    <>
      <ChatSidebar
        userId={userId}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />

      <SidebarInset className="flex flex-col flex-1 min-w-0">
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
                disabled={status === "submitted" || status === "streaming"}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

export function ChatPageContent({ userId }: ChatPageContentProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-mobile": "20rem",
        } as React.CSSProperties
      }
    >
      {/* Full height container accounting for navbar (h-16 = 64px) */}
      <div className="flex w-full" style={{ height: "calc(100vh - 64px)" }}>
        <ChatContent userId={userId} />
      </div>
    </SidebarProvider>
  );
}
