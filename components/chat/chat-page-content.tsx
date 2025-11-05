"use client";

import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
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
import { DefaultChatTransport } from "ai";
import { type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChatPageContentProps {
  userId: string;
}

function ChatContent({ userId }: ChatPageContentProps) {
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(undefined);
  const { open } = useSidebar();

  const { messages, sendMessage, status, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const handleNewChat = () => {
    // Reset to empty state
    setCurrentConversationId(undefined);
    setInput("");
    // In production, this would trigger conversation creation
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // In production, this would load conversation messages from database
    console.log("Load conversation:", conversationId);
  };

  const handleQuestionSelect = (question: string) => {
    setInput(question);
    // Optionally auto-submit
    // sendMessage(
    //   { text: question },
    //   {
    //     body: { model, webSearch },
    //   }
    // );
  };

  const handleSubmit = (message: PromptInputMessage) => {
    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          webSearch,
        },
      }
    );
  };

  const showEmptyState = messages.length === 0;

  return (
    <>
      <ChatSidebar
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />

      <SidebarInset className="flex flex-col h-full w-full relative">
        {/* Scrollable content area with padding for fixed input and bottom spacing */}
        <div className="flex-1 overflow-y-auto pb-[250px]">
          <div
            className={cn(
              "mx-auto transition-all duration-300 px-4 md:px-6",
              open ? "max-w-4xl" : "max-w-4xl"
            )}
          >
            {showEmptyState ? (
              <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <ChatEmptyState onQuestionSelect={handleQuestionSelect} />
              </div>
            ) : (
              <Conversation className="min-h-[calc(100vh-200px)]">
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

        {/* Fixed input at bottom of viewport - respects sidebar on desktop */}
        <div className="fixed bottom-6 left-0 right-0 z-40 md:left-auto md:right-auto md:w-full">
          <div className="w-full px-4 md:px-6">
            <div
              className={cn(
                "mx-auto transition-all duration-300 bg-background border rounded-lg shadow-lg",
                open ? "max-w-4xl" : "max-w-4xl"
              )}
            >
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
      defaultOpen
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-mobile": "20rem",
        } as React.CSSProperties
      }
    >
      {/* Account for navbar height (min-h-16 = 64px) */}
      <div className="flex w-full h-screen pt-18">
        <ChatContent userId={userId} />
      </div>
    </SidebarProvider>
  );
}
