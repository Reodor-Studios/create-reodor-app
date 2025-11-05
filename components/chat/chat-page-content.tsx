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
import { DefaultChatTransport } from "ai";
import { type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useState } from "react";

interface ChatPageContentProps {
  userId: string;
}

function ChatContent() {
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(undefined);

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
        <ChatContent />
      </div>
    </SidebarProvider>
  );
}
